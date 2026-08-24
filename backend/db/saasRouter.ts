import express from 'express';
import { approveRegistration, createPendingRegistration, listRegistrations } from './authRepository';
import { dbAuthMiddleware } from './authRouter';

export const dbSaasRouter = express.Router();

function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền thao tác SaaS.' });
  next();
}

dbSaasRouter.post('/register', async (req, res) => {
  try {
    const b = req.body ?? {};
    if (!b.companyName || !b.adminName || !b.adminEmail || !b.adminPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin doanh nghiệp và tài khoản quản trị.' });
    }
    const registration = await createPendingRegistration({
      companyName: b.companyName,
      taxCode: b.taxCode,
      representative: b.representative,
      email: b.email,
      phone: b.phone,
      address: b.address,
      username: b.adminUsername || b.adminPhone || b.adminEmail.split('@')[0],
      adminName: b.adminName,
      adminEmail: b.adminEmail,
      adminPhone: b.adminPhone || b.phone,
      password: b.adminPassword,
      planCode: 'FREE',
      notes: b.notes,
    });
    return res.json({ success: true, registration, message: 'Đăng ký thành công. Hồ sơ đang chờ BizOne duyệt.' });
  } catch (error: any) {
    console.error('[DB_SAAS_REGISTER]', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo hồ sơ đăng ký trên database.' });
  }
});

dbSaasRouter.get('/registrations', dbAuthMiddleware(), requireSuperAdmin, async (_req, res) => {
  try { return res.json({ success: true, registrations: await listRegistrations() }); }
  catch { return res.status(500).json({ success: false, error: 'Không thể đọc danh sách đăng ký.' }); }
});

dbSaasRouter.post('/registrations/:id/approve', dbAuthMiddleware(), requireSuperAdmin, async (req, res) => {
  try {
    const result = await approveRegistration(req.params.id, req.user.uid);
    return res.json({ success: true, ...result, status: 'active', planCode: 'FREE', message: 'Đã duyệt tài khoản. Tài khoản khách có thể đăng nhập và sử dụng gói Free vĩnh viễn.' });
  } catch (error: any) {
    if (error?.message === 'REGISTRATION_NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đăng ký.' });
    console.error('[DB_SAAS_APPROVE]', error);
    return res.status(500).json({ success: false, error: 'Không thể phê duyệt hồ sơ trên database.' });
  }
});

dbSaasRouter.post('/approve-registration', dbAuthMiddleware(), requireSuperAdmin, async (req, res) => {
  try {
    const result = await approveRegistration(String(req.body?.registrationId), req.user.uid);
    return res.json({ success: true, ...result, status: 'active', planCode: 'FREE' });
  } catch (error: any) {
    if (error?.message === 'REGISTRATION_NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ đăng ký.' });
    return res.status(500).json({ success: false, error: 'Không thể phê duyệt hồ sơ trên database.' });
  }
});
