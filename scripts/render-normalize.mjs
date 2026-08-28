import fs from 'node:fs';

// Normalize generated OTP patch escaping.
const prepareFile = 'scripts/render-prepare.mjs';
let prepareSource = fs.readFileSync(prepareFile, 'utf8');
prepareSource = prepareSource.replaceAll('\\\\`', '\\`');
prepareSource = prepareSource.replaceAll('\\\\${', '\\${');
fs.writeFileSync(prepareFile, prepareSource, 'utf8');

const serverFile = 'server.ts';
let serverSource = fs.readFileSync(serverFile, 'utf8');
serverSource = serverSource.replace(
  'const PORT = 3000;',
  'const PORT = Number(process.env.PORT) || 3000;'
);

// Frontend is hosted separately on wiup.vn / www.wiup.vn.
const corsMarker = '  // BizOne API CORS';
if (!serverSource.includes(corsMarker)) {
  const corsMiddleware = [
    '',
    corsMarker,
    '  app.use((req, res, next) => {',
    '    const origin = req.headers.origin;',
    '    const allowedOrigins = new Set([',
    "      'https://wiup.vn',",
    "      'https://www.wiup.vn'",
    '    ]);',
    '',
    '    if (origin && allowedOrigins.has(origin)) {',
    "      res.setHeader('Access-Control-Allow-Origin', origin);",
    "      res.setHeader('Vary', 'Origin');",
    "      res.setHeader('Access-Control-Allow-Credentials', 'true');",
    "      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');",
    "      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');",
    '    }',
    '',
    "    if (req.method === 'OPTIONS') {",
    '      return res.sendStatus(204);',
    '    }',
    '',
    '    next();',
    '  });',
    ''
  ].join('\\n');

  const middlewareAnchor = '  // Middleware\\n';
  if (!serverSource.includes(middlewareAnchor)) {
    throw new Error('[render-normalize] Could not locate server middleware anchor.');
  }
  serverSource = serverSource.replace(middlewareAnchor, corsMiddleware + '\\n' + middlewareAnchor);
}

// Replace the placeholder OTP dispatchers with real provider integrations.
const emailStart = serverSource.indexOf('async function dispatchEmailOtp(');
const resetMarker = '// =========================================================================\\n// PASSWORD RESET IN-MEMORY STORES & INTERFACES';
const resetStart = serverSource.indexOf(resetMarker);
if (emailStart < 0 || resetStart < 0 || emailStart > resetStart) {
  throw new Error('[render-normalize] Could not locate OTP dispatch section.');
}

const otpDeliverySource = [
  'async function dispatchEmailOtp(toEmail: string, otp: string, recipientName: string): Promise<{ success: boolean; error?: string }> {',
  '  const apiKey = process.env.RESEND_API_KEY;',
  '  const from = process.env.EMAIL_FROM;',
  '',
  "  if (!apiKey || !from) {",
  "    return { success: false, error: 'Email OTP provider chưa được cấu hình (RESEND_API_KEY/EMAIL_FROM).' };",
  '  }',
  '',
  '  try {',
  "    const response = await fetch('https://api.resend.com/emails', {",
  "      method: 'POST',",
  "      headers: {",
  "        Authorization: 'Bearer ' + apiKey,",
  "        'Content-Type': 'application/json'",
  '      },',
  '      body: JSON.stringify({',
  '        from,',
  '        to: [toEmail],',
  "        subject: 'Mã OTP BizOne ERP - Đặt lại mật khẩu',",
  "        text: 'Xin chào ' + recipientName + ', mã OTP BizOne ERP của bạn là ' + otp + '. Mã có hiệu lực 5 phút. Không cung cấp mã này cho người khác.',",
  "        html: '<p>Xin chào ' + recipientName + ',</p><p>Mã OTP BizOne ERP của bạn là <strong>' + otp + '</strong>.</p><p>Mã có hiệu lực trong 5 phút. Không cung cấp mã này cho người khác.</p>'",
  '      })',
  '    });',
  '',
  '    if (!response.ok) {',
  "      const detail = await response.text().catch(() => '');",
  "      console.error('[OTP_EMAIL] Provider rejected request:', response.status, detail.slice(0, 500));",
  "      return { success: false, error: 'Email provider trả về HTTP ' + response.status + '.' };",
  '    }',
  '',
  '    return { success: true };',
  '  } catch (error) {',
  "    console.error('[OTP_EMAIL] Dispatch failed:', error);",
  "    return { success: false, error: 'Không thể kết nối email provider.' };",
  '  }',
  '}',
  '',
  'async function dispatchSmsOtp(toPhone: string, otp: string): Promise<{ success: boolean; error?: string }> {',
  "  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();",
  '  const accountSid = process.env.TWILIO_ACCOUNT_SID;',
  '  const authToken = process.env.TWILIO_AUTH_TOKEN;',
  '  const fromNumber = process.env.TWILIO_FROM_NUMBER;',
  '',
  "  if (provider !== 'twilio') {",
  "    return { success: false, error: \"SMS provider '" + "' + provider + '" + "' chưa được hỗ trợ.\" };",
  '  }',
  '',
  '  if (!accountSid || !authToken || !fromNumber) {',
  "    return { success: false, error: 'SMS provider chưa được cấu hình (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER).' };",
  '  }',
  '',
  '  try {',
  '    const params = new URLSearchParams({',
  '      To: toPhone,',
  '      From: fromNumber,',
  "      Body: 'Mã OTP BizOne ERP: ' + otp + '. Có hiệu lực 5 phút. Không cung cấp mã này cho người khác.'",
  '    });',
  '',
  "    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {",
  "      method: 'POST',",
  '      headers: {',
  "        Authorization: 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'),",
  "        'Content-Type': 'application/x-www-form-urlencoded'",
  '      },',
  '      body: params.toString()',
  '    });',
  '',
  '    if (!response.ok) {',
  "      const detail = await response.text().catch(() => '');",
  "      console.error('[OTP_SMS] Provider rejected request:', response.status, detail.slice(0, 500));",
  "      return { success: false, error: 'SMS provider trả về HTTP ' + response.status + '.' };",
  '    }',
  '',
  '    return { success: true };',
  '  } catch (error) {',
  "    console.error('[OTP_SMS] Dispatch failed:', error);",
  "    return { success: false, error: 'Không thể kết nối SMS provider.' };",
  '  }',
  '}',
  ''
].join('\\n');

serverSource = serverSource.slice(0, emailStart) + otpDeliverySource + serverSource.slice(resetStart);

const dispatchOld = [
  '      // Dispatch to email and SMS asynchronously',
  '      await Promise.allSettled([',
  '        dispatchEmailOtp(targetUser.email, otpStr, targetUser.name),',
  '        dispatchSmsOtp(targetUser.phone, otpStr)',
  '      ]);'
].join('\\n');

const dispatchNew = [
  '      // Deliver through configured providers. At least one channel must succeed.',
  '      const deliveryResults = await Promise.all([',
  '        dispatchEmailOtp(targetUser.email, otpStr, targetUser.name),',
  '        dispatchSmsOtp(targetUser.phone, otpStr)',
  '      ]);',
  '      const emailDelivery = deliveryResults[0];',
  '      const smsDelivery = deliveryResults[1];',
  '',
  '      if (!emailDelivery.success && !smsDelivery.success) {',
  '        PASSWORD_RESET_CHALLENGES.delete(challengeId);',
  "        console.error('[PASSWORD_RESET] No OTP delivery channel succeeded.', {", 
  '          email: emailDelivery.error,',
  '          sms: smsDelivery.error',
  '        });',
  '        return res.status(503).json({',
  "          success: false,",
  "          errorType: 'OTP_DELIVERY_UNAVAILABLE',",
  "          error: 'Dịch vụ gửi OTP hiện chưa được cấu hình. Vui lòng thử lại sau.'",
  '        });',
  '      }'
].join('\\n');

if (serverSource.includes(dispatchOld)) {
  serverSource = serverSource.replace(dispatchOld, dispatchNew);
} else if (!serverSource.includes('OTP_DELIVERY_UNAVAILABLE')) {
  throw new Error('[render-normalize] Could not locate password reset dispatch block.');
}

fs.writeFileSync(serverFile, serverSource, 'utf8');
console.log('[render-normalize] Render API CORS + dynamic PORT + real OTP provider normalization applied.');
