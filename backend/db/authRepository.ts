import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from './client';

export type DbUser = {
  id: string;
  tenantId: string | null;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: string;
  status: string;
  dataScope: string;
  twoFactorEnabled: boolean;
  twoFactorSecretEncrypted: string | null;
  recoveryCodeHashes: string[];
  forcePasswordChange: boolean;
};

function normalize(value: unknown): string { return String(value ?? '').trim().toLowerCase(); }
function normalizePhone(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

export async function findUserByIdentifier(identifier: string): Promise<DbUser | null> {
  const raw = String(identifier ?? '').trim();
  const normalized = normalize(raw);
  const phone = normalizePhone(raw);
  const result = await pool.query<DbUser>(
    `SELECT id, tenant_id AS "tenantId", username, name, email, phone,
            password_hash AS "passwordHash", role, status,
            data_scope AS "dataScope", two_factor_enabled AS "twoFactorEnabled",
            two_factor_secret_encrypted AS "twoFactorSecretEncrypted",
            recovery_code_hashes AS "recoveryCodeHashes",
            force_password_change AS "forcePasswordChange"
       FROM users
      WHERE LOWER(username) = $1 OR LOWER(COALESCE(email, '')) = $1 OR phone = $2
      LIMIT 1`,
    [normalized, phone]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `SELECT id, tenant_id AS "tenantId", username, name, email, phone,
            password_hash AS "passwordHash", role, status,
            data_scope AS "dataScope", two_factor_enabled AS "twoFactorEnabled",
            two_factor_secret_encrypted AS "twoFactorSecretEncrypted",
            recovery_code_hashes AS "recoveryCodeHashes",
            force_password_change AS "forcePasswordChange"
       FROM users WHERE id = $1 LIMIT 1`, [id]
  );
  return result.rows[0] ?? null;
}

export async function verifyPassword(user: DbUser, password: string): Promise<boolean> {
  return bcrypt.compare(String(password ?? '').trim(), user.passwordHash);
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(String(newPassword).trim(), 12);
  await pool.query(`UPDATE users SET password_hash=$1, force_password_change=FALSE, updated_at=NOW() WHERE id=$2`, [hash, userId]);
}

export async function createSession(args: { userId: string; tokenHash: string; expiresAt: Date; ipAddress?: string; userAgent?: string }): Promise<string> {
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO sessions (id,user_id,token_hash,expires_at,ip_address,user_agent) VALUES ($1,$2,$3,$4,$5,$6)`, [id, args.userId, args.tokenHash, args.expiresAt, args.ipAddress ?? null, args.userAgent ?? null]);
  return id;
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await pool.query(`UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL`, [userId]);
}

export async function createPasswordResetOtp(args: { userId: string; channel: 'email'|'sms'; destinationMasked: string; otp: string; expiresAt: Date }): Promise<string> {
  const id = crypto.randomUUID();
  const codeHash = await bcrypt.hash(args.otp, 10);
  await pool.query(`INSERT INTO otp_codes (id,user_id,purpose,channel,destination_masked,code_hash,expires_at) VALUES ($1,$2,'password_reset',$3,$4,$5,$6)`, [id,args.userId,args.channel,args.destinationMasked,codeHash,args.expiresAt]);
  return id;
}

export async function verifyPasswordResetOtp(args: { userId: string; otp: string }): Promise<boolean> {
  const result = await pool.query<{id:string;codeHash:string;attempts:number}>(
    `SELECT id,code_hash AS "codeHash",attempts FROM otp_codes WHERE user_id=$1 AND purpose='password_reset' AND used_at IS NULL AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1`, [args.userId]
  );
  const row = result.rows[0];
  if (!row || row.attempts >= 5) return false;
  const valid = await bcrypt.compare(args.otp, row.codeHash);
  await pool.query(`UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1`, [row.id]);
  if (valid) await pool.query(`UPDATE otp_codes SET used_at=NOW() WHERE id=$1`, [row.id]);
  return valid;
}

export async function createPendingRegistration(args: {
  companyName: string; taxCode?: string; representative?: string; email?: string; phone?: string; address?: string;
  username: string; adminName: string; adminEmail?: string; adminPhone?: string; password: string; planCode?: string; notes?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const registrationId = crypto.randomUUID();
    const registrationCode = `REG-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomInt(100,1000)}`;
    const passwordHash = await bcrypt.hash(args.password.trim(), 12);
    await client.query(`INSERT INTO tenants (id,name,email,phone,status) VALUES ($1,$2,$3,$4,'pending')`, [tenantId,args.companyName.trim(),args.email ?? args.adminEmail ?? null,args.phone ?? args.adminPhone ?? null]);
    await client.query(`INSERT INTO users (id,tenant_id,username,name,email,phone,password_hash,role,status,data_scope) VALUES ($1,$2,$3,$4,$5,$6,$7,'admin','pending','tenant')`, [userId,tenantId,args.username.trim(),args.adminName.trim(),args.adminEmail ?? args.email ?? null,args.adminPhone ?? args.phone ?? null,passwordHash]);
    await client.query(`INSERT INTO tenant_registrations (id,tenant_id,registration_code,company_name,tax_code,representative,address,admin_user_id,plan_code,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PENDING_APPROVAL',$10)`, [registrationId,tenantId,registrationCode,args.companyName.trim(),args.taxCode ?? null,args.representative ?? args.adminName,args.address ?? null,userId,args.planCode ?? 'TRIAL_7_DAYS',args.notes ?? null]);
    await client.query('COMMIT');
    return { id: registrationId, registrationCode, tenantId, userId, status: 'PENDING_APPROVAL' };
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

export async function listRegistrations() {
  const result = await pool.query(`SELECT r.id,r.registration_code AS "registrationCode",r.company_name AS "companyName",r.tax_code AS "taxCode",r.representative,r.address,r.plan_code AS "planCode",r.status,r.notes,r.created_at AS "createdAt",r.approved_at AS "approvedAt",t.email,t.phone,u.name AS "adminName",u.email AS "adminEmail",u.phone AS "adminPhone" FROM tenant_registrations r JOIN tenants t ON t.id=r.tenant_id JOIN users u ON u.id=r.admin_user_id ORDER BY r.created_at DESC`);
  return result.rows;
}

export async function approveRegistration(registrationId: string, approvedBy: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reg = await client.query<{tenantId:string;userId:string;planCode:string}>(`SELECT tenant_id AS "tenantId",admin_user_id AS "userId",plan_code AS "planCode" FROM tenant_registrations WHERE id=$1 FOR UPDATE`, [registrationId]);
    const row = reg.rows[0];
    if (!row) throw new Error('REGISTRATION_NOT_FOUND');
    await client.query(`UPDATE tenants SET status='active',approved_at=NOW(),updated_at=NOW() WHERE id=$1`, [row.tenantId]);
    await client.query(`UPDATE users SET status='active',updated_at=NOW() WHERE id=$1`, [row.userId]);
    const existing = await client.query(`SELECT id FROM subscriptions WHERE tenant_id=$1 AND status IN ('trial','active') LIMIT 1`, [row.tenantId]);
    if (existing.rowCount === 0) {
      const subId = crypto.randomUUID();
      const started = new Date();
      const expires = new Date(started.getTime() + 7*86400000);
      await client.query(`INSERT INTO subscriptions (id,tenant_id,plan_code,status,started_at,expires_at,max_users) VALUES ($1,$2,$3,'trial',$4,$5,3)`, [subId,row.tenantId,row.planCode || 'TRIAL_7_DAYS',started,expires]);
    }
    await client.query(`UPDATE tenant_registrations SET status='APPROVED',approved_at=NOW(),approved_by=$2,updated_at=NOW() WHERE id=$1`, [registrationId,approvedBy]);
    await client.query('COMMIT');
    return { tenantId: row.tenantId, userId: row.userId };
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

export async function createTenantWithAdmin(args: { tenantName:string; email?:string; phone?:string; username:string; name:string; password:string; planCode?:string; trialDays?:number }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tenantId=crypto.randomUUID(), userId=crypto.randomUUID(), subscriptionId=crypto.randomUUID();
    const passwordHash=await bcrypt.hash(args.password.trim(),12); const trialDays=Math.max(1,args.trialDays??7); const now=new Date(); const expires=new Date(now.getTime()+trialDays*86400000);
    await client.query(`INSERT INTO tenants (id,name,email,phone,status) VALUES ($1,$2,$3,$4,'active')`,[tenantId,args.tenantName.trim(),args.email??null,args.phone??null]);
    await client.query(`INSERT INTO users (id,tenant_id,username,name,email,phone,password_hash,role,status,data_scope) VALUES ($1,$2,$3,$4,$5,$6,$7,'admin','active','tenant')`,[userId,tenantId,args.username.trim(),args.name.trim(),args.email??null,args.phone??null,passwordHash]);
    await client.query(`INSERT INTO subscriptions (id,tenant_id,plan_code,status,started_at,expires_at,max_users) VALUES ($1,$2,$3,'trial',$4,$5,3)`,[subscriptionId,tenantId,args.planCode??'TRIAL_7D',now,expires]);
    await client.query('COMMIT'); return {tenantId,userId,subscriptionId};
  } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
}

export async function approveTenant(tenantId: string, approvedBy: string): Promise<void> {
  await pool.query(`UPDATE tenants SET status='active',approved_at=NOW(),approved_by=$2,updated_at=NOW() WHERE id=$1`,[tenantId,approvedBy]);
  await pool.query(`UPDATE users SET status='active',updated_at=NOW() WHERE tenant_id=$1 AND status='pending'`,[tenantId]);
}

export async function getSubscriptionForTenant(tenantId: string) {
  const result=await pool.query(`SELECT id,plan_code AS "planCode",status,started_at AS "startedAt",expires_at AS "expiresAt",max_users AS "maxUsers" FROM subscriptions WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 1`,[tenantId]);
  return result.rows[0]??null;
}

export function maskEmail(email:string|null):string { if(!email||!email.includes('@')) return '***@***'; const [local,domain]=email.split('@'); return `${local.slice(0,2)}***@${domain}`; }
export function maskPhone(phone:string|null):string { const digits=normalizePhone(phone??''); if(digits.length<6)return '***'; return `${digits.slice(0,2)}***${digits.slice(-2)}`; }
