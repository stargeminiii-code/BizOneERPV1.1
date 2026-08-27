/* BizOne customer self-registration OTP bridge.
 * Keeps the existing registration modal compatible while the UI is migrated
 * to a first-class OTP step. It never exposes the OTP in the browser unless
 * the backend is running in non-production mode and the provider is absent.
 */
(() => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  const originalFetch = window.fetch.bind(window);
  const registrationUrl = '/api/saas/register';
  const verifyUrl = '/api/saas/register/verify-otp';
  const resendUrl = '/api/saas/register/resend-otp';

  window.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();

    if (!requestUrl.endsWith(registrationUrl) || method !== 'POST') {
      return originalFetch(input, init);
    }

    const response = await originalFetch(input, init);
    if (!response.ok) return response;

    let payload;
    try {
      payload = await response.clone().json();
    } catch {
      return response;
    }

    if (!payload?.requiresOtp || !payload?.challengeId) return response;

    const masked = payload.destinationMasked || 'phương thức liên hệ đã đăng ký';
    let attempts = 0;
    let lastMessage = payload.message || 'Mã OTP đã được gửi.';

    while (attempts < 5) {
      const otp = window.prompt(`${lastMessage}\n\nMã đã gửi tới: ${masked}\nNhập OTP 6 số:`);
      if (otp === null) {
        return new Response(JSON.stringify({
          success: false,
          errorType: 'OTP_CANCELLED',
          message: 'Bạn đã hủy bước xác thực OTP. Hồ sơ vẫn chưa được kích hoạt.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const verifyResponse = await originalFetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: payload.challengeId, otp: String(otp).trim() })
      });

      let verifyPayload = {};
      try { verifyPayload = await verifyResponse.json(); } catch {}

      if (verifyResponse.ok && verifyPayload?.success && verifyPayload?.activated) {
        const syntheticRegistration = {
          id: payload.registrationId,
          registrationCode: payload.registrationCode,
          status: 'APPROVED',
          tenantId: verifyPayload.tenantId,
          verificationMethod: payload.verificationMethod,
          verifiedAt: new Date().toISOString()
        };
        return new Response(JSON.stringify({
          success: true,
          registration: syntheticRegistration,
          activated: true,
          tenantId: verifyPayload.tenantId,
          userId: verifyPayload.userId,
          message: verifyPayload.message || 'Tài khoản đã được kích hoạt.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      attempts += 1;
      lastMessage = verifyPayload?.message || `Mã OTP không hợp lệ. Còn ${Math.max(0, 5 - attempts)} lần thử.`;

      if (attempts < 5 && window.confirm(`${lastMessage}\n\nBạn có muốn gửi lại OTP không?`)) {
        const resendResponse = await originalFetch(resendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: payload.challengeId })
        });
        if (resendResponse.ok) {
          lastMessage = 'Đã gửi lại mã OTP.';
        } else {
          lastMessage = 'Không thể gửi lại OTP ngay lúc này. Vui lòng thử lại sau.';
        }
      }
    }

    return new Response(JSON.stringify({
      success: false,
      errorType: 'OTP_FAILED',
      message: 'Xác thực OTP thất bại. Tài khoản chưa được kích hoạt.'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  };
})();
