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

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

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
      WHERE LOWER(username) = $1
         OR LOWER(COALESCE(email, '')) = $1
         OR phone = $2
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
       FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function verifyPassword(user: DbUser, password: string): Promise<boolean> {
  return bcrypt.compare(String(password ?? '').trim(), user.passwordHash);
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(String(newPassword).trim(), 12);
  await pool.query(
    `UPDATE users
        SET password_hash = $1,
            force_password_change = FALSE,
            updated_at = NOW()
      WHERE id = $2`,
    [hash, userId]
  );
}

export async function createSession(args: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, args.userId, args.tokenHash, args.expiresAt, args.ipAddress ?? null, args.userAgent ?? null]
  );
  return id;
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await pool.query(
    `UPDATE sessions SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

export async function createPasswordResetOtp(args: {
  userId: string;
  channel: 'email' | 'sms';
  destinationMasked: string;
  otp: string;
  expiresAt: Date;
}): Promise<string> {
  const id = crypto.randomUUID();
  const codeHash = await bcrypt.hash(args.otp, 10);
  await pool.query(
    `INSERT INTO otp_codes
      (id, user_id, purpose, channel, destination_masked, code_hash, expires_at)
     VALUES ($1, $2, 'password_reset', $3, $4, $5, $6)`,
    [id, args.userId, args.channel, args.destinationMasked, codeHash, args.expiresAt]
  );
  return id;
}

export async function verifyPasswordResetOtp(args: {
  userId: string;
  otp: string;
}): Promise<boolean> {
  const result = await pool.query<{
    id: string;
    codeHash: string;
    attempts: number;
  }>(
    `SELECT id, code_hash AS "codeHash", attempts
       FROM otp_codes
      WHERE user_id = $1
        AND purpose = 'password_reset'
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1`,
    [args.userId]
  );

  const row = result.rows[0];
  if (!row || row.attempts >= 5) return false;

  const valid = await bcrypt.compare(args.otp, row.codeHash);
  await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
  if (valid) await pool.query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [row.id]);
  return valid;
}

export async function createTenantWithAdmin(args: {
  tenantName: string;
  email?: string;
  phone?: string;
  username: string;
  name: string;
  password: string;
  planCode?: string;
  trialDays?: number;
}): Promise<{ tenantId: string; userId: string; subscriptionId: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const subscriptionId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(args.password.trim(), 12);
    const trialDays = Math.max(1, args.trialDays ?? 7);
    const now = new Date();
    const expires = new Date(now.getTime() + trialDays * 86400000);

    await client.query(
      `INSERT INTO tenants (id, name, email, phone, status)
       VALUES ($1, $2, $3, $4, 'active')`,
      [tenantId, args.tenantName.trim(), args.email ?? null, args.phone ?? null]
    );

    await client.query(
      `INSERT INTO users
       (id, tenant_id, username, name, email, phone, password_hash, role, status, data_scope)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', 'active', 'tenant')`,
      [userId, tenantId, args.username.trim(), args.name.trim(), args.email ?? null, args.phone ?? null, passwordHash]
    );

    await client.query(
      `INSERT INTO subscriptions
       (id, tenant_id, plan_code, status, started_at, expires_at, max_users)
       VALUES ($1, $2, $3, 'trial', $4, $5, 1)`,
      [subscriptionId, tenantId, args.planCode ?? 'TRIAL_7D', now, expires]
    );

    await client.query('COMMIT');
    return { tenantId, userId, subscriptionId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function approveTenant(tenantId: string, approvedBy: string): Promise<void> {
  await pool.query(
    `UPDATE tenants
        SET status = 'active', approved_at = NOW(), approved_by = $2, updated_at = NOW()
      WHERE id = $1`,
    [tenantId, approvedBy]
  );
  await pool.query(
    `UPDATE users SET status = 'active', updated_at = NOW()
      WHERE tenant_id = $1 AND status = 'pending'`,
    [tenantId]
  );
}

export async function getSubscriptionForTenant(tenantId: string) {
  const result = await pool.query(
    `SELECT id, plan_code AS "planCode", status, started_at AS "startedAt",
            expires_at AS "expiresAt", max_users AS "maxUsers"
       FROM subscriptions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [tenantId]
  );
  return result.rows[0] ?? null;
}

export function maskEmail(email: string | null): string {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string | null): string {
  const digits = normalizePhone(phone ?? '');
  if (digits.length < 6) return '***';
  return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
}
