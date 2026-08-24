import express from 'express';
import crypto from 'node:crypto';
import { dbAuthMiddleware } from './authRouter';
import { dbQuery } from './client';

export const dbMonetizationRouter = express.Router();

function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ success:false, error:'Chỉ Super Admin mới có quyền thực hiện thao tác này.' });
  next();
}

async function getSubscription(tenantId: string) {
  const r = await dbQuery(`SELECT s.id,s.plan_code AS "planCode",s.status,s.started_at AS "startedAt",s.expires_at AS "expiresAt",s.max_users AS "maxUsers",p.name AS "planName",p.max_products AS "maxProducts",p.max_orders_per_month AS "maxOrdersPerMonth",p.ads_enabled AS "adsEnabled",p.features AS features FROM subscriptions s LEFT JOIN plans p ON p.code=s.plan_code WHERE s.tenant_id=$1 ORDER BY s.created_at DESC LIMIT 1`, [tenantId]);
  return r.rows[0] ?? null;
}

async function getOrCreateUsage(tenantId: string, period = new Date()) {
  const month = `${period.getUTCFullYear()}-${String(period.getUTCMonth()+1).padStart(2,'0')}-01`;
  const r = await dbQuery(`INSERT INTO usage_counters (id,tenant_id,period_start,orders_created,products_count,rewarded_orders_used,ad_impressions,ad_clicks) VALUES ($1,$2,$3,0,0,0,0,0) ON CONFLICT (tenant_id,period_start) DO UPDATE SET tenant_id=EXCLUDED.tenant_id RETURNING id,tenant_id AS "tenantId",period_start AS "periodStart",orders_created AS "ordersCreated",products_count AS "productsCount",rewarded_orders_used AS "rewardedOrdersUsed",ad_impressions AS "adImpressions",ad_clicks AS "adClicks"`, [crypto.randomUUID(),tenantId,month]);
  return r.rows[0];
}

// Public-to-authenticated plan catalogue. No payment provider is required to use Free.
dbMonetizationRouter.get('/plans', dbAuthMiddleware(), async (_req:any,res:any) => {
  try {
    const r=await dbQuery(`SELECT code,name,description,price_amount AS "priceAmount",currency,billing_period_months AS "billingPeriodMonths",max_users AS "maxUsers",max_products AS "maxProducts",max_orders_per_month AS "maxOrdersPerMonth",ads_enabled AS "adsEnabled",features,active FROM plans WHERE active=TRUE ORDER BY sort_order,price_amount`);
    return res.json({success:true,plans:r.rows});
  } catch { return res.status(500).json({success:false,error:'Không thể tải danh sách gói.'}); }
});

dbMonetizationRouter.get('/subscription', dbAuthMiddleware(), async (req:any,res:any) => {
  try {
    if (!req.user?.tenantId) return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const [subscription,usage]=await Promise.all([getSubscription(req.user.tenantId),getOrCreateUsage(req.user.tenantId)]);
    return res.json({success:true,subscription,usage});
  } catch { return res.status(500).json({success:false,error:'Không thể tải trạng thái gói.'}); }
});

// Atomically reserve one sales order slot. Only actual sales-order creation should call this endpoint.
dbMonetizationRouter.post('/usage/orders/consume', dbAuthMiddleware(), async (req:any,res:any) => {
  try {
    const tenantId=req.user?.tenantId; if(!tenantId) return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const sub=await getSubscription(tenantId); if(!sub) return res.status(403).json({success:false,error:'Tenant chưa có gói dịch vụ.'});
    if (sub.planCode !== 'FREE' && sub.planCode !== 'PREMIUM') return res.status(403).json({success:false,error:'Gói dịch vụ không hợp lệ.'});
    const usage=await getOrCreateUsage(tenantId);
    const limit=Number(sub.maxOrdersPerMonth ?? 1000);
    if (Number(usage.ordersCreated) >= limit) return res.status(429).json({success:false,code:'ORDER_LIMIT_REACHED',message:`Đã đạt ${limit} đơn bán trong tháng.`,usage,canEarnWithAd:sub.adsEnabled===true});
    const r=await dbQuery(`UPDATE usage_counters SET orders_created=orders_created+1,updated_at=NOW() WHERE tenant_id=$1 AND period_start=$2 RETURNING orders_created AS "ordersCreated"`,[tenantId,usage.periodStart]);
    return res.json({success:true,ordersCreated:r.rows[0].ordersCreated,limit});
  } catch { return res.status(500).json({success:false,error:'Không thể cập nhật hạn mức giao dịch.'}); }
});

// Rewarded ad: after a completed ad, grant configurable extra sales-order slots.
dbMonetizationRouter.post('/usage/reward-ad', dbAuthMiddleware(), async (req:any,res:any) => {
  try {
    const tenantId=req.user?.tenantId; if(!tenantId) return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const sub=await getSubscription(tenantId); if(!sub?.adsEnabled) return res.status(403).json({success:false,error:'Gói hiện tại không sử dụng quảng cáo.'});
    const adId=String(req.body?.adId ?? ''); if(!adId) return res.status(400).json({success:false,error:'Thiếu adId.'});
    const ad=await dbQuery(`SELECT id,reward_orders AS "rewardOrders",rewarded_daily_limit AS "rewardedDailyLimit",active FROM advertisements WHERE id=$1 AND active=TRUE`,[adId]);
    if(!ad.rows[0]) return res.status(404).json({success:false,error:'Quảng cáo không tồn tại hoặc đã tắt.'});
    const today=new Date(); today.setUTCHours(0,0,0,0);
    const count=await dbQuery<{count:string}>(`SELECT COUNT(*)::text AS count FROM ad_reward_events WHERE tenant_id=$1 AND ad_id=$2 AND created_at >= $3`,[tenantId,adId,today]);
    if(Number(count.rows[0]?.count||0) >= Number(ad.rows[0].rewardedDailyLimit||6)) return res.status(429).json({success:false,error:'Đã đạt giới hạn lượt nhận thưởng quảng cáo hôm nay.'});
    const usage=await getOrCreateUsage(tenantId);
    await dbQuery(`INSERT INTO ad_reward_events (id,tenant_id,user_id,ad_id,reward_orders) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(),tenantId,req.user.uid,adId,Number(ad.rows[0].rewardOrders||5)]);
    await dbQuery(`UPDATE usage_counters SET rewarded_orders_used=rewarded_orders_used+$3,updated_at=NOW() WHERE tenant_id=$1 AND period_start=$2`,[tenantId,usage.periodStart,Number(ad.rows[0].rewardOrders||5)]);
    return res.json({success:true,grantedOrders:Number(ad.rows[0].rewardOrders||5)});
  } catch { return res.status(500).json({success:false,error:'Không thể ghi nhận lượt xem quảng cáo.'}); }
});

// Select an eligible ad. Frequency is controlled by Super Admin configuration.
dbMonetizationRouter.get('/ads/next', dbAuthMiddleware(), async (req:any,res:any) => {
  try {
    const tenantId=req.user?.tenantId; if(!tenantId) return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const sub=await getSubscription(tenantId); if(!sub?.adsEnabled) return res.json({success:true,ad:null});
    const r=await dbQuery(`SELECT a.id,a.title,a.description,a.media_url AS "mediaUrl",a.media_type AS "mediaType",a.cta_label AS "ctaLabel",a.affiliate_url AS "affiliateUrl",a.placement,a.frequency_hours AS "frequencyHours",a.reward_orders AS "rewardOrders",a.rewarded_daily_limit AS "rewardedDailyLimit" FROM advertisements a WHERE a.active=TRUE AND (a.starts_at IS NULL OR a.starts_at<=NOW()) AND (a.ends_at IS NULL OR a.ends_at>NOW()) AND (a.target_plan='ALL' OR a.target_plan=$1) ORDER BY a.priority DESC,random() LIMIT 1`,[sub.planCode]);
    return res.json({success:true,ad:r.rows[0]??null});
  } catch { return res.status(500).json({success:false,error:'Không thể tải quảng cáo.'}); }
});

dbMonetizationRouter.post('/ads/impression', dbAuthMiddleware(), async (req:any,res:any) => {
  try { const tenantId=req.user?.tenantId; const adId=String(req.body?.adId||''); if(!tenantId||!adId) return res.status(400).json({success:false,error:'Thiếu dữ liệu.'}); await dbQuery(`INSERT INTO ad_events (id,tenant_id,user_id,ad_id,event_type,placement,metadata) VALUES ($1,$2,$3,$4,'impression',$5,$6)`,[crypto.randomUUID(),tenantId,req.user.uid,adId,String(req.body?.placement||'unknown'),JSON.stringify({anonymous:true})]); await dbQuery(`UPDATE usage_counters SET ad_impressions=ad_impressions+1,updated_at=NOW() WHERE tenant_id=$1 AND period_start=date_trunc('month',NOW())::date`,[tenantId]); return res.json({success:true}); } catch { return res.status(500).json({success:false,error:'Không thể ghi nhận quảng cáo.'}); }
});

dbMonetizationRouter.post('/ads/click', dbAuthMiddleware(), async (req:any,res:any) => {
  try { const tenantId=req.user?.tenantId; const adId=String(req.body?.adId||''); if(!tenantId||!adId) return res.status(400).json({success:false,error:'Thiếu dữ liệu.'}); const r=await dbQuery<{url:string}>(`SELECT affiliate_url AS url FROM advertisements WHERE id=$1 AND active=TRUE`,[adId]); if(!r.rows[0]?.url) return res.status(404).json({success:false,error:'Liên kết không tồn tại.'}); await dbQuery(`INSERT INTO ad_events (id,tenant_id,user_id,ad_id,event_type,placement,metadata) VALUES ($1,$2,$3,$4,'click',$5,$6)`,[crypto.randomUUID(),tenantId,req.user.uid,adId,String(req.body?.placement||'unknown'),JSON.stringify({anonymous:true})]); await dbQuery(`UPDATE usage_counters SET ad_clicks=ad_clicks+1,updated_at=NOW() WHERE tenant_id=$1 AND period_start=date_trunc('month',NOW())::date`,[tenantId]); return res.json({success:true,url:r.rows[0].url}); } catch { return res.status(500).json({success:false,error:'Không thể ghi nhận click.'}); }
});

// Request more seats. Customer never directly increases maxUsers.
dbMonetizationRouter.post('/user-limit-requests', dbAuthMiddleware(), async (req:any,res:any) => {
  try { const tenantId=req.user?.tenantId; if(!tenantId) return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'}); const requested=Math.max(4,Number(req.body?.requestedUsers||4)); const r=await dbQuery(`INSERT INTO user_limit_requests (id,tenant_id,requested_by,requested_users,note,status) VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING id,requested_users AS "requestedUsers",status,created_at AS "createdAt"`,[crypto.randomUUID(),tenantId,req.user.uid,requested,String(req.body?.note||'')]); return res.status(201).json({success:true,request:r.rows[0]}); } catch { return res.status(500).json({success:false,error:'Không thể gửi yêu cầu tăng số user.'}); }
});

// Super Admin plan/ads management.
dbMonetizationRouter.get('/admin/plans', dbAuthMiddleware(), requireSuperAdmin, async (_req:any,res:any)=>{try{const r=await dbQuery(`SELECT * FROM plans ORDER BY sort_order,price_amount`);return res.json({success:true,plans:r.rows});}catch{return res.status(500).json({success:false,error:'Không thể tải plans.'});}});

dbMonetizationRouter.post('/admin/plans', dbAuthMiddleware(), requireSuperAdmin, async (req:any,res:any)=>{try{const b=req.body||{};const code=String(b.code||'').trim().toUpperCase();if(!code)return res.status(400).json({success:false,error:'Thiếu mã plan.'});const r=await dbQuery(`INSERT INTO plans (code,name,description,price_amount,currency,billing_period_months,max_users,max_products,max_orders_per_month,ads_enabled,features,sort_order,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE) ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,price_amount=EXCLUDED.price_amount,currency=EXCLUDED.currency,billing_period_months=EXCLUDED.billing_period_months,max_users=EXCLUDED.max_users,max_products=EXCLUDED.max_products,max_orders_per_month=EXCLUDED.max_orders_per_month,ads_enabled=EXCLUDED.ads_enabled,features=EXCLUDED.features,sort_order=EXCLUDED.sort_order,active=EXCLUDED.active RETURNING *`,[code,String(b.name||code),String(b.description||''),Number(b.priceAmount||0),String(b.currency||'VND'),Number(b.billingPeriodMonths||0),Math.max(1,Number(b.maxUsers||1)),Math.max(0,Number(b.maxProducts||1000)),Math.max(0,Number(b.maxOrdersPerMonth||1000)),Boolean(b.adsEnabled),JSON.stringify(b.features||{}),Number(b.sortOrder||100)]);return res.status(201).json({success:true,plan:r.rows[0]});}catch{return res.status(500).json({success:false,error:'Không thể lưu plan.'});}});

dbMonetizationRouter.get('/admin/ads', dbAuthMiddleware(), requireSuperAdmin, async (_req:any,res:any)=>{try{const r=await dbQuery(`SELECT id,title,description,media_url AS "mediaUrl",media_type AS "mediaType",cta_label AS "ctaLabel",affiliate_url AS "affiliateUrl",placement,target_plan AS "targetPlan",frequency_hours AS "frequencyHours",reward_orders AS "rewardOrders",rewarded_daily_limit AS "rewardedDailyLimit",priority,starts_at AS "startsAt",ends_at AS "endsAt",active FROM advertisements ORDER BY priority DESC,created_at DESC`);return res.json({success:true,ads:r.rows});}catch{return res.status(500).json({success:false,error:'Không thể tải quảng cáo.'});}});

dbMonetizationRouter.post('/admin/ads', dbAuthMiddleware(), requireSuperAdmin, async (req:any,res:any)=>{try{const b=req.body||{};const r=await dbQuery(`INSERT INTO advertisements (id,title,description,media_url,media_type,cta_label,affiliate_url,placement,target_plan,frequency_hours,reward_orders,rewarded_daily_limit,priority,starts_at,ends_at,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,[crypto.randomUUID(),String(b.title||'Quảng cáo'),String(b.description||''),String(b.mediaUrl||''),String(b.mediaType||'image'),String(b.ctaLabel||'Xem ưu đãi'),String(b.affiliateUrl||''),String(b.placement||'module_inline'),String(b.targetPlan||'FREE'),Math.max(1,Number(b.frequencyHours||4)),Math.max(0,Number(b.rewardOrders||5)),Math.max(1,Number(b.rewardedDailyLimit||6)),Number(b.priority||0),b.startsAt||null,b.endsAt||null,b.active!==false]);return res.status(201).json({success:true,ad:r.rows[0]});}catch{return res.status(500).json({success:false,error:'Không thể tạo quảng cáo.'});}});

dbMonetizationRouter.get('/admin/user-limit-requests', dbAuthMiddleware(), requireSuperAdmin, async (_req:any,res:any)=>{try{const r=await dbQuery(`SELECT r.id,r.tenant_id AS "tenantId",t.name AS "tenantName",r.requested_users AS "requestedUsers",r.note,r.status,r.created_at AS "createdAt" FROM user_limit_requests r JOIN tenants t ON t.id=r.tenant_id ORDER BY r.created_at DESC`);return res.json({success:true,requests:r.rows});}catch{return res.status(500).json({success:false,error:'Không thể tải yêu cầu user.'});}});

dbMonetizationRouter.post('/admin/user-limit-requests/:id/approve', dbAuthMiddleware(), requireSuperAdmin, async (req:any,res:any)=>{try{const requested=Math.max(3,Number(req.body?.maxUsers||0));const r=await dbQuery(`SELECT tenant_id AS "tenantId" FROM user_limit_requests WHERE id=$1 AND status='PENDING'`,[req.params.id]);if(!r.rows[0])return res.status(404).json({success:false,error:'Không tìm thấy yêu cầu.'});if(requested<3)return res.status(400).json({success:false,error:'maxUsers phải >= 3.'});await dbQuery(`UPDATE subscriptions SET max_users=$1,updated_at=NOW() WHERE tenant_id=$2 AND status='active'`,[requested,r.rows[0].tenantId]);await dbQuery(`UPDATE user_limit_requests SET status='APPROVED',reviewed_by=$2,reviewed_at=NOW() WHERE id=$1`,[req.params.id,req.user.uid]);return res.json({success:true});}catch{return res.status(500).json({success:false,error:'Không thể duyệt yêu cầu.'});}});
