import fs from 'node:fs';

const serverFile = 'server.ts';
let source = fs.readFileSync(serverFile, 'utf8');

// Render supplies PORT at runtime.
source = source.replace(/const PORT = 3000;/g, 'const PORT = Number(process.env.PORT) || 3000;');

// Browser frontend is hosted on wiup.vn while the API is on api.wiup.vn.
if (!source.includes('// BizOne API CORS')) {
  const cors = `
  // BizOne API CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = new Set(['https://wiup.vn', 'https://www.wiup.vn']);
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
`;
  const marker = '  // Middleware\n';
  if (!source.includes(marker)) throw new Error('[render-normalize] Middleware anchor not found.');
  source = source.replace(marker, cors + marker);
}

// -------------------------------------------------------------------------
// Resend Email OTP
// -------------------------------------------------------------------------
const dispatchStart = source.indexOf('async function dispatchEmailOtp(');
const resetMarker = '// =========================================================================\n// PASSWORD RESET IN-MEMORY STORES & INTERFACES';
const resetStart = source.indexOf(resetMarker);
if (dispatchStart < 0 || resetStart < 0 || dispatchStart > resetStart) {
  throw new Error('[render-normalize] OTP dispatch section not found.');
}

const emailDispatcher = `async function dispatchEmailOtp(toEmail: string, otp: string, recipientName: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { success: false, error: 'Resend chưa được cấu hình (RESEND_API_KEY/EMAIL_FROM).' };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject: 'Mã OTP BizOne ERP',
        text: 'Xin chào ' + recipientName + ', mã OTP BizOne ERP của bạn là ' + otp + '. Mã có hiệu lực 5 phút. Không cung cấp mã này cho người khác.',
        html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>BizOne ERP</h2><p>Xin chào ' + recipientName + ',</p><p>Mã xác thực của bạn:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 0">' + otp + '</div><p>Mã có hiệu lực trong <strong>5 phút</strong>.</p><p>Không cung cấp mã này cho bất kỳ ai.</p></div>'
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[OTP_EMAIL] Resend rejected:', response.status, detail.slice(0, 500));
      return { success: false, error: 'Resend HTTP ' + response.status };
    }
    return { success: true };
  } catch (error) {
    console.error('[OTP_EMAIL] Resend request failed:', error);
    return { success: false, error: 'Không thể kết nối Resend.' };
  }
}

async function dispatchSmsOtp(_toPhone: string, _otp: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'SMS chưa được bật; BizOne đang sử dụng Email OTP.' };
}

`;
source = source.slice(0, dispatchStart) + emailDispatcher + source.slice(resetStart);

// Password-reset request must succeed only when Resend actually accepts the email.
const oldDispatch = /      \/\/ Dispatch to email and SMS asynchronously\n      await Promise\.allSettled\(\[\n        dispatchEmailOtp\(targetUser\.email, otpStr, targetUser\.name\),\n        dispatchSmsOtp\(targetUser\.phone, otpStr\)\n      \]\);/;
const newDispatch = `      const emailDelivery = await dispatchEmailOtp(targetUser.email, otpStr, targetUser.name);
      if (!emailDelivery.success) {
        PASSWORD_RESET_CHALLENGES.delete(challengeId);
        console.error('[PASSWORD_RESET] Email OTP delivery failed:', emailDelivery.error);
        return res.status(503).json({
          success: false,
          errorType: 'OTP_DELIVERY_UNAVAILABLE',
          error: 'Không thể gửi OTP qua email lúc này. Vui lòng thử lại sau.'
        });
      }`;
if (!oldDispatch.test(source)) throw new Error('[render-normalize] Password reset dispatch block not found.');
source = source.replace(oldDispatch, newDispatch);

// -------------------------------------------------------------------------
// Customer self-registration Email OTP
// The existing frontend bridge calls /register, /register/verify-otp and
// /register/resend-otp. Add the backend contract without exposing OTP values.
// -------------------------------------------------------------------------
const saasStoreMarker = "  const SAAS_SUBSCRIPTIONS: any[] = loadDataStore<any[]>('saas_subscriptions.json', []);";
if (!source.includes(saasStoreMarker)) throw new Error('[render-normalize] SaaS store marker not found.');
if (!source.includes('REGISTRATION_OTP_CHALLENGES')) {
  const registrationStore = `${saasStoreMarker}

  interface RegistrationOtpChallenge {
    challengeId: string;
    registrationId: string;
    otpHash: string;
    expiresAt: number;
    attempts: number;
    maxAttempts: number;
    used: boolean;
    createdAt: number;
  }
  const REGISTRATION_OTP_CHALLENGES = new Map<string, RegistrationOtpChallenge>();
`;
  source = source.replace(saasStoreMarker, registrationStore);
}

const registrationSaveMarker = "      SAAS_REGISTRATIONS.unshift(newRegistration);\n      saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);";
if (!source.includes(registrationSaveMarker)) throw new Error('[render-normalize] Registration save block not found.');
if (!source.includes('requiresOtp: true')) {
  const registrationOtpBlock = `      const registrationOtp = crypto.randomInt(100000, 1000000).toString();
      const registrationChallengeId = 'roc_' + crypto.randomBytes(16).toString('hex');
      REGISTRATION_OTP_CHALLENGES.set(registrationChallengeId, {
        challengeId: registrationChallengeId,
        registrationId: newRegistration.id,
        otpHash: bcrypt.hashSync(registrationOtp, 8),
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
        maxAttempts: 5,
        used: false,
        createdAt: Date.now()
      });

      const registrationDelivery = await dispatchEmailOtp(
        newRegistration.adminEmail,
        registrationOtp,
        newRegistration.adminName
      );
      if (!registrationDelivery.success) {
        REGISTRATION_OTP_CHALLENGES.delete(registrationChallengeId);
        return res.status(503).json({
          success: false,
          errorType: 'OTP_DELIVERY_UNAVAILABLE',
          message: 'Không thể gửi OTP qua email. Vui lòng kiểm tra email và thử lại sau.'
        });
      }

      SAAS_REGISTRATIONS.unshift(newRegistration);
      saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);`;
  source = source.replace(registrationSaveMarker, registrationOtpBlock);

  source = source.replace(
    "        success: true,\n        registration: newRegistration,\n        message: 'Đăng ký thành công. Hồ sơ đang chờ BizOne duyệt.'",
    "        success: true,\n        requiresOtp: true,\n        challengeId: registrationChallengeId,\n        registrationId: newRegistration.id,\n        registrationCode: newRegistration.registrationCode,\n        destinationMasked: maskEmail(newRegistration.adminEmail),\n        verificationMethod: 'email',\n        registration: { ...newRegistration, passwordHash: undefined },\n        message: 'Đăng ký thành công. Mã OTP đã được gửi tới email đăng ký.'"
  );
}

// Insert registration OTP verification/resend endpoints immediately before
// the existing Super Admin registration-list endpoint.
const registrationListMarker = "  app.get('/api/saas/registrations', authenticateToken, (req: any, res) => {";
if (!source.includes(registrationListMarker)) throw new Error('[render-normalize] Registration list marker not found.');
if (!source.includes("app.post('/api/saas/register/verify-otp'")) {
  const otpRoutes = `  app.post('/api/saas/register/verify-otp', async (req, res) => {
    try {
      const { challengeId, otp } = req.body || {};
      const challenge = REGISTRATION_OTP_CHALLENGES.get(String(challengeId || ''));
      if (!challenge || challenge.used) return res.status(400).json({ success: false, message: 'OTP không hợp lệ hoặc đã được sử dụng.' });
      if (Date.now() > challenge.expiresAt) return res.status(400).json({ success: false, message: 'OTP đã hết hạn. Vui lòng gửi lại mã.' });
      if (challenge.attempts >= challenge.maxAttempts) return res.status(429).json({ success: false, message: 'Bạn đã nhập sai OTP quá số lần cho phép.' });
      const valid = await bcrypt.compare(String(otp || '').trim(), challenge.otpHash);
      if (!valid) {
        challenge.attempts += 1;
        return res.status(400).json({ success: false, message: 'OTP không chính xác.' });
      }
      const reg = SAAS_REGISTRATIONS.find((r) => r.id === challenge.registrationId);
      if (!reg) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký.' });
      challenge.used = true;
      const result = executeCustomerApproval(reg.id, reg, 'Customer Email OTP');
      if (!result.success) return res.status(result.httpStatus || 400).json(result);
      REGISTRATION_OTP_CHALLENGES.delete(challenge.challengeId);
      return res.json({ success: true, activated: true, tenantId: result.tenantId, userId: result.userId, message: 'Xác thực email thành công. Tài khoản BizOne ERP đã được kích hoạt.' });
    } catch (e: any) {
      console.error('[REGISTRATION_OTP_VERIFY]', e);
      return res.status(500).json({ success: false, message: 'Lỗi xác thực OTP.' });
    }
  });

  app.post('/api/saas/register/resend-otp', async (req, res) => {
    try {
      const { challengeId } = req.body || {};
      const challenge = REGISTRATION_OTP_CHALLENGES.get(String(challengeId || ''));
      if (!challenge || challenge.used) return res.status(400).json({ success: false, message: 'Phiên OTP không hợp lệ.' });
      const reg = SAAS_REGISTRATIONS.find((r) => r.id === challenge.registrationId);
      if (!reg) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký.' });
      const otp = crypto.randomInt(100000, 1000000).toString();
      challenge.otpHash = bcrypt.hashSync(otp, 8);
      challenge.expiresAt = Date.now() + 5 * 60 * 1000;
      challenge.attempts = 0;
      const delivery = await dispatchEmailOtp(reg.adminEmail, otp, reg.adminName);
      if (!delivery.success) return res.status(503).json({ success: false, message: 'Không thể gửi lại OTP lúc này.' });
      return res.json({ success: true, message: 'Đã gửi lại OTP tới email đăng ký.' });
    } catch (e: any) {
      console.error('[REGISTRATION_OTP_RESEND]', e);
      return res.status(500).json({ success: false, message: 'Lỗi gửi lại OTP.' });
    }
  });

`;
  source = source.replace(registrationListMarker, otpRoutes + registrationListMarker);
}

fs.writeFileSync(serverFile, source, 'utf8');
console.log('[render-normalize] Resend Email OTP + customer self-registration OTP + Render CORS/PORT patch applied.');
