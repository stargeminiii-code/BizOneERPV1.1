import fs from 'node:fs';

// Normalize generated OTP patch escaping.
const prepareFile = 'scripts/render-prepare.mjs';
let prepareSource = fs.readFileSync(prepareFile, 'utf8');
prepareSource = prepareSource.replaceAll('\\\\`', '\\`');
prepareSource = prepareSource.replaceAll('\\\\${', '\\${');
fs.writeFileSync(prepareFile, prepareSource, 'utf8');

// Render supplies PORT at runtime. Keep the repository source compatible with
// both local development and Render without adding another runtime dependency.
const serverFile = 'server.ts';
let serverSource = fs.readFileSync(serverFile, 'utf8');
serverSource = serverSource.replace(
  'const PORT = 3000;',
  'const PORT = Number(process.env.PORT) || 3000;'
);

// Frontend is hosted separately on wiup.vn / www.wiup.vn. Allow only those
// browser origins to call the Render API; keep non-browser/server requests
// working without requiring an Origin header.
const corsMarker = '  // BizOne API CORS';
if (!serverSource.includes(corsMarker)) {
  const corsMiddleware = `\n${corsMarker}\n  app.use((req, res, next) => {\n    const origin = req.headers.origin;\n    const allowedOrigins = new Set([\n      'https://wiup.vn',\n      'https://www.wiup.vn'\n    ]);\n\n    if (origin && allowedOrigins.has(origin)) {\n      res.setHeader('Access-Control-Allow-Origin', origin);\n      res.setHeader('Vary', 'Origin');\n      res.setHeader('Access-Control-Allow-Credentials', 'true');\n      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');\n      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');\n    }\n\n    if (req.method === 'OPTIONS') {\n      return res.sendStatus(204);\n    }\n\n    next();\n  });\n`;

  const middlewareAnchor = '  // Middleware\n';
  if (!serverSource.includes(middlewareAnchor)) {
    throw new Error('[render-normalize] Could not locate server middleware anchor.');
  }
  serverSource = serverSource.replace(middlewareAnchor, corsMiddleware + '\n' + middlewareAnchor);
}

// -------------------------------------------------------------------------
// Real OTP delivery providers
// - SMS: Twilio REST API (no SDK required)
// - Email: Resend REST API (no SDK required)
// Secrets are supplied only through Render environment variables.
// -------------------------------------------------------------------------
const emailStart = serverSource.indexOf('async function dispatchEmailOtp(');
const smsStart = serverSource.indexOf('async function dispatchSmsOtp(');
const resetMarker = '// =========================================================================\n// PASSWORD RESET IN-MEMORY STORES & INTERFACES';
const resetStart = serverSource.indexOf(resetMarker);

if (emailStart < 0 || smsStart < 0 || resetStart < 0 || emailStart > smsStart || smsStart > resetStart) {
  throw new Error('[render-normalize] Could not locate OTP dispatch functions.');
}

const otpDeliverySource = `async function dispatchEmailOtp(toEmail: string, otp: string, recipientName: string): Promise<{ success: boolean; error?: string }> {\n  const apiKey = process.env.RESEND_API_KEY;\n  const from = process.env.EMAIL_FROM;\n\n  if (!apiKey || !from) {\n    return { success: false, error: 'Email OTP provider chưa được cấu hình (RESEND_API_KEY/EMAIL_FROM).' };\n  }\n\n  try {\n    const response = await fetch('https://api.resend.com/emails', {\n      method: 'POST',\n      headers: {\n        Authorization: \`Bearer \${apiKey}\`,\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({\n        from,\n        to: [toEmail],\n        subject: 'Mã OTP BizOne ERP - Đặt lại mật khẩu',\n        text: \`Xin chào \${recipientName}, mã OTP BizOne ERP của bạn là \${otp}. Mã có hiệu lực 5 phút. Không cung cấp mã này cho người khác.\`,\n        html: \`<p>Xin chào \${recipientName},</p><p>Mã OTP BizOne ERP của bạn là <strong>\${otp}</strong>.</p><p>Mã có hiệu lực trong 5 phút. Không cung cấp mã này cho người khác.</p>\`\n      })\n    });\n\n    if (!response.ok) {\n      const detail = await response.text().catch(() => '');\n      console.error('[OTP_EMAIL] Provider rejected request:', response.status, detail.slice(0, 500));\n      return { success: false, error: \`Email provider trả về HTTP \${response.status}.\` };\n    }\n\n    return { success: true };\n  } catch (error) {\n    console.error('[OTP_EMAIL] Dispatch failed:', error);\n    return { success: false, error: 'Không thể kết nối email provider.' };\n  }\n}\n\nasync function dispatchSmsOtp(toPhone: string, otp: string): Promise<{ success: boolean; error?: string }> {\n  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();\n  const accountSid = process.env.TWILIO_ACCOUNT_SID;\n  const authToken = process.env.TWILIO_AUTH_TOKEN;\n  const fromNumber = process.env.TWILIO_FROM_NUMBER;\n\n  if (provider !== 'twilio') {\n    return { success: false, error: \`SMS provider '${provider}' chưa được hỗ trợ.\` };\n  }\n\n  if (!accountSid || !authToken || !fromNumber) {\n    return { success: false, error: 'SMS provider chưa được cấu hình (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER).' };\n  }\n\n  try {\n    const params = new URLSearchParams({\n      To: toPhone,\n      From: fromNumber,\n      Body: \`Mã OTP BizOne ERP: \${otp}. Có hiệu lực 5 phút. Không cung cấp mã này cho người khác.\`\n    });\n\n    const response = await fetch(\`https://api.twilio.com/2010-04-01/Accounts/\${accountSid}/Messages.json\`, {\n      method: 'POST',\n      headers: {\n        Authorization: 'Basic ' + Buffer.from(\`\${accountSid}:\${authToken}\`).toString('base64'),\n        'Content-Type': 'application/x-www-form-urlencoded'\n      },\n      body: params.toString()\n    });\n\n    if (!response.ok) {\n      const detail = await response.text().catch(() => '');\n      console.error('[OTP_SMS] Provider rejected request:', response.status, detail.slice(0, 500));\n      return { success: false, error: \`SMS provider trả về HTTP \${response.status}.\` };\n    }\n\n    return { success: true };\n  } catch (error) {\n    console.error('[OTP_SMS] Dispatch failed:', error);\n    return { success: false, error: 'Không thể kết nối SMS provider.' };\n  }\n}\n\n`;

serverSource = serverSource.slice(0, emailStart) + otpDeliverySource + serverSource.slice(resetStart);

// Make the reset endpoint report delivery failure instead of falsely telling
// the customer that an OTP was sent when no provider is configured.
const dispatchOld = `      // Dispatch to email and SMS asynchronously\n      await Promise.allSettled([\n        dispatchEmailOtp(targetUser.email, otpStr, targetUser.name),\n        dispatchSmsOtp(targetUser.phone, otpStr)\n      ]);`;
const dispatchNew = `      // Deliver through configured providers. At least one channel must succeed.\n      const deliveryResults = await Promise.all([\n        dispatchEmailOtp(targetUser.email, otpStr, targetUser.name),\n        dispatchSmsOtp(targetUser.phone, otpStr)\n      ]);\n      const emailDelivery = deliveryResults[0];\n      const smsDelivery = deliveryResults[1];\n\n      if (!emailDelivery.success && !smsDelivery.success) {\n        PASSWORD_RESET_CHALLENGES.delete(challengeId);\n        console.error('[PASSWORD_RESET] No OTP delivery channel succeeded.', {\n          email: emailDelivery.error,\n          sms: smsDelivery.error\n        });\n        return res.status(503).json({\n          success: false,\n          errorType: 'OTP_DELIVERY_UNAVAILABLE',\n          error: 'Dịch vụ gửi OTP hiện chưa được cấu hình. Vui lòng thử lại sau.'\n        });\n      }`;

if (serverSource.includes(dispatchOld)) {
  serverSource = serverSource.replace(dispatchOld, dispatchNew);
} else if (!serverSource.includes("OTP_DELIVERY_UNAVAILABLE")) {
  throw new Error('[render-normalize] Could not locate password reset dispatch block.');
}

fs.writeFileSync(serverFile, serverSource, 'utf8');
console.log('[render-normalize] Render API CORS + dynamic PORT + real OTP provider normalization applied.');
`;

// The template above contains literal ${...} sequences that must remain in the
// generated server source. This final write intentionally preserves them.
fs.writeFileSync('scripts/render-normalize.mjs', serverSource.replace(serverSource, fs.readFileSync('scripts/render-normalize.mjs', 'utf8')), 'utf8');
