import express from 'express';
import crypto from 'node:crypto';
import { dbAuthMiddleware } from './authRouter';
import { dbQuery } from './client';

export const dbMonetizationGuardRouter = express.Router();

async function subscription(tenantId:string){const r=await dbQuery(`SELECT s.plan_code AS "planCode",p.max_orders_per_month AS "maxOrdersPerMonth",p.ads_enabled AS "adsEnabled" FROM subscriptions s JOIN plans p ON p.code=s.plan_code WHERE s.tenant_id=$1 AND s.status='active' ORDER BY s.created_at DESC LIMIT 1`,[tenantId]);return r.rows[0]??null;}
async function usage(tenantId:string){const r=await dbQuery(`INSERT INTO usage_counters(id,tenant_id,period_start) VALUES($1,$2,date_trunc('month',NOW())::date) ON CONFLICT(tenant_id,period_start) DO UPDATE SET updated_at=NOW() RETURNING *`,[crypto.randomUUID(),tenantId]);return r.rows[0];}

// Read-only precheck used immediately before the client creates a sales order.
// It does NOT consume quota. The actual consume endpoint remains the source of truth for usage counting.
dbMonetizationGuardRouter.get('/usage/orders/check',dbAuthMiddleware(),async(req:any,res:any)=>{
  try{
    const tenantId=req.user?.tenantId;if(!tenantId)return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const sub=await subscription(tenantId);if(!sub)return res.status(403).json({success:false,error:'Tenant chưa có gói dịch vụ.'});
    const u=await usage(tenantId);const baseLimit=Number(sub.maxOrdersPerMonth||1000);const baseUsed=Number(u.orders_created||0);const bonus=Number(u.bonus_orders_available||0);
    const allowed=baseUsed<baseLimit||bonus>0;
    return res.json({success:true,allowed,planCode:sub.planCode,ordersCreated:baseUsed,limit:baseLimit,bonusOrdersAvailable:bonus,adsEnabled:Boolean(sub.adsEnabled),message:allowed?'OK':`Đã đạt ${baseLimit} đơn bán trong tháng.`});
  }catch{return res.status(500).json({success:false,error:'Không thể kiểm tra hạn mức giao dịch.'});}
});

// Atomically consumes one actual sales-order slot. Rewarded quota is consumed only after the base 1,000/month limit is reached.
dbMonetizationGuardRouter.post('/usage/orders/consume',dbAuthMiddleware(),async(req:any,res:any)=>{
  try{
    const tenantId=req.user?.tenantId;if(!tenantId)return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const sub=await subscription(tenantId);if(!sub)return res.status(403).json({success:false,error:'Tenant chưa có gói dịch vụ.'});
    const u=await usage(tenantId);const baseLimit=Number(sub.maxOrdersPerMonth||1000);const baseUsed=Number(u.orders_created||0);const bonus=Number(u.bonus_orders_available||0);
    if(baseUsed>=baseLimit&&bonus<=0)return res.status(429).json({success:false,code:'ORDER_LIMIT_REACHED',message:`Đã đạt ${baseLimit} đơn bán trong tháng. Xem quảng cáo để nhận thêm lượt hoặc nâng cấp Premium.`,usage:{...u,bonusOrdersAvailable:bonus},canEarnWithAd:Boolean(sub.adsEnabled)});
    if(baseUsed<baseLimit){const r=await dbQuery(`UPDATE usage_counters SET orders_created=orders_created+1,updated_at=NOW() WHERE tenant_id=$1 AND period_start=date_trunc('month',NOW())::date RETURNING orders_created AS "ordersCreated",bonus_orders_available AS "bonusOrdersAvailable"`,[tenantId]);return res.json({success:true,ordersCreated:r.rows[0].ordersCreated,bonusOrdersAvailable:r.rows[0].bonusOrdersAvailable,limit:baseLimit});}
    const r=await dbQuery(`UPDATE usage_counters SET bonus_orders_available=bonus_orders_available-1,updated_at=NOW() WHERE tenant_id=$1 AND period_start=date_trunc('month',NOW())::date AND bonus_orders_available>0 RETURNING orders_created AS "ordersCreated",bonus_orders_available AS "bonusOrdersAvailable"`,[tenantId]);
    if(!r.rows[0])return res.status(409).json({success:false,code:'ORDER_LIMIT_RACE',message:'Hạn mức vừa thay đổi, vui lòng thử lại.'});
    return res.json({success:true,ordersCreated:r.rows[0].ordersCreated,bonusOrdersAvailable:r.rows[0].bonusOrdersAvailable,limit:baseLimit,usedRewardOrder:true});
  }catch{return res.status(500).json({success:false,error:'Không thể cập nhật hạn mức giao dịch.'});}
});

// Completion callback for a rewarded ad. In production this endpoint should be called only after the client-side ad SDK confirms completion.
dbMonetizationGuardRouter.post('/usage/reward-ad',dbAuthMiddleware(),async(req:any,res:any)=>{
  try{
    const tenantId=req.user?.tenantId;if(!tenantId)return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const sub=await subscription(tenantId);if(!sub?.adsEnabled)return res.status(403).json({success:false,error:'Gói hiện tại không sử dụng quảng cáo.'});
    const adId=String(req.body?.adId||'');if(!adId)return res.status(400).json({success:false,error:'Thiếu adId.'});
    const ad=await dbQuery(`SELECT id,reward_orders AS "rewardOrders",rewarded_daily_limit AS "rewardedDailyLimit" FROM advertisements WHERE id=$1 AND active=TRUE`,[adId]);if(!ad.rows[0])return res.status(404).json({success:false,error:'Quảng cáo không tồn tại hoặc đã tắt.'});
    const start=new Date();start.setUTCHours(0,0,0,0);const c=await dbQuery<{count:string}>(`SELECT COUNT(*)::text AS count FROM ad_reward_events WHERE tenant_id=$1 AND user_id=$2 AND created_at>=$3`,[tenantId,req.user.uid,start]);
    if(Number(c.rows[0]?.count||0)>=Number(ad.rows[0].rewardedDailyLimit||6))return res.status(429).json({success:false,error:'Đã đạt giới hạn lượt nhận thưởng quảng cáo hôm nay.'});
    const reward=Math.max(0,Number(ad.rows[0].rewardOrders||5));
    await dbQuery(`INSERT INTO ad_reward_events(id,tenant_id,user_id,ad_id,reward_orders) VALUES($1,$2,$3,$4,$5)`,[crypto.randomUUID(),tenantId,req.user.uid,adId,reward]);
    const u=await usage(tenantId);const r=await dbQuery(`UPDATE usage_counters SET bonus_orders_available=bonus_orders_available+$3,rewarded_orders_used=rewarded_orders_used+$3,updated_at=NOW() WHERE tenant_id=$1 AND period_start=$2 RETURNING bonus_orders_available AS "bonusOrdersAvailable"`,[tenantId,u.period_start,reward]);
    return res.json({success:true,grantedOrders:reward,bonusOrdersAvailable:r.rows[0]?.bonusOrdersAvailable??reward});
  }catch{return res.status(500).json({success:false,error:'Không thể ghi nhận lượt xem quảng cáo.'});}
});