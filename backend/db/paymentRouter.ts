import express from 'express';
import crypto from 'node:crypto';
import { dbAuthMiddleware } from './authRouter';
import { dbQuery } from './client';

export const dbPaymentRouter = express.Router();

function requireSuperAdmin(req:any,res:any,next:any){if(req.user?.role!=='super_admin')return res.status(403).json({success:false,error:'Chỉ Super Admin mới có quyền duyệt thanh toán.'});next();}

dbPaymentRouter.post('/request', dbAuthMiddleware(), async (req:any,res:any)=>{
  try{
    const tenantId=req.user?.tenantId; if(!tenantId)return res.status(400).json({success:false,error:'Tài khoản chưa thuộc tenant.'});
    const planCode=String(req.body?.planCode||'PREMIUM').toUpperCase();
    const p=await dbQuery(`SELECT code,price_amount AS "priceAmount",active FROM plans WHERE code=$1`,[planCode]);
    if(!p.rows[0]||!p.rows[0].active)return res.status(404).json({success:false,error:'Gói không tồn tại.'});
    const r=await dbQuery(`INSERT INTO payment_requests (id,tenant_id,requested_by,plan_code,amount,payment_method,reference,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,plan_code AS "planCode",amount,payment_method AS "paymentMethod",status,created_at AS "createdAt"`,[crypto.randomUUID(),tenantId,req.user.uid,planCode,Number(p.rows[0].priceAmount||0),String(req.body?.paymentMethod||'bank_transfer'),String(req.body?.reference||''),String(req.body?.note||'')]);
    return res.status(201).json({success:true,request:r.rows[0],message:'Đã gửi yêu cầu nâng cấp. Chờ Super Admin xác nhận thanh toán.'});
  }catch{return res.status(500).json({success:false,error:'Không thể tạo yêu cầu thanh toán.'});}
});

dbPaymentRouter.get('/my-requests',dbAuthMiddleware(),async(req:any,res:any)=>{try{const r=await dbQuery(`SELECT id,plan_code AS "planCode",amount,payment_method AS "paymentMethod",reference,note,status,created_at AS "createdAt",reviewed_at AS "reviewedAt" FROM payment_requests WHERE tenant_id=$1 ORDER BY created_at DESC`,[req.user.tenantId]);return res.json({success:true,requests:r.rows});}catch{return res.status(500).json({success:false,error:'Không thể tải yêu cầu thanh toán.'});}});

dbPaymentRouter.get('/admin/requests',dbAuthMiddleware(),requireSuperAdmin,async(_req:any,res:any)=>{try{const r=await dbQuery(`SELECT r.id,r.tenant_id AS "tenantId",t.name AS "tenantName",r.plan_code AS "planCode",r.amount,r.payment_method AS "paymentMethod",r.reference,r.note,r.status,r.created_at AS "createdAt" FROM payment_requests r JOIN tenants t ON t.id=r.tenant_id ORDER BY r.created_at DESC`);return res.json({success:true,requests:r.rows});}catch{return res.status(500).json({success:false,error:'Không thể tải yêu cầu thanh toán.'});}});

dbPaymentRouter.post('/admin/requests/:id/approve',dbAuthMiddleware(),requireSuperAdmin,async(req:any,res:any)=>{
  const client=(await import('./client')).pool;
  try{
    const c=await client.connect();
    try{
      await c.query('BEGIN');
      const r=await c.query(`SELECT id,tenant_id AS "tenantId",plan_code AS "planCode" FROM payment_requests WHERE id=$1 AND status='PENDING' FOR UPDATE`,[req.params.id]);
      if(!r.rows[0]){await c.query('ROLLBACK');return res.status(404).json({success:false,error:'Không tìm thấy yêu cầu thanh toán.'});}
      const plan=await c.query(`SELECT max_users AS "maxUsers",billing_period_months AS "months" FROM plans WHERE code=$1 AND active=TRUE`,[r.rows[0].planCode]);
      if(!plan.rows[0]){await c.query('ROLLBACK');return res.status(404).json({success:false,error:'Plan không tồn tại.'});}
      const months=Math.max(1,Number(plan.rows[0].months||1));
      const now=new Date(); const expires=new Date(now); expires.setMonth(expires.getMonth()+months);
      await c.query(`UPDATE subscriptions SET status='expired',updated_at=NOW() WHERE tenant_id=$1 AND status='active'`,[r.rows[0].tenantId]);
      await c.query(`INSERT INTO subscriptions (id,tenant_id,plan_code,status,started_at,expires_at,max_users) VALUES ($1,$2,$3,'active',$4,$5,$6)`,[crypto.randomUUID(),r.rows[0].tenantId,r.rows[0].planCode,now,expires,Number(plan.rows[0].maxUsers||3)]);
      await c.query(`UPDATE payment_requests SET status='APPROVED',reviewed_by=$2,reviewed_at=NOW() WHERE id=$1`,[req.params.id,req.user.uid]);
      await c.query('COMMIT'); return res.json({success:true,message:'Đã kích hoạt gói Premium.'});
    }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }catch{return res.status(500).json({success:false,error:'Không thể duyệt thanh toán.'});}
});
