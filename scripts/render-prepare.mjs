import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serverPath = path.join(root, 'server.ts');
let source = fs.readFileSync(serverPath, 'utf8');

// Render requires the public HTTP server to bind to 0.0.0.0 and the PORT it assigns.
source = source.replace(
  'const PORT = 3000;',
  "const PORT = Number(process.env.PORT) || 10000;"
);

const startMarker = '  // Customer Self-Registration\n  app.post(\'/api/saas/register\'';
const endMarker = "\n  app.get('/api/saas/registrations', authenticateToken";

if (!source.includes(startMarker) || !source.includes(endMarker)) {
  throw new Error('[render-prepare] Could not locate the SaaS registration block; refusing to patch server.ts.');
}

const otpSupport = `
  // =========================================================================
  // CUSTOMER SELF-REGISTRATION OTP VERIFICATION (AUTO-ACTIVATION)
  // =========================================================================
  // Registration no longer requires manual Super Admin approval. A customer
  // must verify an OTP sent to the selected email or phone before activation.
  interface RegistrationOtpChallenge {
    registrationId: string;
    channel: 'email' | 'sms';
    destinationMasked: string;
    otpHash: string;
    expiresAt: number;
    attempts: number;
    maxAttempts: number;
    lastSentAt: number;
  }

  const REGISTRATION_OTP_CHALLENGES = new Map<string, RegistrationOtpChallenge>();

  function normalizeOtpPhone(raw: string): string {
    const digits = String(raw || '').replace(/\\D/g, '');
    if (digits.startsWith('84') && digits.length >= 10) return '+' + digits;
    if (digits.startsWith('0')) return '+84' + digits.slice(1);
    return digits ? '+' + digits : '';
  }

  function maskRegistrationDestination(channel: 'email' | 'sms', value: string): string {
    if (channel === 'email') return maskEmail(value);
    return maskPhone(value);
  }

  async function sendRegistrationOtp(channel: 'email' | 'sms', destination: string, otp: string, companyName: string): Promise<{ success: boolean; error?: string }> {
    const safeCompany = String(companyName || 'khách hàng').slice(0, 120);
    const message = \\`Mã OTP BizOne ERP của \\${safeCompany}: \\${otp}. Mã có hiệu lực 5 phút. Không cung cấp mã này cho người khác.\\`;

    if (channel === 'email') {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM;
      if (!apiKey || !from) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(\\`[DEV_REGISTRATION_OTP] Email \\${maskEmail(destination)}: \\${otp}\\`);
          return { success: true };
        }
        return { success: false, error: 'Chưa cấu hình RESEND_API_KEY và EMAIL_FROM trên máy chủ.' };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': \\`Bearer \\${apiKey}\\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [destination],
          subject: 'Mã OTP xác thực đăng ký BizOne ERP',
          text: message,
          html: \\`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>BizOne ERP</h2><p>Đây là mã xác thực đăng ký tài khoản cho <strong>\\${safeCompany}</strong>.</p><p style="font-size:30px;font-weight:700;letter-spacing:8px">\\${otp}</p><p>Mã có hiệu lực trong 5 phút.</p><p>Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.</p></div>\\`
        })
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return { success: false, error: \\`Resend từ chối gửi email: \\${body.slice(0, 300)}\\` };
      }
      return { success: true };
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    const to = normalizeOtpPhone(destination);
    if (!sid || !authToken || !from || !to) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(\\`[DEV_REGISTRATION_OTP] SMS \\${maskPhone(destination)}: \\${otp}\\`);
        return { success: true };
      }
      return { success: false, error: 'Chưa cấu hình Twilio SMS trên máy chủ.' };
    }

    const body = new URLSearchParams({ From: from, To: to, Body: message });
    const basic = Buffer.from(\\`\\${sid}:\\${authToken}\\`).toString('base64');
    const response = await fetch(\\`https://api.twilio.com/2010-04-01/Accounts/\\${sid}/Messages.json\\`, {
      method: 'POST',
      headers: {
        'Authorization': \\`Basic \\${basic}\\`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { success: false, error: \\`Twilio từ chối gửi SMS: \\${text.slice(0, 300)}\\` };
    }
    return { success: true };
  }

  function sanitizeRegistration(reg: any) {
    if (!reg) return reg;
    const { passwordHash, adminPassword, otpHash, ...safe } = reg;
    return safe;
  }

  // Customer Self-Registration — Step 1: create pending registration + send OTP.
  app.post('/api/saas/register', async (req, res) => {
    try {
      const {
        companyName, taxCode, representative, email, phone, address,
        adminName, adminUsername, adminEmail, adminPhone, adminPassword,
        planId, notes, verificationMethod = 'email'
      } = req.body;

      if (!companyName || !adminName || !adminEmail || !adminPassword) {
        return res.status(400).json({ success: false, errorType: 'MISSING_REGISTRATION_FIELDS', message: 'Vui lòng cung cấp đầy đủ thông tin doanh nghiệp, người quản trị, email và mật khẩu.' });
      }

      const channel = verificationMethod === 'sms' ? 'sms' : 'email';
      const destination = channel === 'sms' ? String(adminPhone || phone || '').trim() : String(adminEmail || email || '').trim().toLowerCase();
      if (!destination) {
        return res.status(400).json({ success: false, errorType: 'MISSING_OTP_DESTINATION', message: channel === 'sms' ? 'Vui lòng cung cấp số điện thoại để nhận OTP.' : 'Vui lòng cung cấp email để nhận OTP.' });
      }

      const normalizedEmail = String(adminEmail).trim().toLowerCase();
      const normalizedPhone = normalizePhone(String(adminPhone || phone || ''));
      const duplicate = SERVER_USERS.find((u) =>
        (u.email && u.email.toLowerCase() === normalizedEmail) ||
        (normalizedPhone && u.phone && normalizePhone(u.phone) === normalizedPhone)
      );
      if (duplicate) {
        return res.status(409).json({ success: false, errorType: 'ACCOUNT_EXISTS', message: 'Email hoặc số điện thoại này đã được sử dụng. Vui lòng đăng nhập hoặc dùng thông tin khác.' });
      }

      const plan = SAAS_PLANS.find((p) => p.id === planId || p.code === planId) || SAAS_PLANS[0];
      const now = new Date().toISOString();
      const registrationId = \\`reg-\\${Date.now()}-\\${crypto.randomBytes(4).toString('hex')}\\`;
      const registrationCode = \\`REG-\\${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-\\${Math.floor(100 + Math.random() * 900)}\\`;
      const passwordHash = await bcrypt.hash(String(adminPassword).trim(), 10);

      const newRegistration: any = {
        id: registrationId,
        registrationCode,
        companyName: String(companyName).trim(),
        taxCode: String(taxCode || '').trim(),
        representative: String(representative || adminName).trim(),
        email: String(email || adminEmail).trim().toLowerCase(),
        phone: String(phone || adminPhone || '').trim(),
        address: String(address || '').trim(),
        adminName: String(adminName).trim(),
        adminUsername: String(adminUsername || adminPhone || adminEmail.split('@')[0] || '').trim().toLowerCase(),
        adminEmail: normalizedEmail,
        adminPhone: String(adminPhone || phone || '').trim(),
        passwordHash,
        planId: plan.id,
        planCode: plan.code,
        planName: plan.name,
        status: 'PENDING_OTP_VERIFICATION',
        verificationMethod: channel,
        notes: notes || '',
        createdAt: now,
        updatedAt: now
      };

      const otp = crypto.randomInt(100000, 1000000).toString();
      const challengeId = \\`regotp-\\${crypto.randomBytes(18).toString('hex')}\\`;
      REGISTRATION_OTP_CHALLENGES.set(challengeId, {
        registrationId,
        channel,
        destinationMasked: maskRegistrationDestination(channel, destination),
        otpHash: await bcrypt.hash(otp, 10),
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
        maxAttempts: 5,
        lastSentAt: Date.now()
      });

      SAAS_REGISTRATIONS.unshift(newRegistration);
      saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);

      const dispatch = await sendRegistrationOtp(channel, destination, otp, newRegistration.companyName);
      if (!dispatch.success) {
        SAAS_REGISTRATIONS.splice(SAAS_REGISTRATIONS.findIndex((r) => r.id === registrationId), 1);
        saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);
        REGISTRATION_OTP_CHALLENGES.delete(challengeId);
        return res.status(503).json({ success: false, errorType: 'OTP_PROVIDER_UNAVAILABLE', message: dispatch.error });
      }

      recordAuditLog({
        actorId: 'anonymous', actorName: newRegistration.adminName, actorRole: 'CUSTOMER_REGISTRATION',
        tenantId: 'PLATFORM', action: 'CUSTOMER_REGISTRATION_OTP_SENT', entity: 'SAAS_REGISTRATION',
        entityId: registrationId, details: \\`OTP registration sent via \\${channel} to \\${maskRegistrationDestination(channel, destination)}\\`, status: 'SUCCESS'
      });

      return res.status(202).json({
        success: true,
        requiresOtp: true,
        challengeId,
        registrationId,
        registrationCode,
        verificationMethod: channel,
        destinationMasked: maskRegistrationDestination(channel, destination),
        message: channel === 'sms' ? 'Mã OTP đã được gửi đến số điện thoại. Vui lòng nhập mã để kích hoạt tài khoản.' : 'Mã OTP đã được gửi đến email. Vui lòng nhập mã để kích hoạt tài khoản.'
      });
    } catch (e) {
      console.error('[SAAS_REGISTER] OTP registration error:', e);
      return res.status(500).json({ success: false, errorType: 'REGISTRATION_ERROR', message: 'Không thể xử lý đăng ký lúc này. Vui lòng thử lại.' });
    }
  });

  // Customer Self-Registration — Step 2: verify OTP and auto-provision Tenant/Admin.
  app.post('/api/saas/register/verify-otp', async (req, res) => {
    try {
      const { challengeId, otp } = req.body || {};
      if (!challengeId || !otp) return res.status(400).json({ success: false, errorType: 'MISSING_OTP', message: 'Vui lòng nhập mã OTP.' });

      const challenge = REGISTRATION_OTP_CHALLENGES.get(String(challengeId));
      if (!challenge) return res.status(400).json({ success: false, errorType: 'INVALID_CHALLENGE', message: 'Phiên OTP không hợp lệ hoặc đã hết hạn.' });
      if (Date.now() > challenge.expiresAt) {
        REGISTRATION_OTP_CHALLENGES.delete(challengeId);
        return res.status(400).json({ success: false, errorType: 'OTP_EXPIRED', message: 'Mã OTP đã hết hạn. Vui lòng đăng ký/gửi lại mã mới.' });
      }
      if (challenge.attempts >= challenge.maxAttempts) {
        REGISTRATION_OTP_CHALLENGES.delete(challengeId);
        return res.status(429).json({ success: false, errorType: 'OTP_LOCKED', message: 'Mã OTP đã bị khóa do nhập sai quá nhiều lần.' });
      }

      const valid = await bcrypt.compare(String(otp).replace(/\\D/g, ''), challenge.otpHash);
      if (!valid) {
        challenge.attempts += 1;
        return res.status(400).json({ success: false, errorType: 'INVALID_OTP', remainingAttempts: Math.max(0, challenge.maxAttempts - challenge.attempts), message: 'Mã OTP không chính xác.' });
      }

      const registration = SAAS_REGISTRATIONS.find((r) => r.id === challenge.registrationId);
      if (!registration) return res.status(404).json({ success: false, errorType: 'REGISTRATION_NOT_FOUND', message: 'Không tìm thấy hồ sơ đăng ký.' });
      if (registration.status === 'APPROVED') {
        REGISTRATION_OTP_CHALLENGES.delete(challengeId);
        return res.json({ success: true, alreadyActivated: true, tenantId: registration.tenantId, message: 'Tài khoản đã được kích hoạt trước đó.' });
      }

      const result = executeCustomerApproval(registration.id, registration, 'OTP Auto Verification');
      if (!result.success) return res.status(result.httpStatus || 400).json(result);

      registration.status = 'APPROVED';
      registration.verifiedAt = new Date().toISOString();
      registration.verificationMethod = challenge.channel;
      registration.updatedAt = new Date().toISOString();
      saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);
      REGISTRATION_OTP_CHALLENGES.delete(challengeId);

      recordAuditLog({
        actorId: result.userId || 'customer-registration', actorName: registration.adminName, actorRole: 'TENANT_ADMIN',
        tenantId: result.tenantId || 'PLATFORM', action: 'CUSTOMER_REGISTRATION_VERIFIED', entity: 'SAAS_REGISTRATION',
        entityId: registration.id, details: 'OTP verification successful; tenant and administrator account auto-provisioned without Super Admin approval.', status: 'SUCCESS'
      });

      return res.json({
        success: true,
        activated: true,
        tenantId: result.tenantId,
        userId: result.userId,
        registrationCode: registration.registrationCode,
        message: 'Xác thực OTP thành công. Tài khoản doanh nghiệp đã được kích hoạt tự động. Bạn có thể đăng nhập ngay.'
      });
    } catch (e) {
      console.error('[SAAS_REGISTER_VERIFY] OTP verification error:', e);
      return res.status(500).json({ success: false, errorType: 'OTP_VERIFICATION_ERROR', message: 'Không thể xác thực OTP lúc này.' });
    }
  });

  // Resend registration OTP — 60-second cooldown.
  app.post('/api/saas/register/resend-otp', async (req, res) => {
    try {
      const { challengeId } = req.body || {};
      const challenge = REGISTRATION_OTP_CHALLENGES.get(String(challengeId || ''));
      if (!challenge) return res.status(400).json({ success: false, errorType: 'INVALID_CHALLENGE', message: 'Phiên OTP không hợp lệ hoặc đã hết hạn.' });
      if (Date.now() - challenge.lastSentAt < 60 * 1000) return res.status(429).json({ success: false, errorType: 'OTP_COOLDOWN', message: 'Vui lòng chờ 60 giây trước khi gửi lại OTP.' });

      const registration = SAAS_REGISTRATIONS.find((r) => r.id === challenge.registrationId);
      if (!registration) return res.status(404).json({ success: false, errorType: 'REGISTRATION_NOT_FOUND', message: 'Không tìm thấy hồ sơ đăng ký.' });

      const destination = challenge.channel === 'sms' ? registration.adminPhone : registration.adminEmail;
      const otp = crypto.randomInt(100000, 1000000).toString();
      challenge.otpHash = await bcrypt.hash(otp, 10);
      challenge.expiresAt = Date.now() + 5 * 60 * 1000;
      challenge.attempts = 0;
      challenge.lastSentAt = Date.now();

      const dispatch = await sendRegistrationOtp(challenge.channel, destination, otp, registration.companyName);
      if (!dispatch.success) return res.status(503).json({ success: false, errorType: 'OTP_PROVIDER_UNAVAILABLE', message: dispatch.error });

      return res.json({ success: true, destinationMasked: challenge.destinationMasked, message: 'Đã gửi lại mã OTP.' });
    } catch (e) {
      return res.status(500).json({ success: false, errorType: 'OTP_RESEND_ERROR', message: 'Không thể gửi lại OTP lúc này.' });
    }
  });
`;

const startIndex = source.indexOf(startMarker);
const endIndex = source.indexOf(endMarker, startIndex);
source = source.slice(0, startIndex) + otpSupport + source.slice(endIndex);

fs.writeFileSync(serverPath, source, 'utf8');
console.log('[render-prepare] Render readiness + customer OTP self-verification patch applied.');
