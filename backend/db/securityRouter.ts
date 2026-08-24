import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { dbAuthMiddleware } from './authRouter';
import { dbQuery } from './client';

export const dbSecurityRouter = express.Router();

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  return secret;
}

function base32Encode(bytes: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; let out = '';
  for (const byte of bytes) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; const bytes: number[] = [];
  for (const ch of input.replace(/=+$/,'').toUpperCase()) {
    const idx = alphabet.indexOf(ch); if (idx < 0) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}

function totp(secret: string, counter: number): string {
  const key = base32Decode(secret); const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', key).update(msg).digest(); const offset = h[h.length - 1] & 15;
  const code = ((h[offset] & 127) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

function verifyTotp(secret: string, code: string): boolean {
  const clean = String(code).replace(/\D/g, ''); if (clean.length !== 6) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  return [-1, 0, 1].some(offset => crypto.timingSafeEqual(Buffer.from(totp(secret, counter + offset)), Buffer.from(clean)));
}

function encryptSecret(secret: string): string {
  const key = crypto.createHash('sha256').update(jwtSecret()).digest(); const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decryptSecret(value: string): string {
  const [ivRaw, tagRaw, dataRaw] = value.split('.'); const key = crypto.createHash('sha256').update(jwtSecret()).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64url')); decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataRaw, 'base64url')), decipher.final()]).toString('utf8');
}

function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền thực hiện thao tác này.' });
  next();
}

function passwordPolicy(password: string): string | null {
  const p = String(password ?? '').trim();
  if (p.length < 12 || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) return 'Mật khẩu phải có ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
  return null;
}

// Current account profile; never returns password hash, TOTP secret or recovery hashes.
dbSecurityRouter.get('/me', dbAuthMiddleware(), async (req: any, res) => {
  try {
    const r = await dbQuery(`SELECT id,username,name,email,phone,role,tenant_id AS "tenantId",data_scope AS "dataScope",status,two_factor_enabled AS "twoFactorEnabled",force_password_change AS "forcePasswordChange" FROM users WHERE id=$1`, [req.user.uid]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
    return res.json({ success: true, user: r.rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Không thể đọc hồ sơ tài khoản.' }); }
});

// Change own password. All existing sessions are revoked after success.
dbSecurityRouter.post('/password/change', dbAuthMiddleware(), async (req: any, res) => {
  try {
    const current = String(req.body?.currentPassword ?? ''); const next = String(req.body?.newPassword ?? '');
    const policy = passwordPolicy(next); if (policy) return res.status(400).json({ success: false, error: policy });
    const r = await dbQuery<{passwordHash:string}>('SELECT password_hash AS "passwordHash" FROM users WHERE id=$1', [req.user.uid]);
    if (!r.rows[0] || !(await bcrypt.compare(current, r.rows[0].passwordHash))) return res.status(401).json({ success: false, error: 'Mật khẩu hiện tại không chính xác.' });
    await dbQuery('UPDATE users SET password_hash=$1,force_password_change=FALSE,updated_at=NOW() WHERE id=$2', [await bcrypt.hash(next,12), req.user.uid]);
    await dbQuery('UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL', [req.user.uid]);
    return res.json({ success: true, message: 'Đổi mật khẩu thành công. Các phiên cũ đã được thu hồi.' });
  } catch { return res.status(500).json({ success: false, error: 'Không thể đổi mật khẩu.' }); }
});

// Generate a per-user TOTP secret and recovery codes. Secrets never leave the server except the one-time setup secret/URI.
dbSecurityRouter.post('/2fa/setup', dbAuthMiddleware(), async (req: any, res) => {
  try {
    const secret = base32Encode(crypto.randomBytes(20));
    const recoveryCodes = Array.from({length:5}, () => `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`);
    const hashes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code,12)));
    await dbQuery('UPDATE users SET two_factor_secret_encrypted=$1,recovery_code_hashes=$2,two_factor_enabled=FALSE,updated_at=NOW() WHERE id=$3', [encryptSecret(secret), JSON.stringify(hashes), req.user.uid]);
    const r = await dbQuery<{email:string|null;username:string}>('SELECT email,username FROM users WHERE id=$1',[req.user.uid]);
    const account = r.rows[0]?.email || r.rows[0]?.username || 'BizOne';
    const issuer = 'BizOne ERP';
    const otpauth = `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    return res.json({ success:true, secret, otpauth, recoveryCodes, warning:'Lưu recovery codes an toàn. Chúng chỉ được hiển thị một lần.' });
  } catch { return res.status(500).json({ success:false,error:'Không thể khởi tạo 2FA.' }); }
});

dbSecurityRouter.post('/2fa/enable', dbAuthMiddleware(), async (req: any, res) => {
  try {
    const r = await dbQuery<{secret:string|null}>('SELECT two_factor_secret_encrypted AS secret FROM users WHERE id=$1',[req.user.uid]);
    if (!r.rows[0]?.secret) return res.status(400).json({success:false,error:'Chưa khởi tạo 2FA.'});
    if (!verifyTotp(decryptSecret(r.rows[0].secret), req.body?.code)) return res.status(400).json({success:false,error:'Mã xác thực không chính xác.'});
    await dbQuery('UPDATE users SET two_factor_enabled=TRUE,updated_at=NOW() WHERE id=$1',[req.user.uid]);
    return res.json({success:true,message:'Đã bật 2FA.'});
  } catch { return res.status(500).json({success:false,error:'Không thể bật 2FA.'}); }
});

dbSecurityRouter.post('/2fa/disable', dbAuthMiddleware(), async (req: any, res) => {
  try {
    const r = await dbQuery<{secret:string|null}>('SELECT two_factor_secret_encrypted AS secret FROM users WHERE id=$1',[req.user.uid]);
    if (r.rows[0]?.secret && !verifyTotp(decryptSecret(r.rows[0].secret), req.body?.code)) return res.status(400).json({success:false,error:'Mã xác thực không chính xác.'});
    await dbQuery('UPDATE users SET two_factor_enabled=FALSE,two_factor_secret_encrypted=NULL,recovery_code_hashes=\'[]\'::jsonb,updated_at=NOW() WHERE id=$1',[req.user.uid]);
    return res.json({success:true,message:'Đã tắt và xoá cấu hình 2FA.'});
  } catch { return res.status(500).json({success:false,error:'Không thể tắt 2FA.'}); }
});

// Session management.
dbSecurityRouter.get('/sessions', dbAuthMiddleware(), async (req: any, res) => {
  try {
    const r = await dbQuery(`SELECT id,created_at AS "createdAt",expires_at AS "expiresAt",revoked_at AS "revokedAt",ip_address AS "ipAddress",user_agent AS "userAgent" FROM sessions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,[req.user.uid]);
    return res.json({success:true,sessions:r.rows});
  } catch { return res.status(500).json({success:false,error:'Không thể đọc phiên đăng nhập.'}); }
});

dbSecurityRouter.post('/sessions/revoke-all', dbAuthMiddleware(), async (req: any, res) => {
  try { await dbQuery('UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',[req.user.uid]); return res.json({success:true,message:'Đã thu hồi toàn bộ phiên đăng nhập.'}); }
  catch { return res.status(500).json({success:false,error:'Không thể thu hồi phiên.'}); }
});

// Super Admin can reset a customer password without ever receiving/storing plaintext in the database.
dbSecurityRouter.post('/admin/users/:id/reset-password', dbAuthMiddleware(), requireSuperAdmin, async (req: any, res) => {
  try {
    const next = String(req.body?.newPassword ?? ''); const policy = passwordPolicy(next); if (policy) return res.status(400).json({success:false,error:policy});
    const user = await dbQuery<{id:string;role:string}>('SELECT id,role FROM users WHERE id=$1',[req.params.id]);
    if (!user.rows[0]) return res.status(404).json({success:false,error:'Không tìm thấy người dùng.'});
    await dbQuery('UPDATE users SET password_hash=$1,force_password_change=TRUE,updated_at=NOW() WHERE id=$2',[await bcrypt.hash(next,12),req.params.id]);
    await dbQuery('UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',[req.params.id]);
    return res.json({success:true,message:'Đã reset mật khẩu và thu hồi các phiên cũ.'});
  } catch { return res.status(500).json({success:false,error:'Không thể reset mật khẩu người dùng.'}); }
});

// Super Admin can revoke another user's sessions.
dbSecurityRouter.post('/admin/users/:id/revoke-sessions', dbAuthMiddleware(), requireSuperAdmin, async (req: any, res) => {
  try { await dbQuery('UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',[req.params.id]); return res.json({success:true}); }
  catch { return res.status(500).json({success:false,error:'Không thể thu hồi phiên.'}); }
});
