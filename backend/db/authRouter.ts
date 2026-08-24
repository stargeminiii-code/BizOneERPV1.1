import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  createPasswordResetOtp,
  createSession,
  findUserByIdentifier,
  findUserById,
  getSubscriptionForTenant,
  maskEmail,
  maskPhone,
  revokeUserSessions,
  updatePassword,
  verifyPassword,
  verifyPasswordResetOtp,
} from './authRepository';

export const dbAuthRouter = express.Router();

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  return secret;
}

function signToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', jwtSecret()).update(`${header}.${body}`).digest('base64url');
  return `bizone_jwt.${header}.${body}.${signature}`;
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    tenantId: user.tenantId,
    dataScope: user.dataScope,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    forcePasswordChange: user.forcePasswordChange,
  };
}

function passwordPolicy(password: string): string | null {
  const p = String(password ?? '').trim();
  if (p.length < 12) return 'Mật khẩu mới phải có ít nhất 12 ký tự.';
  if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) {
    return 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.';
  }
  return null;
}

dbAuthRouter.post('/login', async (req, res) => {
  try {
    const { identifier, password, rememberMe = true } = req.body ?? {};
    if (!identifier || !password) return res.status(400).json({ success: false, error: 'Vui lòng nhập tài khoản và mật khẩu.' });

    const user = await findUserByIdentifier(identifier);
    if (!user || user.status !== 'active' || !(await verifyPassword(user, password))) {
      return res.status(401).json({ success: false, errorType: 'INVALID_CREDENTIALS', error: 'Thông tin đăng nhập không chính xác.' });
    }

    if (user.tenantId) {
      const subscription = await getSubscriptionForTenant(user.tenantId);
      if (subscription && new Date(subscription.expiresAt).getTime() <= Date.now()) {
        const expiresAt = new Date(subscription.expiresAt).toISOString();
        return res.json({
          success: true,
          token: signToken({ uid: user.id, sub: user.username, role: user.role, tenantId: user.tenantId, scope: user.dataScope, sid: crypto.randomUUID(), iat: Date.now(), exp: Date.now() + 86400000 }),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          user: { ...safeUser(user), subscriptionStatus: 'expired', readOnly: true, subscriptionExpiresAt: expiresAt },
          subscription: { ...subscription, status: 'expired' },
        });
      }
    }

    const duration = rememberMe ? 30 * 86400000 : 86400000;
    const expiresAt = new Date(Date.now() + duration);
    const sid = crypto.randomUUID();
    const token = signToken({ uid: user.id, sub: user.username, role: user.role, tenantId: user.tenantId, scope: user.dataScope, sid, iat: Date.now(), exp: expiresAt.getTime() });
    await createSession({ userId: user.id, tokenHash: sha256(token), expiresAt, ipAddress: req.ip, userAgent: req.get('user-agent') });

    const subscription = user.tenantId ? await getSubscriptionForTenant(user.tenantId) : null;
    return res.json({ success: true, token, expiresAt: expiresAt.toISOString(), user: safeUser(user), subscription });
  } catch (error) {
    console.error('[DB_AUTH_LOGIN]', error);
    return res.status(500).json({ success: false, errorType: 'SERVER_ERROR', error: 'Không thể kết nối máy chủ xác thực.' });
  }
});

dbAuthRouter.post('/password-reset/request', async (req, res) => {
  try {
    const identifier = String(req.body?.identifier ?? '').trim();
    if (!identifier) return res.status(400).json({ success: false, error: 'Vui lòng nhập email hoặc số điện thoại.' });
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.json({ success: true, message: 'Nếu thông tin tồn tại, OTP sẽ được gửi tới phương thức liên hệ đã đăng ký.' });

    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    if (user.email) await createPasswordResetOtp({ userId: user.id, channel: 'email', destinationMasked: maskEmail(user.email), otp, expiresAt });
    if (user.phone) await createPasswordResetOtp({ userId: user.id, channel: 'sms', destinationMasked: maskPhone(user.phone), otp, expiresAt });

    // The actual email/SMS provider remains server-side. Never return the OTP to the browser.
    return res.json({ success: true, challengeUserId: user.id, maskedEmail: maskEmail(user.email), maskedPhone: maskPhone(user.phone), message: 'OTP đã được gửi tới email và số điện thoại đã đăng ký.' });
  } catch (error) {
    console.error('[DB_PASSWORD_RESET_REQUEST]', error);
    return res.status(500).json({ success: false, error: 'Không thể tạo yêu cầu đặt lại mật khẩu.' });
  }
});

dbAuthRouter.post('/password-reset/verify', async (req, res) => {
  try {
    const userId = String(req.body?.userId ?? '');
    const otp = String(req.body?.otp ?? '').replace(/\D/g, '');
    if (!userId || otp.length !== 6) return res.status(400).json({ success: false, error: 'Mã OTP không hợp lệ.' });
    const user = await findUserById(userId);
    if (!user || !(await verifyPasswordResetOtp({ userId, otp }))) return res.status(400).json({ success: false, error: 'Mã OTP không chính xác hoặc đã hết hạn.' });
    const resetToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = sha256(resetToken);
    // Reuse otp_codes as a one-time authorization record by storing a short-lived hashed token is intentionally deferred to migration 2.
    // For now return a signed, 10-minute purpose-bound reset token.
    const signed = signToken({ uid: user.id, purpose: 'password_reset', nonce: tokenHash, iat: Date.now(), exp: Date.now() + 10 * 60 * 1000 });
    return res.json({ success: true, resetToken: signed });
  } catch (error) {
    console.error('[DB_PASSWORD_RESET_VERIFY]', error);
    return res.status(500).json({ success: false, error: 'Không thể xác minh OTP.' });
  }
});

dbAuthRouter.post('/password-reset/complete', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body ?? {};
    if (!resetToken || !newPassword) return res.status(400).json({ success: false, error: 'Thiếu thông tin đặt lại mật khẩu.' });
    const parts = String(resetToken).split('.');
    if (parts.length !== 4) return res.status(400).json({ success: false, error: 'Token không hợp lệ.' });
    const payload = JSON.parse(Buffer.from(parts[2], 'base64url').toString('utf8'));
    if (payload.purpose !== 'password_reset' || Date.now() > Number(payload.exp)) return res.status(400).json({ success: false, error: 'Token đặt lại mật khẩu đã hết hạn.' });
    const expected = crypto.createHmac('sha256', jwtSecret()).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(parts[3]), Buffer.from(expected))) return res.status(400).json({ success: false, error: 'Token không hợp lệ.' });

    const user = await findUserById(String(payload.uid));
    if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
    const policyError = passwordPolicy(newPassword);
    if (policyError) return res.status(400).json({ success: false, error: policyError });
    await updatePassword(user.id, newPassword);
    await revokeUserSessions(user.id);
    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    console.error('[DB_PASSWORD_RESET_COMPLETE]', error);
    return res.status(500).json({ success: false, error: 'Không thể hoàn tất đặt lại mật khẩu.' });
  }
});

export function dbAuthMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      const auth = String(req.headers.authorization ?? '');
      if (!auth.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Yêu cầu đăng nhập.' });
      const token = auth.slice(7);
      const parts = token.split('.');
      if (parts.length !== 4) return res.status(401).json({ success: false, error: 'Token không hợp lệ.' });
      const expected = crypto.createHmac('sha256', jwtSecret()).update(`${parts[0]}.${parts[1]}`).digest('base64url');
      if (!crypto.timingSafeEqual(Buffer.from(parts[3]), Buffer.from(expected))) return res.status(401).json({ success: false, error: 'Token không hợp lệ.' });
      const payload = JSON.parse(Buffer.from(parts[2], 'base64url').toString('utf8'));
      if (Date.now() > Number(payload.exp)) return res.status(401).json({ success: false, error: 'Phiên đăng nhập đã hết hạn.' });
      const user = await findUserById(String(payload.uid));
      if (!user || user.status !== 'active') return res.status(401).json({ success: false, error: 'Tài khoản không còn hoạt động.' });
      req.dbUser = user;
      req.user = { uid: user.id, sub: user.username, role: user.role, tenant: user.tenantId, scope: user.dataScope };
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Không thể xác thực token.' });
    }
  };
}
