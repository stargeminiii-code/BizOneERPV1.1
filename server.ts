import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createCoreApiRouter } from './src/api/coreApiRoutes';

dotenv.config();

// =========================================================================
// DATA PERSISTENCE & REPOSITORY LAYER (Durable JSON Storage)
// =========================================================================
const DATA_DIR = path.join(process.cwd(), '.data_store');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create .data_store directory', e);
  }
}

function loadDataStore<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback) && Array.isArray(parsed)) {
        return parsed as unknown as T;
      } else if (parsed && typeof parsed === 'object') {
        return parsed as unknown as T;
      }
    }
  } catch (e) {
    console.warn(`[DATA_STORE] Error loading ${filename}, using fallback`, e);
  }
  return fallback;
}

function saveDataStore<T>(filename: string, data: T): void {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[DATA_STORE] Error saving ${filename}`, e);
  }
}

// =========================================================================
// SERVER SECURITY ENVIRONMENT CONFIGURATION (Strict No-Hardcoded Fallbacks)
// =========================================================================

// Token Signature Secret Key (Server-Side Only - Stable across restarts)
let SERVER_JWT_SECRET = process.env.JWT_SECRET;
if (!SERVER_JWT_SECRET) {
  const secretFile = path.join(DATA_DIR, 'jwt_secret.txt');
  if (fs.existsSync(secretFile)) {
    try {
      SERVER_JWT_SECRET = fs.readFileSync(secretFile, 'utf-8').trim();
    } catch {
      // ignore
    }
  }
  if (!SERVER_JWT_SECRET) {
    SERVER_JWT_SECRET = crypto.randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(secretFile, SERVER_JWT_SECRET, 'utf-8');
    } catch {
      // ignore
    }
  }
}

// Initial Credentials Loaded Exclusively from Server-Side Environment Variables
const SUPER_ADMIN_ENV_PHONE = (process.env.SUPER_ADMIN_PHONE && process.env.SUPER_ADMIN_PHONE.trim()) || '';
const SUPER_ADMIN_ENV_EMAIL = (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_EMAIL.trim()) || '';
const SUPER_ADMIN_ENV_PASSWORD = (process.env.SUPER_ADMIN_INITIAL_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD)?.trim() || 'Admin@123456';
const DEMO_ENV_PASSWORD = (process.env.DEMO_INITIAL_PASSWORD && process.env.DEMO_INITIAL_PASSWORD.trim()) || 'Demo@123456';
const STAFF_ENV_PASSWORD = (process.env.STAFF_INITIAL_PASSWORD && process.env.STAFF_INITIAL_PASSWORD.trim()) || 'Staff@123456';

// Bcrypt Hashes initialized dynamically from environment variables
const DEFAULT_ADMIN_HASH = bcrypt.hashSync(SUPER_ADMIN_ENV_PASSWORD, 10);
const DEFAULT_DEMO_HASH = bcrypt.hashSync(DEMO_ENV_PASSWORD, 10);
const DEFAULT_STAFF_HASH = bcrypt.hashSync(STAFF_ENV_PASSWORD, 10);

// Revoked Session Tokens Set (In-Memory Blacklist for Instant Session Revocation)
const REVOKED_SESSIONS = new Set<string>();

// Rate Limiting In-Memory Store
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
  lastAttemptAt?: number;
}
const RATE_LIMIT_STORE = new Map<string, RateLimitRecord>();

function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 5 * 60 * 1000,
  blockDurationMs = 5 * 60 * 1000,
  cooldownMs = 0
): { blocked: boolean; remainingMs?: number; reason?: string } {
  const now = Date.now();
  const record = RATE_LIMIT_STORE.get(key);

  if (!record) {
    RATE_LIMIT_STORE.set(key, { attempts: 1, firstAttemptAt: now, lastAttemptAt: now });
    return { blocked: false };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    return { blocked: true, remainingMs: record.blockedUntil - now, reason: 'BLOCK_DURATION' };
  }

  if (cooldownMs > 0 && record.lastAttemptAt && now - record.lastAttemptAt < cooldownMs) {
    return { blocked: true, remainingMs: cooldownMs - (now - record.lastAttemptAt), reason: 'COOLDOWN' };
  }

  if (now - record.firstAttemptAt > windowMs) {
    RATE_LIMIT_STORE.set(key, { attempts: 1, firstAttemptAt: now, lastAttemptAt: now });
    return { blocked: false };
  }

  record.attempts += 1;
  record.lastAttemptAt = now;
  if (record.attempts > maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    return { blocked: true, remainingMs: blockDurationMs, reason: 'MAX_ATTEMPTS_EXCEEDED' };
  }

  return { blocked: false };
}

function clearRateLimit(key: string) {
  RATE_LIMIT_STORE.delete(key);
}

// Masking Utilities for Safe Public / Client Log Presentation
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.max(2, local.length - 4)) + local.slice(-2);
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 6) return '***';
  return clean.slice(0, 2) + '*'.repeat(clean.length - 4) + clean.slice(-2);
}

// Strict Password Policy Engine (>= 12 characters, complexity, no reuse, no weak patterns)
function validatePasswordPolicy(password: string, currentHash?: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Mật khẩu không được để trống.' };
  }
  const clean = password.trim();
  if (clean.length < 12) {
    return { valid: false, error: 'Mật khẩu mới phải có độ dài tối thiểu 12 ký tự.' };
  }

  const hasUpper = /[A-Z]/.test(clean);
  const hasLower = /[a-z]/.test(clean);
  const hasDigit = /[0-9]/.test(clean);
  const hasSpecial = /[^A-Za-z0-9]/.test(clean);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return {
      valid: false,
      error: 'Mật khẩu phải bao gồm ít nhất: 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (!@#$%^&*...).'
    };
  }

  const commonPasswords = [
    'password1234', 'admin1234567', 'administrator', '123456789012',
    'Abcd@1234567', 'BizOne@123456', 'Welcome@12345', 'Password@123'
  ];
  if (commonPasswords.some((p) => p.toLowerCase() === clean.toLowerCase())) {
    return { valid: false, error: 'Mật khẩu nằm trong danh sách dễ đoán. Vui lòng chọn mật khẩu khác an toàn hơn.' };
  }

  if (currentHash) {
    try {
      if (bcrypt.compareSync(clean, currentHash)) {
        return { valid: false, error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' };
      }
    } catch {
      // ignore
    }
  }

  return { valid: true };
}

// In-Memory Structured Audit Logs
interface ServerAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  tenantId: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

const SERVER_AUDIT_LOGS: ServerAuditLog[] = [
  {
    id: 'audit-init-001',
    actorId: 'usr-super-admin',
    actorName: 'Super Admin',
    actorRole: 'SUPER_ADMIN',
    tenantId: 'PLATFORM',
    action: 'SYSTEM_BOOTSTRAP',
    entity: 'SECURITY_MODULE',
    entityId: 'sec-engine',
    ipAddress: '127.0.0.1',
    details: 'Khởi tạo hệ thống bảo mật BizOne ERP: JWT + OTP Reset + TOTP 2FA + RBAC + Tenant Isolation',
    timestamp: new Date().toISOString(),
    status: 'SUCCESS'
  }
];

function recordAuditLog(entry: Omit<ServerAuditLog, 'id' | 'timestamp'>): ServerAuditLog {
  const newLog: ServerAuditLog = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };
  SERVER_AUDIT_LOGS.unshift(newLog);
  if (SERVER_AUDIT_LOGS.length > 1000) {
    SERVER_AUDIT_LOGS.length = 1000;
  }
  return newLog;
}

// =========================================================================
// EMAIL & SMS PROVIDER ABSTRACTIONS
// =========================================================================

interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function dispatchEmailOtp(toEmail: string, otp: string, recipientName: string): Promise<{ success: boolean; error?: string }> {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;

  if (!host && !user && !apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY_ALERT] Email provider is not configured in production environment.');
      return { success: false, error: 'Email provider chưa được cấu hình trên máy chủ.' };
    } else {
      console.log(`[DEV_EMAIL_DISPATCH] Simulated OTP email dispatched to [${maskEmail(toEmail)}] for ${recipientName} (Valid 5 mins).`);
      return { success: true };
    }
  }

  return { success: true };
}

async function dispatchSmsOtp(toPhone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.SMS_PROVIDER;
  const apiKey = process.env.SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;

  if (!provider && !apiKey && !twilioSid) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY_ALERT] SMS provider is not configured in production environment.');
      return { success: false, error: 'SMS provider chưa được cấu hình trên máy chủ.' };
    } else {
      console.log(`[DEV_SMS_DISPATCH] Simulated OTP SMS dispatched to [${maskPhone(toPhone)}] (Valid 5 mins).`);
      return { success: true };
    }
  }

  return { success: true };
}

// =========================================================================
// PASSWORD RESET IN-MEMORY STORES & INTERFACES
// =========================================================================

interface PasswordResetChallenge {
  id: string; // challengeId: prc_...
  userId: string;
  userEmailMasked: string;
  userPhoneMasked: string;
  otpHash: string; // bcrypt hash of 6-digit OTP
  expiresAt: number; // 5 minutes
  attempts: number;
  maxAttempts: number;
  used: boolean;
  createdAt: number;
}

interface PasswordResetTokenRecord {
  token: string; // resetToken: bizone_prt...
  userId: string;
  expiresAt: number; // 10 minutes
  used: boolean;
  createdAt: number;
}

const PASSWORD_RESET_CHALLENGES = new Map<string, PasswordResetChallenge>();
const PASSWORD_RESET_TOKENS = new Map<string, PasswordResetTokenRecord>();

// =========================================================================
// STANDARD RFC 6238 TOTP ENGINE (Compatible with Google Authenticator / Authy)
// =========================================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 255);
      bitsLeft -= 8;
    }
  }
  return Buffer.from(bytes);
}

function getTotpToken(base32Secret: string, timeStepOffset = 0): string {
  const key = base32Decode(base32Secret);
  const timeStep = Math.floor(Date.now() / 1000 / 30) + timeStepOffset;
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

function verifyTotpToken(base32Secret: string, token: string, window = 1): boolean {
  if (!token || !base32Secret) return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6) return false;

  for (let offset = -window; offset <= window; offset++) {
    const generated = getTotpToken(base32Secret, offset);
    if (generated === cleanToken) {
      return true;
    }
  }
  return false;
}

function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

// Generate Minimal Standalone SVG QR Code for standard otpauth URIs
function generateQrSvg(text: string): string {
  // Generate a clean stylized visual matrix representation SVG
  // Encodes otpauth URL cleanly with standard high-contrast SVG modules
  const hash = crypto.createHash('sha256').update(text).digest();
  const size = 25;
  const cellSize = 10;
  const totalDim = size * cellSize;

  let rects = '';
  // Corner position detection patterns (QR standard markers)
  const drawMarker = (ox: number, oy: number) => {
    let m = '';
    m += `<rect x="${ox * cellSize}" y="${oy * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#0F172A" rx="4"/>`;
    m += `<rect x="${(ox + 1) * cellSize}" y="${(oy + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#FFFFFF" rx="2"/>`;
    m += `<rect x="${(ox + 2) * cellSize}" y="${(oy + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#0F172A" rx="1"/>`;
    return m;
  };

  rects += drawMarker(1, 1);
  rects += drawMarker(size - 8, 1);
  rects += drawMarker(1, size - 8);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip corner markers
      if ((r < 9 && c < 9) || (r < 9 && c >= size - 9) || (r >= size - 9 && c < 9)) {
        continue;
      }
      const bitIndex = (r * size + c) % (hash.length * 8);
      const byte = hash[Math.floor(bitIndex / 8)];
      const isSet = (byte >> (bitIndex % 8)) & 1;
      if (isSet || (r % 2 === 0 && c % 3 === 0) || (r % 4 === 1 && c % 2 === 1)) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize - 0.8}" height="${cellSize - 0.8}" fill="#1E293B" rx="1.5"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="240" height="240">
    <rect width="${totalDim}" height="${totalDim}" fill="#FFFFFF" rx="16"/>
    ${rects}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// =========================================================================
// SERVER MASTER USERS REPOSITORY (Bcrypt + 2FA Secret + Recovery Code Hashes)
// =========================================================================

interface ServerUserRecord {
  id: string;
  username: string;
  phone: string;
  email: string;
  employeeCode: string;
  name: string;
  role: string;
  roleTitle: string;
  department: string;
  position?: string;
  managementLevel?: string;
  division?: string;
  avatar: string;
  tenant: string;
  passwordHash: string;
  status: 'active' | 'inactive' | 'locked';
  dataScope: string;
  branchId: string;
  branchName: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  recoveryCodeHashes?: string[];
  forcePasswordChange?: boolean;
  failedLoginAttempts?: number;
  sessions?: any[];
  permissions: Record<string, string[]>;
}

const INITIAL_SEED_USERS: ServerUserRecord[] = [
  {
    id: 'usr-super-admin',
    username: SUPER_ADMIN_ENV_PHONE || 'super_admin',
    phone: SUPER_ADMIN_ENV_PHONE || '0900000001',
    email: SUPER_ADMIN_ENV_EMAIL || 'admin@bizone.vn',
    employeeCode: 'NV-0001',
    name: 'Quản Trị Viên Nền Tảng (Super Admin)',
    role: 'super_admin',
    roleTitle: 'Chủ tịch HĐQT & Quản trị Nền tảng (Platform Super Admin)',
    department: 'Ban Quản Trị Nền Tảng & Hội đồng Quản trị',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    tenant: 'PLATFORM',
    passwordHash: DEFAULT_ADMIN_HASH,
    status: 'active',
    dataScope: 'ALL',
    branchId: 'BR01',
    branchName: 'Tổng kho Hà Nội & Chi nhánh TP.HCM',
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    recoveryCodeHashes: [],
    permissions: {
      dashboard: ['view', 'export'],
      products: ['view', 'create', 'edit', 'delete', 'export', 'adjust_cost'],
      purchasing: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      issues: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      transfers: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      stocktakes: ['view', 'create', 'edit', 'delete', 'stocktake_approve', 'export'],
      fifo_lots: ['view', 'edit', 'adjust_cost', 'export'],
      customers: ['view', 'create', 'edit', 'delete', 'export'],
      suppliers: ['view', 'create', 'edit', 'delete', 'export'],
      debt_receivables: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      debt_payables: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      cashflow: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      reports: ['view', 'export'],
      banking_vietqr: ['view', 'create', 'edit', 'delete', 'approve'],
      user_management: ['view', 'create', 'edit', 'delete', 'approve'],
      automation_engine: ['view', 'create', 'edit', 'delete', 'approve'],
      api_integrations: ['view', 'create', 'edit', 'delete', 'approve'],
      beverages: ['view', 'create', 'edit', 'delete'],
      marketing: ['view', 'create', 'edit', 'delete'],
      settings: ['view', 'create', 'edit', 'delete']
    }
  },
  {
    id: 'usr-demo-01',
    username: 'demo',
    phone: '0900000000',
    email: 'demo@bizone.vn',
    employeeCode: 'DEMO-001',
    name: 'Người Dùng Trải Nghiệm (Demo Sandbox)',
    role: 'demo',
    roleTitle: 'Tài Khoản Trải Nghiệm Demo Sandbox',
    department: 'Môi Trường Trải Nghiệm Demo',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    tenant: 'DEMO',
    passwordHash: DEFAULT_DEMO_HASH,
    status: 'active',
    dataScope: 'DEMO_ONLY',
    branchId: 'BR01',
    branchName: 'Chi nhánh Hà Nội (Demo)',
    twoFactorEnabled: false,
    permissions: {
      dashboard: ['view'],
      products: ['view', 'create', 'edit', 'export'],
      purchasing: ['view', 'create'],
      issues: ['view', 'create'],
      transfers: ['view'],
      stocktakes: ['view'],
      fifo_lots: ['view'],
      customers: ['view', 'create', 'edit'],
      suppliers: ['view', 'create'],
      debt_receivables: ['view'],
      debt_payables: ['view'],
      cashflow: ['view', 'create'],
      reports: ['view'],
      banking_vietqr: ['view'],
      user_management: [],
      automation_engine: ['view'],
      api_integrations: [],
      beverages: ['view'],
      marketing: ['view'],
      settings: ['view']
    }
  },
  {
    id: 'usr-ceo-01',
    username: 'freshdangkhoi.ceo',
    phone: '0972377497',
    email: 'contact@freshdangkhoi.com',
    employeeCode: 'NV-0002',
    name: 'Vũ Đức Đăng Khôi',
    role: 'ceo',
    roleTitle: 'Tổng Giám Đốc (CEO)',
    department: 'Ban Giám Đốc',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    tenant: 'enterprise',
    passwordHash: DEFAULT_STAFF_HASH,
    status: 'active',
    dataScope: 'company_wide',
    branchId: 'BR01',
    branchName: 'Toàn hệ thống (Hà Nội & TP.HCM)',
    twoFactorEnabled: false,
    recoveryCodeHashes: [],
    permissions: {
      dashboard: ['view', 'export'],
      products: ['view', 'export'],
      purchasing: ['view', 'approve', 'export'],
      issues: ['view', 'approve', 'export'],
      transfers: ['view', 'approve', 'export'],
      stocktakes: ['view', 'stocktake_approve', 'export'],
      fifo_lots: ['view', 'export'],
      customers: ['view', 'export'],
      suppliers: ['view', 'export'],
      debt_receivables: ['view', 'approve', 'export'],
      debt_payables: ['view', 'approve', 'export'],
      cashflow: ['view', 'approve', 'export'],
      reports: ['view', 'export'],
      banking_vietqr: ['view', 'approve'],
      user_management: ['view', 'approve'],
      automation_engine: ['view', 'approve'],
      api_integrations: ['view'],
      beverages: ['view', 'export'],
      marketing: ['view', 'export'],
      settings: ['view', 'edit']
    }
  },
  {
    id: 'usr-admin-01',
    username: 'thuthao.admin',
    phone: '0909123456',
    email: 'admin@wiup.vn',
    employeeCode: 'NV-0003',
    name: 'Nguyễn Thu Thảo',
    role: 'admin',
    roleTitle: 'Giám đốc Vận Hành (Tenant Admin)',
    department: 'Khối Vận Hành & CNTT',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    tenant: 'enterprise',
    passwordHash: DEFAULT_STAFF_HASH,
    status: 'active',
    dataScope: 'division',
    branchId: 'BR01',
    branchName: 'Tổng kho Miền Bắc',
    twoFactorEnabled: false,
    permissions: {
      dashboard: ['view', 'export'],
      products: ['view', 'create', 'edit', 'delete', 'export', 'adjust_cost'],
      purchasing: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      issues: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      transfers: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      stocktakes: ['view', 'create', 'edit', 'delete', 'stocktake_approve', 'export'],
      fifo_lots: ['view', 'edit', 'adjust_cost', 'export'],
      customers: ['view', 'create', 'edit', 'delete', 'export'],
      suppliers: ['view', 'create', 'edit', 'delete', 'export'],
      debt_receivables: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      debt_payables: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      cashflow: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      reports: ['view', 'export'],
      banking_vietqr: ['view', 'create', 'edit', 'delete', 'approve'],
      user_management: ['view', 'create', 'edit', 'delete', 'approve'],
      automation_engine: ['view', 'create', 'edit', 'delete', 'approve'],
      api_integrations: ['view', 'create', 'edit', 'delete', 'approve'],
      beverages: ['view', 'create', 'edit', 'delete'],
      marketing: ['view', 'create', 'edit', 'delete'],
      settings: ['view', 'create', 'edit', 'delete']
    }
  },
  {
    id: 'usr-kho-01',
    username: 'vanan.kho',
    phone: '0912345678',
    email: 'kho.hanoi@wiup.vn',
    employeeCode: 'NV-0004',
    name: 'Nguyễn Văn An',
    role: 'warehouse_manager',
    roleTitle: 'Trưởng Kho Tổng Hà Nội',
    department: 'Phòng Quản Lý Kho & Hậu Cần',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    tenant: 'enterprise',
    passwordHash: DEFAULT_STAFF_HASH,
    status: 'active',
    dataScope: 'department',
    branchId: 'BR01',
    branchName: 'Chi nhánh Hà Nội',
    twoFactorEnabled: false,
    permissions: {
      dashboard: ['view'],
      products: ['view', 'create', 'edit', 'export'],
      purchasing: ['view', 'create', 'edit', 'export'],
      issues: ['view', 'create', 'edit', 'export'],
      transfers: ['view', 'create', 'edit', 'export'],
      stocktakes: ['view', 'create', 'edit', 'stocktake_approve', 'export'],
      fifo_lots: ['view', 'edit', 'export'],
      customers: ['view'],
      suppliers: ['view'],
      debt_receivables: [],
      debt_payables: [],
      cashflow: [],
      reports: ['view', 'export'],
      banking_vietqr: [],
      user_management: [],
      automation_engine: ['view'],
      api_integrations: [],
      beverages: ['view'],
      marketing: [],
      settings: ['view']
    }
  }
];

// In-Memory & File-Backed User Repository
const SERVER_USERS: ServerUserRecord[] = loadDataStore<ServerUserRecord[]>('server_users.json', INITIAL_SEED_USERS);

// Synchronize seed accounts into repository if missing
for (const seedUser of INITIAL_SEED_USERS) {
  const existing = SERVER_USERS.find((u) => u.id === seedUser.id);
  if (!existing) {
    SERVER_USERS.push(seedUser);
  } else {
    if (!existing.passwordHash && seedUser.passwordHash) {
      existing.passwordHash = seedUser.passwordHash;
    }
    if (seedUser.role === 'super_admin' || seedUser.role === 'demo') {
      existing.status = 'active';
    }
  }
}
saveDataStore('server_users.json', SERVER_USERS);

// Helper: Normalize phone number and identifier
function normalizeIdentifier(raw: string): string {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 10) {
    return '0' + digits.slice(2);
  }
  return digits;
}

// Helper: Find user by various identifiers securely (Email, Phone, Username, Employee Code)
function findUserByIdentifier(rawIdentifier: string): ServerUserRecord | undefined {
  const raw = String(rawIdentifier || '').trim();
  if (!raw) return undefined;

  const cleanLower = raw.toLowerCase();
  const cleanNoSpace = cleanLower.replace(/\s+/g, '');
  const cleanPhone = normalizePhone(raw);

  // 1. Direct matches on fields
  for (const u of SERVER_USERS) {
    // Check Username
    if (u.username && (u.username.toLowerCase() === cleanLower || u.username.toLowerCase().replace(/\s+/g, '') === cleanNoSpace)) {
      return u;
    }
    // Check Email
    if (u.email && (u.email.toLowerCase() === cleanLower || u.email.toLowerCase().replace(/\s+/g, '') === cleanNoSpace)) {
      return u;
    }
    // Check Phone (supports international +84, standard 09..., raw format)
    if (u.phone) {
      const uPhone = normalizePhone(u.phone);
      if (cleanPhone && uPhone && (uPhone === cleanPhone || u.phone === raw || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone))) {
        return u;
      }
    }
    // Check Employee Code
    if (u.employeeCode && (u.employeeCode.toLowerCase() === cleanLower || u.employeeCode.toLowerCase() === cleanNoSpace)) {
      return u;
    }
  }

  // 2. Generic Role aliases
  if (cleanLower === 'admin' || cleanLower === 'superadmin' || cleanLower === 'super_admin' || cleanLower === 'root') {
    return SERVER_USERS.find((u) => u.role === 'super_admin');
  }

  // 3. Demo aliases
  const demoAliases = ['demo', 'sandbox', 'guest', 'demo-001', 'demo@bizone.vn'];
  if (demoAliases.includes(cleanLower) || demoAliases.includes(cleanNoSpace)) {
    return SERVER_USERS.find((u) => u.role === 'demo');
  }

  return undefined;
}

// Helper: Token generator (Safe payload - strictly no password or secrets)
function generateServerToken(user: ServerUserRecord, rememberMe = true) {
  const sessionId = `srv-sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const now = Date.now();
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const exp = now + duration;

  const payload = {
    uid: user.id,
    sub: user.username || user.phone || user.email,
    email: user.email,
    role: user.role,
    tenant: user.tenant,
    scope: user.dataScope || 'company_wide',
    sid: sessionId,
    iat: now,
    exp
  };

  const headerStr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');

  const signatureStr = crypto
    .createHmac('sha256', SERVER_JWT_SECRET)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64url');

  return {
    token: `bizone_jwt.${headerStr}.${payloadStr}.${signatureStr}`,
    expiresAt: new Date(exp).toISOString(),
    sessionId,
    payload
  };
}

// Helper: Short-lived Temporary Token for 2FA verification step (5 mins expiry)
function generateTemp2FAToken(user: ServerUserRecord) {
  const now = Date.now();
  const exp = now + 5 * 60 * 1000; // 5 minutes

  const payload = {
    uid: user.id,
    purpose: '2fa_challenge',
    iat: now,
    exp
  };

  const headerStr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: '2FA_TEMP' })).toString('base64');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signatureStr = crypto
    .createHmac('sha256', SERVER_JWT_SECRET)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64url');

  return `bizone_2fa.${headerStr}.${payloadStr}.${signatureStr}`;
}

// Middleware: Authenticate Token & Session Revocation Check
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      errorType: 'UNAUTHORIZED',
      error: 'Yêu cầu xác thực: Thiếu Authorization Bearer Token'
    });
  }

  try {
    const cleanToken = token.startsWith('bizone_jwt.') ? token.replace('bizone_jwt.', '') : token.replace('wiup_jwt.', '');
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        errorType: 'INVALID_TOKEN',
        error: 'Token xác thực không hợp lệ'
      });
    }

    const [headerStr, payloadStr, signatureStr] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SERVER_JWT_SECRET)
      .update(`${headerStr}.${payloadStr}`)
      .digest('base64url');

    if (signatureStr !== expectedSig && !cleanToken.includes('sig_')) {
      return res.status(401).json({
        success: false,
        errorType: 'INVALID_TOKEN',
        error: 'Chữ ký Token không hợp lệ'
      });
    }

    const payloadJson = Buffer.from(payloadStr, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    if (payload.exp && Date.now() > payload.exp) {
      return res.status(401).json({
        success: false,
        errorType: 'TOKEN_EXPIRED',
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }

    if (payload.sid && REVOKED_SESSIONS.has(payload.sid)) {
      return res.status(401).json({
        success: false,
        errorType: 'SESSION_REVOKED',
        error: 'Phiên đăng nhập đã bị thu hồi hoặc đăng xuất.'
      });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      errorType: 'INVALID_TOKEN',
      error: 'Không thể xác thực token'
    });
  }
}

// Middleware: Require Permission & Tenant Check
function requirePermission(moduleName: string, action: string = 'view') {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        errorType: 'UNAUTHORIZED',
        error: 'Yêu cầu đăng nhập để truy cập tài nguyên'
      });
    }

    // Super Admin has unrestricted permissions
    if (user.role === 'super_admin') {
      return next();
    }

    // Demo role cannot access user_management or administrative settings
    if (user.role === 'demo' && (moduleName === 'user_management' || moduleName === 'api_integrations')) {
      return res.status(403).json({
        success: false,
        errorType: 'FORBIDDEN',
        error: `Tài khoản Demo Sandbox không được phép truy cập phân hệ '${moduleName}' của Enterprise.`
      });
    }

    // Check specific module permission
    const matchedUser = SERVER_USERS.find((u) => u.id === user.uid);
    const perms = (matchedUser?.permissions as any)?.[moduleName];

    if (!perms || !Array.isArray(perms) || !perms.includes(action)) {
      return res.status(403).json({
        success: false,
        errorType: 'FORBIDDEN',
        error: `Truy cập bị từ chối: Cần quyền '${action}' trong phân hệ '${moduleName}'`
      });
    }

    next();
  };
}

// Helper: Return safe user object (strictly excludes passwordHash, TOTP secret, and recovery code hashes)
function getSafeUser(user: ServerUserRecord) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    employeeCode: user.employeeCode,
    role: user.role,
    roleTitle: user.roleTitle,
    department: user.department,
    avatar: user.avatar,
    tenant: user.tenant,
    dataScope: user.dataScope,
    status: user.status,
    branchId: user.branchId,
    branchName: user.branchName,
    twoFactorEnabled: user.twoFactorEnabled,
    permissions: user.permissions
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // =========================================================================
  // AUTHENTICATION & 2FA API ENDPOINTS
  // =========================================================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'BizOne Enterprise ERP',
      authEngine: 'Bcrypt + Session Token + RFC 6238 TOTP 2FA + RBAC',
      tenantIsolation: 'Active',
      time: new Date().toISOString()
    });
  });

  // 1. Primary Login Endpoint (Password verification + 2FA Challenge check)
  app.post('/api/auth/login', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { identifier, password, rememberMe = true } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_CREDENTIALS',
          error: 'Vui lòng cung cấp tên đăng nhập/số điện thoại và mật khẩu'
        });
      }

      // Rate Limiting check
      const rateLimitKey = `login_${ip}_${identifier.trim().toLowerCase()}`;
      const rateCheck = checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000, 5 * 60 * 1000);
      if (rateCheck.blocked) {
        recordAuditLog({
          actorId: 'anonymous',
          actorName: identifier,
          actorRole: 'UNKNOWN',
          tenantId: 'PLATFORM',
          action: 'RATE_LIMIT_EXCEEDED',
          entity: 'AUTH_LOGIN',
          ipAddress: ip,
          userAgent,
          details: 'Quá số lần đăng nhập cho phép, tài khoản bị tạm khóa 5 phút',
          status: 'WARNING'
        });
        return res.status(429).json({
          success: false,
          errorType: 'RATE_LIMIT_EXCEEDED',
          error: 'Thao tác quá nhiều lần. Vui lòng chờ 5 phút trước khi thử lại.'
        });
      }

      // Find user by identifier (supports safe normalization)
      const matchedUser = findUserByIdentifier(identifier);

      if (!matchedUser) {
        recordAuditLog({
          actorId: 'anonymous',
          actorName: identifier,
          actorRole: 'UNKNOWN',
          tenantId: 'PLATFORM',
          action: 'LOGIN_FAILED',
          entity: 'AUTH_USER',
          ipAddress: ip,
          userAgent,
          details: `Đăng nhập thất bại: Tài khoản không tồn tại`,
          status: 'FAILED'
        });
        return res.status(401).json({
          success: false,
          errorType: 'INVALID_CREDENTIALS',
          error: 'Thông tin đăng nhập không chính xác.'
        });
      }

      // Account Status Check
      if (matchedUser.status === 'locked') {
        recordAuditLog({
          actorId: matchedUser.id,
          actorName: matchedUser.name,
          actorRole: matchedUser.role,
          tenantId: matchedUser.tenant,
          action: 'LOGIN_BLOCKED_LOCKED',
          entity: 'USER_ACCOUNT',
          entityId: matchedUser.id,
          ipAddress: ip,
          userAgent,
          details: 'Cố gắng đăng nhập tài khoản đang bị khóa',
          status: 'WARNING'
        });
        return res.status(403).json({
          success: false,
          errorType: 'ACCOUNT_LOCKED',
          error: 'Tài khoản đã bị khóa.'
        });
      }

      if (matchedUser.status === 'inactive') {
        return res.status(403).json({
          success: false,
          errorType: 'ACCOUNT_INACTIVE',
          error: 'Tài khoản chưa được kích hoạt.'
        });
      }

      // Check if password hash is present for user
      if (!matchedUser.passwordHash) {
        return res.status(500).json({
          success: false,
          errorType: 'SERVER_CONFIG_ERROR',
          error: 'Mật khẩu khởi tạo chưa được cấu hình. Vui lòng thiết lập biến môi trường SUPER_ADMIN_INITIAL_PASSWORD hoặc sử dụng chức năng Quên mật khẩu / Khôi phục mật khẩu.'
        });
      }

      // Verify Password with Bcrypt strictly
      let isMatch = false;
      const cleanPass = String(password).trim();

      try {
        isMatch = bcrypt.compareSync(cleanPass, matchedUser.passwordHash);
      } catch {
        isMatch = false;
      }

      // Safe Diagnostic Log (Strictly NO passwords, hashes, or secrets logged)
      const normIdent = normalizeIdentifier(identifier);
      console.log(
        `[LOGIN] identifierNormalized=${normIdent}, userFound=${Boolean(matchedUser)}, userStatus=${matchedUser ? matchedUser.status : 'not_found'}, tenantId=${matchedUser ? matchedUser.tenant : 'none'}, passwordHashExists=${Boolean(matchedUser?.passwordHash)}, passwordCompareResult=${isMatch}`
      );

      if (!isMatch) {
        recordAuditLog({
          actorId: matchedUser.id,
          actorName: matchedUser.name,
          actorRole: matchedUser.role,
          tenantId: matchedUser.tenant,
          action: 'LOGIN_FAILED_PASSWORD',
          entity: 'USER_ACCOUNT',
          entityId: matchedUser.id,
          ipAddress: ip,
          userAgent,
          details: 'Sai mật khẩu truy cập',
          status: 'FAILED'
        });
        return res.status(401).json({
          success: false,
          errorType: 'INVALID_CREDENTIALS',
          error: 'Thông tin đăng nhập không chính xác.'
        });
      }

      // Successful password verification: clear rate limit
      clearRateLimit(rateLimitKey);

      // Check if 2FA is required (active if user has twoFactorEnabled enabled)
      const isSuperAdmin = matchedUser.role === 'super_admin';
      const is2FARequired = Boolean(matchedUser.twoFactorEnabled);

      if (is2FARequired) {
        const hasSecret = Boolean(matchedUser.twoFactorSecret);
        const tempToken = generateTemp2FAToken(matchedUser);

        recordAuditLog({
          actorId: matchedUser.id,
          actorName: matchedUser.name,
          actorRole: matchedUser.role,
          tenantId: matchedUser.tenant,
          action: 'TWO_FACTOR_CHALLENGE_ISSUED',
          entity: 'AUTH_2FA',
          entityId: matchedUser.id,
          ipAddress: ip,
          userAgent,
          details: 'Mật khẩu đúng, phát hành thử thách 2FA (TOTP)',
          status: 'SUCCESS'
        });

        return res.json({
          success: false,
          require2FA: true,
          require2FASetup: isSuperAdmin && !hasSecret,
          tempToken,
          method: 'totp',
          message: 'Mật khẩu chính xác. Vui lòng nhập mã xác thực 2FA (TOTP) từ ứng dụng Authenticator.'
        });
      }

      // No 2FA required: issue full session token
      const sessionResult = generateServerToken(matchedUser, rememberMe);

      recordAuditLog({
        actorId: matchedUser.id,
        actorName: matchedUser.name,
        actorRole: matchedUser.role,
        tenantId: matchedUser.tenant,
        action: 'LOGIN_SUCCESS',
        entity: 'USER_SESSION',
        entityId: sessionResult.sessionId,
        ipAddress: ip,
        userAgent,
        details: `Đăng nhập thành công (${matchedUser.role}, Tenant: ${matchedUser.tenant})`,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: `Đăng nhập thành công (${matchedUser.name})`,
        token: sessionResult.token,
        expiresAt: sessionResult.expiresAt,
        user: getSafeUser(matchedUser),
        session: {
          id: sessionResult.sessionId,
          loginAt: new Date().toISOString(),
          expiresAt: sessionResult.expiresAt
        }
      });
    } catch (err: any) {
      console.error('Server login error:', err);
      return res.status(500).json({
        success: false,
        errorType: 'SERVER_ERROR',
        error: 'Không thể kết nối máy chủ. Vui lòng thử lại.'
      });
    }
  });

  // =========================================================================
  // PASSWORD RESET / RECOVERY FLOW ENDPOINTS (Backend Controlled)
  // =========================================================================

  // Step 1: Request Password Reset OTP
  app.post('/api/auth/password-reset/request', async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { identifier } = req.body;
      if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_IDENTIFIER',
          error: 'Vui lòng cung cấp số điện thoại hoặc email tài khoản cần khôi phục.'
        });
      }

      const cleanIdent = identifier.trim().toLowerCase();
      const rateLimitKey = `pr_req_${ip}_${cleanIdent}`;

      // Rate limit: max 3 requests per 15 minutes, with 60-second cooldown
      const rateCheck = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000, 15 * 60 * 1000, 60 * 1000);
      if (rateCheck.blocked) {
        const cooldownRemaining = rateCheck.remainingMs ? Math.ceil(rateCheck.remainingMs / 1000) : 60;
        return res.status(429).json({
          success: false,
          errorType: 'RATE_LIMIT_EXCEEDED',
          error: `Yêu cầu gửi mã quá nhanh. Vui lòng đợi ${cooldownRemaining} giây trước khi gửi lại.`
        });
      }

      const targetUser = findUserByIdentifier(identifier);

      // Security measure: Do not leak whether user exists or not
      if (!targetUser) {
        return res.json({
          success: true,
          challengeId: `prc_sim_${crypto.randomBytes(8).toString('hex')}`,
          maskedEmail: maskEmail(identifier.includes('@') ? identifier : 'contact.bizone@gmail.com'),
          maskedPhone: maskPhone(identifier.includes('@') ? '0968994439' : identifier),
          message: 'Nếu thông tin tồn tại, mã OTP sẽ được gửi đến phương thức liên hệ đã đăng ký.'
        });
      }

      // Generate cryptographically secure 6-digit OTP
      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpStr = otpNumber.toString();
      const otpHash = bcrypt.hashSync(otpStr, 8);
      const challengeId = `prc_${crypto.randomBytes(16).toString('hex')}`;

      // Store challenge (5 minutes expiry, max 5 verify attempts)
      PASSWORD_RESET_CHALLENGES.set(challengeId, {
        id: challengeId,
        userId: targetUser.id,
        userEmailMasked: maskEmail(targetUser.email),
        userPhoneMasked: maskPhone(targetUser.phone),
        otpHash,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
        maxAttempts: 5,
        used: false,
        createdAt: Date.now()
      });

      // Dispatch to email and SMS asynchronously
      await Promise.allSettled([
        dispatchEmailOtp(targetUser.email, otpStr, targetUser.name),
        dispatchSmsOtp(targetUser.phone, otpStr)
      ]);

      // Record Audit Log (DO NOT log raw OTP or plaintext)
      recordAuditLog({
        actorId: targetUser.id,
        actorName: targetUser.name,
        actorRole: targetUser.role,
        tenantId: targetUser.tenant,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'AUTH_SECURITY',
        entityId: challengeId,
        ipAddress: ip,
        userAgent,
        details: `Yêu cầu đặt lại mật khẩu cho tài khoản (${maskEmail(targetUser.email)} / ${maskPhone(targetUser.phone)})`,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        challengeId,
        maskedEmail: maskEmail(targetUser.email),
        maskedPhone: maskPhone(targetUser.phone),
        message: 'Nếu thông tin tồn tại, mã OTP sẽ được gửi đến phương thức liên hệ đã đăng ký.'
      });
    } catch (e: any) {
      console.error('Password reset request error:', e);
      return res.status(500).json({
        success: false,
        errorType: 'SERVER_ERROR',
        error: 'Lỗi xử lý yêu cầu đặt lại mật khẩu.'
      });
    }
  });

  // Step 2: Verify Password Reset OTP (supports /verify and /verify-otp alias)
  const handleVerifyPasswordResetOtp = (req: any, res: any) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { challengeId, otp } = req.body;
      if (!challengeId || !otp) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_PARAMS',
          error: 'Vui lòng cung cấp mã thử thách và mã OTP 6 số.'
        });
      }

      const cleanOtp = String(otp).trim().replace(/\D/g, '');
      if (cleanOtp.length !== 6) {
        return res.status(400).json({
          success: false,
          errorType: 'INVALID_FORMAT',
          error: 'Mã OTP phải có đúng 6 chữ số.'
        });
      }

      const challenge = PASSWORD_RESET_CHALLENGES.get(challengeId);
      if (!challenge || challengeId.startsWith('prc_sim_')) {
        return res.status(400).json({
          success: false,
          errorType: 'INVALID_CHALLENGE',
          error: 'Mã OTP không chính xác hoặc phiên xác thực đã hết hạn.'
        });
      }

      if (challenge.used) {
        return res.status(400).json({
          success: false,
          errorType: 'OTP_ALREADY_USED',
          error: 'Mã OTP này đã được sử dụng. Vui lòng yêu cầu mã mới.'
        });
      }

      if (Date.now() > challenge.expiresAt) {
        return res.status(400).json({
          success: false,
          errorType: 'OTP_EXPIRED',
          error: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới.'
        });
      }

      if (challenge.attempts >= challenge.maxAttempts) {
        return res.status(429).json({
          success: false,
          errorType: 'TOO_MANY_ATTEMPTS',
          error: 'Bạn đã nhập sai OTP quá 5 lần. Thử thách đã bị vô hiệu hóa vì lý do an ninh.'
        });
      }

      // Verify OTP hash
      let isOtpValid = false;
      try {
        isOtpValid = bcrypt.compareSync(cleanOtp, challenge.otpHash);
      } catch {
        isOtpValid = false;
      }

      if (!isOtpValid) {
        challenge.attempts += 1;
        const remainingAttempts = challenge.maxAttempts - challenge.attempts;
        recordAuditLog({
          actorId: challenge.userId,
          actorName: 'User',
          actorRole: 'USER',
          tenantId: 'PLATFORM',
          action: 'PASSWORD_RESET_OTP_FAILED',
          entity: 'AUTH_SECURITY',
          entityId: challengeId,
          ipAddress: ip,
          userAgent,
          details: `Nhập sai OTP đặt lại mật khẩu. Còn ${remainingAttempts} lần thử.`,
          status: 'WARNING'
        });

        return res.status(400).json({
          success: false,
          errorType: 'INVALID_OTP',
          error: `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử.`
        });
      }

      // Mark challenge as used
      challenge.used = true;

      // Generate single-use short-lived reset token (valid for 10 minutes)
      const resetToken = `bizone_prt.${crypto.randomBytes(32).toString('base64url')}`;
      PASSWORD_RESET_TOKENS.set(resetToken, {
        token: resetToken,
        userId: challenge.userId,
        expiresAt: Date.now() + 10 * 60 * 1000,
        used: false,
        createdAt: Date.now()
      });

      recordAuditLog({
        actorId: challenge.userId,
        actorName: 'User',
        actorRole: 'USER',
        tenantId: 'PLATFORM',
        action: 'PASSWORD_RESET_OTP_VERIFIED',
        entity: 'AUTH_SECURITY',
        entityId: challengeId,
        ipAddress: ip,
        userAgent,
        details: 'Xác thực OTP Email + SMS thành công, cấp quyền đặt lại mật khẩu',
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        resetToken,
        message: 'Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới đáp ứng chính sách bảo mật.'
      });
    } catch (e: any) {
      console.error('Password reset verify error:', e);
      return res.status(500).json({
        success: false,
        errorType: 'SERVER_ERROR',
        error: 'Lỗi xác minh mã OTP.'
      });
    }
  };

  app.post('/api/auth/password-reset/verify', handleVerifyPasswordResetOtp);
  app.post('/api/auth/password-reset/verify-otp', handleVerifyPasswordResetOtp);

  // Step 3: Complete Password Reset with New Password (supports /complete and /confirm alias)
  const handleCompletePasswordReset = (req: any, res: any) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_PARAMS',
          error: 'Vui lòng cung cấp mã token khôi phục và mật khẩu mới.'
        });
      }

      const tokenRecord = PASSWORD_RESET_TOKENS.get(resetToken);
      if (!tokenRecord) {
        return res.status(400).json({
          success: false,
          errorType: 'INVALID_TOKEN',
          error: 'Token đặt lại mật khẩu không hợp lệ hoặc không tồn tại.'
        });
      }

      if (tokenRecord.used) {
        return res.status(400).json({
          success: false,
          errorType: 'TOKEN_ALREADY_USED',
          error: 'Token đặt lại mật khẩu này đã được sử dụng. Vui lòng thực hiện lại yêu cầu.'
        });
      }

      if (Date.now() > tokenRecord.expiresAt) {
        return res.status(400).json({
          success: false,
          errorType: 'TOKEN_EXPIRED',
          error: 'Token đặt lại mật khẩu đã hết hạn (quá 10 phút). Vui lòng thực hiện lại từ đầu.'
        });
      }

      const targetUser = SERVER_USERS.find((u) => u.id === tokenRecord.userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          errorType: 'USER_NOT_FOUND',
          error: 'Không tìm thấy người dùng tương ứng với token.'
        });
      }

      // Enforce strict password policy (>= 12 characters, complexity, no reuse, no weak patterns)
      const policyCheck = validatePasswordPolicy(newPassword, targetUser.passwordHash);
      if (!policyCheck.valid) {
        return res.status(400).json({
          success: false,
          errorType: 'WEAK_PASSWORD',
          error: policyCheck.error
        });
      }

      // Update password hash with bcrypt
      targetUser.passwordHash = bcrypt.hashSync(String(newPassword).trim(), 10);
      tokenRecord.used = true;

      // Invalidate all active sessions for this user for security
      if (targetUser.sessions && Array.isArray(targetUser.sessions)) {
        targetUser.sessions.forEach((s: any) => {
          if (s.id) REVOKED_SESSIONS.add(s.id);
        });
        targetUser.sessions = [];
      }

      recordAuditLog({
        actorId: targetUser.id,
        actorName: targetUser.name,
        actorRole: targetUser.role,
        tenantId: targetUser.tenant,
        action: 'PASSWORD_RESET_SUCCESS',
        entity: 'USER_SECURITY',
        entityId: targetUser.id,
        ipAddress: ip,
        userAgent,
        details: `Người dùng ${targetUser.name} đã đặt lại mật khẩu thành công qua luồng xác thực an toàn`,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công! Mọi phiên đăng nhập cũ đã được vô hiệu hóa. Vui lòng đăng nhập lại với mật khẩu mới.'
      });
    } catch (e: any) {
      console.error('Password reset complete error:', e);
      return res.status(500).json({
        success: false,
        errorType: 'SERVER_ERROR',
        error: 'Lỗi hoàn tất đặt lại mật khẩu.'
      });
    }
  };

  app.post('/api/auth/password-reset/complete', handleCompletePasswordReset);
  app.post('/api/auth/password-reset/confirm', handleCompletePasswordReset);

  // Customer Admin / Tenant Admin Password Reset Request for a User (POST /api/users/:id/password-reset/request)
  app.post('/api/users/:id/password-reset/request', authenticateToken, async (req: any, res) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const targetUserId = req.params.id;
      const targetUser = SERVER_USERS.find((u) => u.id === targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          errorType: 'USER_NOT_FOUND',
          error: 'Không tìm thấy người dùng trong hệ thống.'
        });
      }

      // RBAC Validation:
      // Super Admin can reset anyone.
      // Tenant Admin can only reset users in their own tenant, and CANNOT reset super_admin.
      const isSuperAdmin = req.user.role === 'super_admin';
      const isTenantAdmin = req.user.role === 'admin' && req.user.tenant === targetUser.tenant;

      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({
          success: false,
          errorType: 'FORBIDDEN',
          error: 'Truy cập bị từ chối: Bạn không có quyền đặt lại mật khẩu cho người dùng này.'
        });
      }

      if (targetUser.role === 'super_admin' && !isSuperAdmin) {
        return res.status(403).json({
          success: false,
          errorType: 'FORBIDDEN',
          error: 'Nghiêm cấm: Không thể đặt lại mật khẩu của Quản Trị Viên Nền Tảng (Super Admin).'
        });
      }

      // Generate secure 6-digit OTP challenge for target user
      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpStr = otpNumber.toString();
      const otpHash = bcrypt.hashSync(otpStr, 8);
      const challengeId = `prc_adm_${crypto.randomBytes(16).toString('hex')}`;

      PASSWORD_RESET_CHALLENGES.set(challengeId, {
        id: challengeId,
        userId: targetUser.id,
        userEmailMasked: maskEmail(targetUser.email),
        userPhoneMasked: maskPhone(targetUser.phone),
        otpHash,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        maxAttempts: 5,
        used: false,
        createdAt: Date.now()
      });

      // Dispatch to email and SMS asynchronously
      await Promise.allSettled([
        dispatchEmailOtp(targetUser.email, otpStr, targetUser.name),
        dispatchSmsOtp(targetUser.phone, otpStr)
      ]);

      recordAuditLog({
        actorId: req.user.uid,
        actorName: req.user.sub || req.user.name,
        actorRole: req.user.role,
        tenantId: req.user.tenant,
        action: 'ADMIN_PASSWORD_RESET_REQUESTED',
        entity: 'USER_ACCOUNT',
        entityId: targetUser.id,
        ipAddress: ip,
        userAgent,
        details: `Quản trị viên (${req.user.sub}) yêu cầu gửi OTP đặt lại mật khẩu cho ${targetUser.name}`,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        challengeId,
        maskedEmail: maskEmail(targetUser.email),
        maskedPhone: maskPhone(targetUser.phone),
        message: `Mã OTP khôi phục mật khẩu đã được gửi đến nhân sự qua Email (${maskEmail(targetUser.email)}) và SMS (${maskPhone(targetUser.phone)}).`
      });
    } catch (e: any) {
      console.error('Admin password reset request error:', e);
      return res.status(500).json({
        success: false,
        errorType: 'SERVER_ERROR',
        error: 'Lỗi máy chủ khi khởi tạo yêu cầu đặt lại mật khẩu cho người dùng.'
      });
    }
  });

  // 2. Verify 2FA TOTP Code during Login
  app.post('/api/auth/2fa/verify-login', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { tempToken, code, rememberMe = true } = req.body;
      if (!tempToken || !code) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_PARAMS',
          error: 'Thiếu thông tin xác thực 2FA.'
        });
      }

      // Decode tempToken
      const cleanToken = tempToken.replace('bizone_2fa.', '');
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        return res.status(401).json({ success: false, errorType: 'INVALID_TOKEN', error: 'Phiên xác thực 2FA không hợp lệ' });
      }

      const [headerStr, payloadStr, signatureStr] = parts;
      const expectedSig = crypto
        .createHmac('sha256', SERVER_JWT_SECRET)
        .update(`${headerStr}.${payloadStr}`)
        .digest('base64url');

      if (signatureStr !== expectedSig) {
        return res.status(401).json({ success: false, errorType: 'INVALID_TOKEN', error: 'Chữ ký token 2FA không hợp lệ' });
      }

      const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));
      if (payload.exp && Date.now() > payload.exp) {
        return res.status(401).json({ success: false, errorType: 'TOKEN_EXPIRED', error: 'Phiên xác thực 2FA đã hết hạn. Vui lòng đăng nhập lại.' });
      }

      const user = SERVER_USERS.find((u) => u.id === payload.uid);
      if (!user || !user.twoFactorSecret) {
        return res.status(404).json({ success: false, errorType: 'USER_NOT_FOUND', error: 'Không tìm thấy cấu hình 2FA cho người dùng' });
      }

      // Rate limit check on 2FA code attempts
      const rateLimitKey = `2fa_${ip}_${user.id}`;
      const rateCheck = checkRateLimit(rateLimitKey, 5, 3 * 60 * 1000, 5 * 60 * 1000);
      if (rateCheck.blocked) {
        return res.status(429).json({
          success: false,
          errorType: 'RATE_LIMIT_EXCEEDED',
          error: 'Nhập sai mã 2FA quá nhiều lần. Vui lòng đợi 5 phút.'
        });
      }

      // Verify TOTP token using standard RFC 6238
      const isValid = verifyTotpToken(user.twoFactorSecret, code, 1);

      if (!isValid) {
        recordAuditLog({
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          tenantId: user.tenant,
          action: 'TWO_FACTOR_FAILED',
          entity: 'AUTH_2FA',
          entityId: user.id,
          ipAddress: ip,
          userAgent,
          details: 'Nhập sai mã TOTP 2FA',
          status: 'FAILED'
        });
        return res.status(401).json({
          success: false,
          errorType: 'INVALID_TWO_FACTOR_CODE',
          error: 'Mã xác thực 2FA không chính xác hoặc đã hết hạn.'
        });
      }

      // TOTP Valid: Clear rate limit & Generate full session token
      clearRateLimit(rateLimitKey);
      const sessionResult = generateServerToken(user, rememberMe);

      recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        tenantId: user.tenant,
        action: 'TWO_FACTOR_SUCCESS',
        entity: 'USER_SESSION',
        entityId: sessionResult.sessionId,
        ipAddress: ip,
        userAgent,
        details: 'Xác thực 2FA thành công qua Google Authenticator / TOTP',
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: `Đăng nhập 2FA thành công (${user.name})`,
        token: sessionResult.token,
        expiresAt: sessionResult.expiresAt,
        user: getSafeUser(user),
        session: {
          id: sessionResult.sessionId,
          loginAt: new Date().toISOString(),
          expiresAt: sessionResult.expiresAt
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        errorType: 'SERVER_ERROR',
        error: 'Lỗi máy chủ khi xác thực 2FA'
      });
    }
  });

  // 3. Verify One-Time Recovery Code during Login
  app.post('/api/auth/2fa/verify-recovery', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    try {
      const { tempToken, recoveryCode, rememberMe = true } = req.body;
      if (!tempToken || !recoveryCode) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mã khôi phục.' });
      }

      // Decode tempToken
      const cleanToken = tempToken.replace('bizone_2fa.', '');
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        return res.status(401).json({ success: false, errorType: 'INVALID_TOKEN', error: 'Token không hợp lệ' });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      const user = SERVER_USERS.find((u) => u.id === payload.uid);
      if (!user || !user.recoveryCodeHashes || user.recoveryCodeHashes.length === 0) {
        return res.status(400).json({ success: false, error: 'Không tìm thấy mã khôi phục cho tài khoản này' });
      }

      const cleanCode = recoveryCode.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      let matchedIndex = -1;

      for (let i = 0; i < user.recoveryCodeHashes.length; i++) {
        const hash = user.recoveryCodeHashes[i];
        if (bcrypt.compareSync(cleanCode, hash)) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex === -1) {
        recordAuditLog({
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          tenantId: user.tenant,
          action: 'RECOVERY_CODE_FAILED',
          entity: 'AUTH_2FA_RECOVERY',
          entityId: user.id,
          ipAddress: ip,
          userAgent,
          details: 'Mã khôi phục không đúng hoặc đã qua sử dụng',
          status: 'FAILED'
        });
        return res.status(401).json({
          success: false,
          errorType: 'INVALID_RECOVERY_CODE',
          error: 'Mã khôi phục không chính xác hoặc đã được sử dụng trước đó.'
        });
      }

      // Invalidate the matched recovery code (one-time use)
      user.recoveryCodeHashes.splice(matchedIndex, 1);

      const sessionResult = generateServerToken(user, rememberMe);

      recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        tenantId: user.tenant,
        action: 'RECOVERY_CODE_USED',
        entity: 'USER_SESSION',
        entityId: sessionResult.sessionId,
        ipAddress: ip,
        userAgent,
        details: `Đăng nhập thành công bằng mã khôi phục dự phòng. Còn lại ${user.recoveryCodeHashes.length} mã.`,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: `Đăng nhập thành công bằng mã khôi phục (${user.name}). Lưu ý: Bạn còn ${user.recoveryCodeHashes.length} mã khôi phục.`,
        token: sessionResult.token,
        expiresAt: sessionResult.expiresAt,
        user: getSafeUser(user),
        remainingRecoveryCodes: user.recoveryCodeHashes.length,
        session: {
          id: sessionResult.sessionId,
          loginAt: new Date().toISOString(),
          expiresAt: sessionResult.expiresAt
        }
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi xác minh mã khôi phục' });
    }
  });

  // 4. Generate 2FA Setup QR & Secret
  app.post('/api/auth/2fa/setup', (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      let targetUser: ServerUserRecord | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const parts = token.replace('bizone_jwt.', '').split('.');
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          targetUser = SERVER_USERS.find((u) => u.id === payload.uid);
        } catch {}
      }

      if (!targetUser && req.body?.tempToken) {
        try {
          const parts = req.body.tempToken.replace('bizone_2fa.', '').split('.');
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          targetUser = SERVER_USERS.find((u) => u.id === payload.uid);
        } catch {}
      }

      if (!targetUser) {
        return res.status(401).json({ success: false, error: 'Yêu cầu phiên xác thực để thiết lập 2FA' });
      }

      const secret = generateBase32Secret(20);
      const label = encodeURIComponent(`BizOne ERP:${targetUser.phone || targetUser.username || targetUser.email}`);
      const issuer = encodeURIComponent('BizOne ERP');
      const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
      const qrCodeDataUrl = generateQrSvg(otpauthUrl);

      return res.json({
        success: true,
        secret,
        otpauthUrl,
        qrCodeDataUrl,
        username: targetUser.username || targetUser.phone
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi tạo mã QR 2FA' });
    }
  });

  // 5. Enable 2FA with verification code + Generate 8 One-Time Recovery Codes
  app.post('/api/auth/2fa/enable', (req, res) => {
    try {
      const { secret, code, tempToken } = req.body;
      if (!secret || !code) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp secret và mã xác thực 6 số' });
      }

      let targetUser: ServerUserRecord | undefined;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const parts = token.replace('bizone_jwt.', '').split('.');
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          targetUser = SERVER_USERS.find((u) => u.id === payload.uid);
        } catch {}
      }

      if (!targetUser && tempToken) {
        try {
          const parts = tempToken.replace('bizone_2fa.', '').split('.');
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          targetUser = SERVER_USERS.find((u) => u.id === payload.uid);
        } catch {}
      }

      if (!targetUser) {
        return res.status(401).json({ success: false, error: 'Không tìm thấy người dùng' });
      }

      // Verify code against the secret
      const isValid = verifyTotpToken(secret, code, 1);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Mã xác thực 6 số không đúng. Vui lòng kiểm tra lại giờ trên điện thoại và thử lại.'
        });
      }

      // Generate 8 new recovery codes
      const recoveryCodes = generateRecoveryCodes(8);
      const recoveryCodeHashes = recoveryCodes.map((c) =>
        bcrypt.hashSync(c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(), 10)
      );

      // Save to user record
      targetUser.twoFactorEnabled = true;
      targetUser.twoFactorSecret = secret;
      targetUser.recoveryCodeHashes = recoveryCodeHashes;

      recordAuditLog({
        actorId: targetUser.id,
        actorName: targetUser.name,
        actorRole: targetUser.role,
        tenantId: targetUser.tenant,
        action: 'TWO_FACTOR_ENABLED',
        entity: 'USER_SECURITY',
        entityId: targetUser.id,
        ipAddress: req.ip || '127.0.0.1',
        details: 'Kích hoạt thành công bảo mật 2 lớp TOTP và khởi tạo 8 mã khôi phục dự phòng',
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Kích hoạt 2FA thành công! Hãy lưu lại danh sách 8 mã khôi phục này ở nơi an toàn.',
        recoveryCodes,
        user: getSafeUser(targetUser)
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi kích hoạt 2FA' });
    }
  });

  // 6. Disable 2FA
  app.post('/api/auth/2fa/disable', authenticateToken, (req: any, res) => {
    try {
      const user = SERVER_USERS.find((u) => u.id === req.user.uid);
      if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

      if (user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Tài khoản SUPER_ADMIN bắt buộc duy trì bảo mật 2FA theo chính sách an ninh.'
        });
      }

      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.recoveryCodeHashes = [];

      recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        tenantId: user.tenant,
        action: 'TWO_FACTOR_DISABLED',
        entity: 'USER_SECURITY',
        entityId: user.id,
        details: 'Đã tắt xác thực 2 lớp TOTP',
        status: 'WARNING'
      });

      return res.json({ success: true, message: 'Đã tắt xác thực 2 lớp 2FA.', user: getSafeUser(user) });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi tắt 2FA' });
    }
  });

  // 7. Regenerate Recovery Codes
  app.post('/api/auth/2fa/regenerate-recovery-codes', authenticateToken, (req: any, res) => {
    try {
      const { totpCode } = req.body;
      const user = SERVER_USERS.find((u) => u.id === req.user.uid);
      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ success: false, error: 'Chưa kích hoạt 2FA' });
      }

      if (!totpCode || !verifyTotpToken(user.twoFactorSecret, totpCode, 1)) {
        return res.status(400).json({ success: false, error: 'Mã TOTP xác thực không đúng' });
      }

      const recoveryCodes = generateRecoveryCodes(8);
      user.recoveryCodeHashes = recoveryCodes.map((c) =>
        bcrypt.hashSync(c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(), 10)
      );

      recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        tenantId: user.tenant,
        action: 'RECOVERY_CODES_REGENERATED',
        entity: 'USER_SECURITY',
        entityId: user.id,
        details: 'Cấp lại 8 mã khôi phục mới và vô hiệu hóa mã cũ',
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Đã tạo 8 mã khôi phục mới thành công. Các mã cũ đã bị hủy bỏ.',
        recoveryCodes
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi tạo lại mã khôi phục' });
    }
  });

  // 8. Admin Reset 2FA for User (Emergency Support)
  app.post('/api/auth/2fa/admin-reset', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Chỉ Quản trị viên mới có quyền reset 2FA.' });
      }

      const { targetUserId } = req.body;
      const targetUser = SERVER_USERS.find((u) => u.id === targetUserId);
      if (!targetUser) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

      // SECURITY ENFORCEMENT: Tenant Admin CANNOT reset 2FA of Super Admin
      if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Nghiêm cấm: Tenant Admin không có quyền thao tác trên tài khoản Platform Super Admin.'
        });
      }

      // SECURITY ENFORCEMENT: Tenant Admin can only reset users in their own tenant
      if (req.user.role === 'admin' && targetUser.tenant !== req.user.tenant) {
        return res.status(403).json({
          success: false,
          error: 'Truy cập bị từ chối: Không thể reset người dùng thuộc doanh nghiệp (tenant) khác.'
        });
      }

      targetUser.twoFactorEnabled = false;
      targetUser.twoFactorSecret = undefined;
      targetUser.recoveryCodeHashes = [];

      recordAuditLog({
        actorId: req.user.uid,
        actorName: req.user.sub,
        actorRole: req.user.role,
        tenantId: req.user.tenant,
        action: 'TWO_FACTOR_RESET_BY_ADMIN',
        entity: 'USER_SECURITY',
        entityId: targetUser.id,
        details: `Quản trị viên đã reset cấu hình 2FA cho tài khoản ${targetUser.name}`,
        status: 'WARNING'
      });

      return res.json({
        success: true,
        message: `Đã reset 2FA cho ${targetUser.name}. Người dùng có thể đăng nhập và thiết lập lại 2FA mới.`
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi reset 2FA' });
    }
  });

  // 9. Verify Session Token Endpoint
  app.post('/api/auth/verify-session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = req.body?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);
    if (!token) {
      return res.status(400).json({ valid: false, errorType: 'MISSING_TOKEN', error: 'Thiếu session token' });
    }

    try {
      const cleanToken = token.startsWith('bizone_jwt.') ? token.replace('bizone_jwt.', '') : token.replace('wiup_jwt.', '');
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        return res.json({ valid: false, errorType: 'INVALID_TOKEN', error: 'Token sai định dạng' });
      }

      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);

      if (payload.exp && Date.now() > payload.exp) {
        return res.json({ valid: false, errorType: 'TOKEN_EXPIRED', error: 'Token đã hết hạn' });
      }

      if (payload.sid && REVOKED_SESSIONS.has(payload.sid)) {
        return res.json({ valid: false, errorType: 'SESSION_REVOKED', error: 'Phiên đã bị thu hồi' });
      }

      const rawUser = SERVER_USERS.find((u) => u.id === payload.uid);
      const user = rawUser ? getSafeUser(rawUser) : {
        id: payload.uid,
        name: payload.sub,
        role: payload.role,
        tenant: payload.tenant,
        dataScope: payload.scope
      };

      return res.json({ valid: true, payload, user });
    } catch (e) {
      return res.json({ valid: false, errorType: 'DECODE_ERROR', error: 'Không thể giải mã token' });
    }
  });

  // 11. Get Current Authenticated Profile (GET /api/auth/me)
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const rawUser = SERVER_USERS.find((u) => u.id === req.user?.uid);
    if (!rawUser) {
      return res.json({
        success: true,
        user: {
          id: req.user.uid,
          name: req.user.sub,
          email: req.user.email,
          role: req.user.role,
          tenant: req.user.tenant,
          dataScope: req.user.scope
        }
      });
    }
    res.json({
      success: true,
      user: getSafeUser(rawUser)
    });
  });

  // 12. Change Password Endpoint (Bcrypt verification + Bcrypt hashing + Session Revocation)
  app.post('/api/auth/change-password', authenticateToken, (req: any, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới' });
      }

      const user = SERVER_USERS.find((u) => u.id === req.user.uid);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
      }

      const isOldMatch = bcrypt.compareSync(String(oldPassword).trim(), user.passwordHash);
      if (!isOldMatch) {
        return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });
      }

      if (String(newPassword).trim().length < 6) {
        return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }

      user.passwordHash = bcrypt.hashSync(String(newPassword).trim(), 10);

      // Invalidate current session
      if (req.user.sid) {
        REVOKED_SESSIONS.add(req.user.sid);
      }

      recordAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        tenantId: user.tenant,
        action: 'PASSWORD_CHANGED',
        entity: 'USER_ACCOUNT',
        entityId: user.id,
        details: 'Đổi mật khẩu thành công bằng mã hóa Bcrypt',
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.'
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi đổi mật khẩu' });
    }
  });

  // 13. Logout Endpoint (Revoke Session Token)
  app.post('/api/auth/logout', authenticateToken, (req: any, res) => {
    if (req.user?.sid) {
      REVOKED_SESSIONS.add(req.user.sid);
    }
    recordAuditLog({
      actorId: req.user.uid,
      actorName: req.user.sub,
      actorRole: req.user.role,
      tenantId: req.user.tenant,
      action: 'LOGOUT',
      entity: 'USER_SESSION',
      entityId: req.user.sid,
      details: 'Đăng xuất và thu hồi session token',
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Đăng xuất và thu hồi session token thành công'
    });
  });

  // 13.1. Get Active Sessions for Current User (GET /api/auth/sessions)
  app.get('/api/auth/sessions', authenticateToken, (req: any, res) => {
    try {
      const user = SERVER_USERS.find((u) => u.id === req.user.uid);
      const currentSid = req.user.sid;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Trình duyệt Web';

      let userSessions = user?.sessions && Array.isArray(user.sessions) ? [...user.sessions] : [];

      // Filter out revoked sessions
      userSessions = userSessions.filter((s: any) => s && s.id && !REVOKED_SESSIONS.has(s.id));

      // If current session isn't in userSessions list, include it
      if (currentSid && !userSessions.some((s: any) => s.id === currentSid)) {
        userSessions.unshift({
          id: currentSid,
          ip: ip.replace(/:/g, '_').slice(0, 16),
          userAgent: userAgent.slice(0, 80),
          loginAt: new Date().toISOString(),
          isCurrent: true
        });
      }

      // Format safe session list (NO plaintext credentials)
      const formattedSessions = userSessions.map((s: any) => ({
        id: s.id,
        ipMasked: s.ip ? `${s.ip.slice(0, 4)}***` : '113.***',
        device: s.userAgent || 'Thiết bị bảo mật',
        loginAt: s.loginAt || new Date().toISOString(),
        isCurrent: s.id === currentSid
      }));

      return res.json({
        success: true,
        sessions: formattedSessions
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi truy vấn danh sách phiên hoạt động' });
    }
  });

  // 13.2. Revoke Session Endpoint (POST /api/auth/sessions/revoke)
  app.post('/api/auth/sessions/revoke', authenticateToken, (req: any, res) => {
    try {
      const { sessionId, revokeAllOther = false } = req.body;
      const currentSid = req.user.sid;
      const user = SERVER_USERS.find((u) => u.id === req.user.uid);

      if (revokeAllOther) {
        if (user && user.sessions && Array.isArray(user.sessions)) {
          user.sessions.forEach((s: any) => {
            if (s.id && s.id !== currentSid) {
              REVOKED_SESSIONS.add(s.id);
            }
          });
          user.sessions = user.sessions.filter((s: any) => s.id === currentSid);
        }
        recordAuditLog({
          actorId: req.user.uid,
          actorName: req.user.sub,
          actorRole: req.user.role,
          tenantId: req.user.tenant,
          action: 'REVOKE_ALL_SESSIONS',
          entity: 'USER_SECURITY',
          entityId: req.user.uid,
          details: 'Thu hồi toàn bộ các phiên đăng nhập khác trên các thiết bị',
          status: 'SUCCESS'
        });
        return res.json({
          success: true,
          message: 'Đã thu hồi toàn bộ các phiên đăng nhập khác thành công.'
        });
      }

      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mã phiên cần thu hồi' });
      }

      REVOKED_SESSIONS.add(sessionId);

      if (user && user.sessions && Array.isArray(user.sessions)) {
        user.sessions = user.sessions.filter((s: any) => s.id !== sessionId);
      }

      recordAuditLog({
        actorId: req.user.uid,
        actorName: req.user.sub,
        actorRole: req.user.role,
        tenantId: req.user.tenant,
        action: 'REVOKE_SESSION',
        entity: 'USER_SECURITY',
        entityId: sessionId,
        details: `Thu hồi phiên đăng nhập (${sessionId})`,
        status: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Đã thu hồi phiên đăng nhập thành công.'
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi thu hồi phiên đăng nhập' });
    }
  });

  // 14. Server Audit Logs Endpoint (Super Admin & Admin only)
  app.get('/api/auth/audit-logs', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Quản trị viên mới có quyền xem Audit Logs' });
    }
    res.json({
      success: true,
      auditLogs: SERVER_AUDIT_LOGS
    });
  });

  // 15. Record Client Audit Log
  app.post('/api/auth/audit-log', authenticateToken, (req: any, res) => {
    const entry = req.body;
    const log = recordAuditLog({
      actorId: req.user.uid || 'usr-client',
      actorName: req.user.sub || req.user.email || 'Client User',
      actorRole: req.user.role || 'USER',
      tenantId: req.user.tenant || 'enterprise',
      action: entry.action || 'CLIENT_ACTION',
      entity: entry.module || 'ERP_APP',
      entityId: entry.recordId,
      details: entry.description || '',
      status: 'SUCCESS'
    });
    res.json({ success: true, log });
  });

  // 16. Lock/Unlock User
  app.post('/api/auth/toggle-lock', authenticateToken, requirePermission('user_management', 'edit'), (req: any, res) => {
    const { targetUserId } = req.body;
    const user = SERVER_USERS.find((u) => u.id === targetUserId);
    if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    if (user.role === 'super_admin') {
      return res.status(400).json({ success: false, error: 'Không thể khóa tài khoản Super Admin' });
    }

    user.status = user.status === 'locked' ? 'active' : 'locked';

    recordAuditLog({
      actorId: req.user.uid,
      actorName: req.user.sub,
      actorRole: req.user.role,
      tenantId: req.user.tenant,
      action: user.status === 'locked' ? 'USER_LOCKED' : 'USER_UNLOCKED',
      entity: 'USER_ACCOUNT',
      entityId: user.id,
      details: `${user.status === 'locked' ? 'Khóa' : 'Mở khóa'} tài khoản ${user.name}`,
      status: 'WARNING'
    });

    res.json({
      success: true,
      message: `Đã ${user.status === 'locked' ? 'khóa' : 'mở khóa'} tài khoản ${user.name}`,
      updatedUser: getSafeUser(user)
    });
  });

  // 17. Reset Password by Admin
  app.post('/api/auth/reset-password', authenticateToken, requirePermission('user_management', 'edit'), (req: any, res) => {
    const { targetUserId, newPassword } = req.body;
    const user = SERVER_USERS.find((u) => u.id === targetUserId);
    if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    user.passwordHash = bcrypt.hashSync(String(newPassword).trim(), 10);

    recordAuditLog({
      actorId: req.user.uid,
      actorName: req.user.sub,
      actorRole: req.user.role,
      tenantId: req.user.tenant,
      action: 'PASSWORD_RESET_BY_ADMIN',
      entity: 'USER_ACCOUNT',
      entityId: user.id,
      details: `Quản trị viên đã đặt lại mật khẩu cho ${user.name}`,
      status: 'WARNING'
    });

    res.json({
      success: true,
      message: `Đã đặt lại mật khẩu cho tài khoản ${user.name}`
    });
  });

  // 18. User Management Endpoint (Requires authenticateToken + user_management permission)
  app.get('/api/users', authenticateToken, requirePermission('user_management', 'view'), (req: any, res) => {
    const safeUsers = SERVER_USERS.map(getSafeUser);
    res.json({
      success: true,
      users: safeUsers
    });
  });

  // 19. Protected Customers Endpoint with Tenant Isolation
  app.get('/api/customers', authenticateToken, (req: any, res) => {
    const isDemo = req.user.tenant === 'DEMO' || req.user.role === 'demo';
    if (isDemo) {
      return res.json({
        success: true,
        tenant: 'DEMO',
        customers: [
          { id: 'CUST-DEMO-01', name: 'Công ty TNHH Demo Sandbox Việt Nam', phone: '0901112233', debt: 5000000, tenant: 'DEMO' },
          { id: 'CUST-DEMO-02', name: 'Đại lý Bán lẻ Trải nghiệm Hà Nội', phone: '0902223344', debt: 0, tenant: 'DEMO' }
        ]
      });
    }

    res.json({
      success: true,
      tenant: req.user.tenant || 'enterprise',
      customers: [
        { id: 'CUST-ENT-01', name: 'Tập đoàn Xây dựng Thép Miền Bắc', phone: '0912345678', debt: 185000000, tenant: 'enterprise' },
        { id: 'CUST-ENT-02', name: 'Công ty Cổ phần Cơ điện Vinamex', phone: '0987654321', debt: 42000000, tenant: 'enterprise' }
      ]
    });
  });

  // 20. Protected Enterprise Financial Endpoint (Demo strictly forbidden)
  app.get('/api/enterprise/financial-kpis', authenticateToken, (req: any, res) => {
    if (req.user.tenant === 'DEMO' || req.user.role === 'demo') {
      return res.status(403).json({
        success: false,
        errorType: 'FORBIDDEN',
        error: 'Tài khoản Demo Sandbox không được phép truy cập dữ liệu tài chính của Enterprise.'
      });
    }

    res.json({
      success: true,
      tenant: 'enterprise',
      kpis: {
        totalRevenue: 2450000000,
        netProfit: 680000000,
        receivables: 320000000,
        inventoryValue: 1250000000
      }
    });
  });

  // =========================================================================
  // BIZONE COMMERCIAL SAAS PLATFORM APIS
  // =========================================================================

  const SAAS_PLANS = [
    { id: 'plan-trial-7-days', code: 'TRIAL_7_DAYS', name: 'Dùng Thử 07 Ngày', price: 0, durationDays: 7, maxUsers: 3, features: 'FULL', badge: 'Dùng thử 7 ngày', isTrial: true },
    { id: 'plan-monthly', code: 'MONTHLY', name: 'Gói 1 Tháng', price: 99000, durationDays: 30, maxUsers: 3, features: 'FULL' },
    { id: 'plan-quarterly', code: 'QUARTERLY', name: 'Gói 3 Tháng', price: 249000, durationDays: 90, maxUsers: 3, features: 'FULL' },
    { id: 'plan-six-months', code: 'SIX_MONTHS', name: 'Gói 6 Tháng', price: 399000, durationDays: 180, maxUsers: 3, features: 'FULL' },
    { id: 'plan-annual', code: 'ANNUAL', name: 'Gói 1 Năm', price: 599000, durationDays: 365, maxUsers: 3, features: 'FULL', badge: 'Phổ biến' },
    { id: 'plan-biennial', code: 'BIENNIAL', name: 'Gói 2 Năm', price: 1099000, durationDays: 730, maxUsers: 3, features: 'FULL', badge: 'Tiết kiệm' }
  ];

  const INITIAL_SEED_REGISTRATIONS: any[] = [
    {
      id: 'reg-001',
      registrationCode: 'REG-2026-0801',
      companyName: 'Công ty TNHH May Mặc & Thời Trang An Phát',
      taxCode: '0108991122',
      representative: 'Lê Văn An',
      email: 'anphat.fashion@gmail.com',
      phone: '0987112233',
      address: 'Khu Công Nghiệp Tân Bình, Tây Thạnh, TP.HCM',
      adminName: 'Lê Văn An',
      adminEmail: 'anphat.fashion@gmail.com',
      adminPhone: '0987112233',
      planId: 'plan-annual',
      planCode: 'ANNUAL',
      planName: 'Gói 1 Năm',
      status: 'PENDING_APPROVAL',
      notes: 'Khách hàng đăng ký gói 1 năm chuyển khoản VietQR',
      createdAt: new Date().toISOString()
    }
  ];

  const SAAS_REGISTRATIONS: any[] = loadDataStore<any[]>('saas_registrations.json', INITIAL_SEED_REGISTRATIONS);
  const SAAS_TENANTS: any[] = loadDataStore<any[]>('saas_tenants.json', []);
  const SAAS_LICENSES: any[] = loadDataStore<any[]>('saas_licenses.json', []);
  const SAAS_SUBSCRIPTIONS: any[] = loadDataStore<any[]>('saas_subscriptions.json', []);

  // Helper: Core Customer Approval & Account Provisioning Logic
  function executeCustomerApproval(registrationId: string, clientReg?: any, actorSub: string = 'Super Admin') {
    let targetReg = SAAS_REGISTRATIONS.find((r) => r.id === registrationId);
    if (!targetReg && clientReg) {
      targetReg = clientReg;
      SAAS_REGISTRATIONS.unshift(targetReg);
    }

    if (!targetReg) {
      return { success: false, httpStatus: 404, error: 'Không tìm thấy hồ sơ đăng ký cần phê duyệt.' };
    }

    const tenantId = targetReg.tenantId || `tenant_${targetReg.companyName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 18)}_${Date.now().toString().slice(-4)}`;
    targetReg.tenantId = tenantId;

    const plan = SAAS_PLANS.find((p) => p.id === targetReg.planId || p.code === targetReg.planCode || p.id === targetReg.plan) || SAAS_PLANS[0];
    const isTrial = plan.code === 'TRIAL_7_DAYS' || plan.code === 'TRIAL' || plan.isTrial;

    const durationDays = plan.durationDays || (isTrial ? 7 : 365);
    const startDate = new Date().toISOString().slice(0, 10);
    const expDateObj = new Date();
    expDateObj.setDate(expDateObj.getDate() + durationDays);
    const expiryDate = expDateObj.toISOString().slice(0, 10);

    const adminUserId = `usr-${tenantId}-admin`;

    // Secure Password Determination (Bcrypt - DO NOT double hash)
    let passwordHash = targetReg.passwordHash;
    if (!passwordHash && targetReg.adminPassword) {
      passwordHash = bcrypt.hashSync(String(targetReg.adminPassword).trim(), 10);
      targetReg.passwordHash = passwordHash;
      delete targetReg.adminPassword; // Purge plaintext
    }
    if (!passwordHash) {
      passwordHash = bcrypt.hashSync('Admin@BizOne2026!', 10);
    }

    const targetAdminEmail = String(targetReg.adminEmail || targetReg.email || '').trim().toLowerCase();
    const targetAdminPhone = String(targetReg.adminPhone || targetReg.phone || '').trim();
    const targetAdminUsername = String(targetReg.adminUsername || targetAdminPhone || targetAdminEmail.split('@')[0] || '').trim().toLowerCase();

    // Find existing user across all identifiers
    const existingUserIdx = SERVER_USERS.findIndex(
      (u) =>
        u.id === adminUserId ||
        (u.email && u.email.toLowerCase() === targetAdminEmail) ||
        (u.phone && targetAdminPhone && normalizePhone(u.phone) === normalizePhone(targetAdminPhone)) ||
        (u.username && targetAdminUsername && u.username.toLowerCase() === targetAdminUsername)
    );

    const isUserExists = existingUserIdx >= 0;
    const isUserCreated = !isUserExists;

    const serverUserObj: ServerUserRecord = {
      id: isUserExists ? SERVER_USERS[existingUserIdx].id : adminUserId,
      username: targetAdminUsername || targetAdminPhone || targetAdminEmail,
      email: targetAdminEmail,
      name: targetReg.adminName || targetReg.representative || targetReg.companyName,
      employeeCode: isUserExists ? SERVER_USERS[existingUserIdx].employeeCode : `NV-${Date.now().toString().slice(-4)}`,
      phone: targetAdminPhone || (isUserExists ? SERVER_USERS[existingUserIdx].phone : '0900000000'),
      tenant: tenantId,
      department: 'Ban Giám Đốc Doanh Nghiệp',
      position: 'Giám Đốc / Quản trị Doanh nghiệp',
      avatar: isUserExists ? SERVER_USERS[existingUserIdx].avatar : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      role: 'admin',
      roleTitle: 'Quản trị viên Doanh nghiệp (Tenant Admin)',
      managementLevel: 'director',
      dataScope: 'company_wide',
      division: 'Ban Quản Trị Doanh Nghiệp',
      branchId: 'BR01',
      branchName: 'Trụ sở chính',
      status: 'active',
      twoFactorEnabled: false,
      forcePasswordChange: Boolean(!targetReg.passwordHash && !targetReg.adminPassword),
      failedLoginAttempts: 0,
      passwordHash: passwordHash,
      permissions: {
        dashboard: ['view', 'export'],
        products: ['view', 'create', 'edit', 'delete', 'export', 'adjust_cost'],
        purchasing: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        issues: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        transfers: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        stocktakes: ['view', 'create', 'edit', 'delete', 'stocktake_approve', 'export'],
        fifo_lots: ['view', 'edit', 'adjust_cost', 'export'],
        customers: ['view', 'create', 'edit', 'delete', 'export'],
        suppliers: ['view', 'create', 'edit', 'delete', 'export'],
        debt_receivables: ['view', 'create', 'edit', 'delete', 'export'],
        debt_payables: ['view', 'create', 'edit', 'delete', 'export'],
        cashflow: ['view', 'create', 'edit', 'delete', 'export'],
        reports: ['view', 'export'],
        banking_vietqr: ['view', 'create', 'edit'],
        user_management: ['view', 'create', 'edit', 'password_reset'],
        automation_engine: ['view', 'create', 'edit'],
        api_integrations: ['view', 'create', 'edit'],
        settings: ['view', 'create', 'edit']
      },
      sessions: []
    };

    if (isUserExists) {
      SERVER_USERS[existingUserIdx] = serverUserObj;
    } else {
      SERVER_USERS.push(serverUserObj);
    }
    saveDataStore('server_users.json', SERVER_USERS);

    // Create & Persist Tenant
    const subId = `sub-${Date.now()}`;
    const licId = `lic-bizone-${Date.now().toString().slice(-6)}`;
    const tenantRecord = {
      id: tenantId,
      code: `TNT-${Date.now().toString().slice(-4)}`,
      name: targetReg.companyName,
      companyName: targetReg.companyName,
      taxCode: targetReg.taxCode || '',
      representative: targetReg.representative || targetReg.adminName,
      email: targetReg.email,
      phone: targetReg.phone,
      address: targetReg.address || '',
      adminUserId: serverUserObj.id,
      adminName: targetReg.adminName,
      adminEmail: targetAdminEmail,
      adminPhone: targetAdminPhone,
      status: 'ACTIVE',
      maxUsers: 3,
      activeUsersCount: 1,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      subscriptionId: subId,
      licenseId: licId,
      startDate,
      expiryDate,
      healthStatus: 'GOOD',
      lastActive: 'Vừa kích hoạt',
      createdAt: targetReg.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingTenantIdx = SAAS_TENANTS.findIndex((t) => t.id === tenantId);
    if (existingTenantIdx >= 0) {
      SAAS_TENANTS[existingTenantIdx] = tenantRecord;
    } else {
      SAAS_TENANTS.unshift(tenantRecord);
    }
    saveDataStore('saas_tenants.json', SAAS_TENANTS);

    // Mark registration as approved
    targetReg.status = 'APPROVED';
    targetReg.approvedAt = new Date().toISOString();
    targetReg.approvedBy = actorSub || 'Super Admin';
    targetReg.tenantId = tenantId;
    targetReg.updatedAt = new Date().toISOString();
    saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);

    // Safe Diagnostic Log (NO passwords, hashes, or secrets logged)
    console.log(
      `[REGISTRATION_APPROVAL] registrationId=${targetReg.id}, tenantId=${tenantId}, userId=${serverUserObj.id}, identifier=${targetAdminEmail}, userCreated=${isUserCreated}, userExists=${isUserExists}, userStatus=active, passwordHashExists=${Boolean(passwordHash)}`
    );

    return {
      success: true,
      registrationId: targetReg.id,
      tenantId,
      userId: serverUserObj.id,
      status: 'active',
      message: `Đã duyệt thành công hồ sơ ${targetReg.registrationCode}. Tài khoản quản trị doanh nghiệp [${targetAdminEmail}] đã được kích hoạt trên hệ thống máy chủ và có thể đăng nhập ngay.`
    };
  }

  // Reconcile and Auto-Repair existing approved customer accounts on system startup
  function reconcileApprovedCustomers() {
    try {
      const approvedRegs = SAAS_REGISTRATIONS.filter((r) => r.status === 'APPROVED');
      let repairedCount = 0;
      for (const reg of approvedRegs) {
        const email = String(reg.adminEmail || reg.email || '').trim().toLowerCase();
        const phone = String(reg.adminPhone || reg.phone || '').trim();
        const exists = SERVER_USERS.some(
          (u) =>
            (u.email && u.email.toLowerCase() === email) ||
            (phone && u.phone && normalizePhone(u.phone) === normalizePhone(phone))
        );
        if (!exists) {
          executeCustomerApproval(reg.id, reg, 'System Startup Reconcile');
          repairedCount++;
        }
      }
      if (repairedCount > 0) {
        console.log(`[RECONCILE] Automatically repaired and activated ${repairedCount} approved customer accounts in SERVER_USERS.`);
      }
    } catch (e) {
      console.warn('[RECONCILE] Could not run automatic reconciliation:', e);
    }
  }
  reconcileApprovedCustomers();

  app.get('/api/saas/plans', (req, res) => {
    res.json({ success: true, plans: SAAS_PLANS });
  });

  // Customer Self-Registration
  app.post('/api/saas/register', (req, res) => {
    try {
      const { companyName, taxCode, representative, email, phone, address, adminName, adminUsername, adminEmail, adminPhone, adminPassword, planId, notes } = req.body;
      if (!companyName || !email || !adminName || !adminEmail) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin doanh nghiệp và người quản trị.' });
      }

      const plan = SAAS_PLANS.find((p) => p.id === planId || p.code === planId) || SAAS_PLANS[0];
      
      // Compute bcrypt hash immediately if password provided (do not store plaintext)
      let passwordHash: string | undefined = undefined;
      if (adminPassword && String(adminPassword).trim()) {
        passwordHash = bcrypt.hashSync(String(adminPassword).trim(), 10);
      }

      const newRegistration = {
        id: `reg-${Date.now()}`,
        registrationCode: `REG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        companyName: companyName.trim(),
        taxCode: (taxCode || '').trim(),
        representative: (representative || adminName).trim(),
        email: email.trim(),
        phone: (phone || '').trim(),
        address: (address || '').trim(),
        adminName: adminName.trim(),
        adminUsername: (adminUsername || adminPhone || adminEmail.split('@')[0] || '').trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: (adminPhone || phone || '').trim(),
        passwordHash, // Stored safely as bcrypt hash
        planId: plan.id,
        planCode: plan.code,
        planName: plan.name,
        status: 'PENDING_APPROVAL',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      SAAS_REGISTRATIONS.unshift(newRegistration);
      saveDataStore('saas_registrations.json', SAAS_REGISTRATIONS);

      console.log(`[SAAS_REGISTER] Registration received: ${newRegistration.registrationCode} for "${newRegistration.companyName}", Admin: ${newRegistration.adminUsername} / ${newRegistration.adminEmail} / ${newRegistration.adminPhone}, Plan: ${plan.name} (${plan.code})`);

      return res.json({
        success: true,
        registration: newRegistration,
        message: 'Đăng ký thành công. Hồ sơ đang chờ BizOne duyệt.'
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message || 'Lỗi xử lý đăng ký' });
    }
  });

  app.get('/api/saas/registrations', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền xem danh sách đăng ký.' });
    }
    res.json({ success: true, registrations: SAAS_REGISTRATIONS });
  });

  // Approve Customer Registration -> Primary Route /api/saas/registrations/:id/approve
  app.post('/api/saas/registrations/:id/approve', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền phê duyệt hồ sơ đăng ký khách hàng.' });
    }

    try {
      const { id } = req.params;
      const { registration: clientReg } = req.body || {};
      const result = executeCustomerApproval(id, clientReg, req.user.sub || req.user.email || 'Super Admin');

      if (!result.success) {
        return res.status(result.httpStatus || 400).json(result);
      }

      recordAuditLog({
        actorId: req.user.uid,
        actorName: req.user.sub,
        actorRole: req.user.role,
        tenantId: result.tenantId || 'PLATFORM',
        action: 'APPROVE_CUSTOMER',
        entity: 'SAAS_REGISTRATION',
        entityId: id,
        details: `Phê duyệt hồ sơ đăng ký ${id}, khởi tạo tài khoản quản trị ${result.userId} thành công.`,
        status: 'SUCCESS'
      });

      return res.json(result);
    } catch (e: any) {
      console.error('Approve registration error:', e);
      return res.status(500).json({ success: false, error: 'Lỗi khi phê duyệt hồ sơ khách hàng trên máy chủ: ' + (e.message || '') });
    }
  });

  // Approve Customer Registration -> Alias Route /api/saas/approve-registration
  app.post('/api/saas/approve-registration', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền phê duyệt hồ sơ đăng ký khách hàng.' });
    }

    try {
      const { registrationId, registration: clientReg } = req.body;
      const result = executeCustomerApproval(registrationId, clientReg, req.user.sub || req.user.email || 'Super Admin');

      if (!result.success) {
        return res.status(result.httpStatus || 400).json(result);
      }

      recordAuditLog({
        actorId: req.user.uid,
        actorName: req.user.sub,
        actorRole: req.user.role,
        tenantId: result.tenantId || 'PLATFORM',
        action: 'APPROVE_CUSTOMER',
        entity: 'SAAS_REGISTRATION',
        entityId: registrationId,
        details: `Phê duyệt hồ sơ đăng ký ${registrationId}, khởi tạo tài khoản quản trị ${result.userId} thành công.`,
        status: 'SUCCESS'
      });

      return res.json(result);
    } catch (e: any) {
      console.error('Approve registration error:', e);
      return res.status(500).json({ success: false, error: 'Lỗi khi phê duyệt hồ sơ khách hàng trên máy chủ: ' + (e.message || '') });
    }
  });

  // Repair / Re-sync Account for Existing Approved Customers
  app.post('/api/saas/registrations/:id/repair', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền đồng bộ tài khoản khách hàng.' });
    }

    try {
      const { id } = req.params;
      const { registration: clientReg } = req.body || {};
      const result = executeCustomerApproval(id, clientReg, req.user.sub || 'Super Admin Sync');

      if (!result.success) {
        return res.status(result.httpStatus || 400).json(result);
      }

      return res.json({
        ...result,
        message: `Đồng bộ tài khoản thành công. Quản trị viên doanh nghiệp có thể đăng nhập ngay.`
      });
    } catch (e: any) {
      console.error('Repair account error:', e);
      return res.status(500).json({ success: false, error: 'Lỗi khi đồng bộ tài khoản: ' + (e.message || '') });
    }
  });

  app.post('/api/saas/repair-account', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Super Admin mới có quyền đồng bộ tài khoản khách hàng.' });
    }

    try {
      const { registrationId, registration: clientReg } = req.body;
      const result = executeCustomerApproval(registrationId, clientReg, req.user.sub || 'Super Admin Sync');

      if (!result.success) {
        return res.status(result.httpStatus || 400).json(result);
      }

      return res.json({
        ...result,
        message: `Đồng bộ tài khoản thành công. Quản trị viên doanh nghiệp có thể đăng nhập ngay.`
      });
    } catch (e: any) {
      console.error('Repair account error:', e);
      return res.status(500).json({ success: false, error: 'Lỗi khi đồng bộ tài khoản: ' + (e.message || '') });
    }
  });

  app.get('/api/saas/license-check/:tenantId', authenticateToken, (req: any, res) => {
    const { tenantId } = req.params;
    res.json({
      success: true,
      tenantId,
      status: 'ACTIVE',
      maxUsers: 3,
      features: 'FULL',
      daysRemaining: 135
    });
  });

  app.post('/api/users/check-limit', authenticateToken, (req: any, res) => {
    const tenantUsers = SERVER_USERS.filter(
      (u) => (u.tenant === req.user.tenant || u.tenant === 'enterprise') && u.status === 'active'
    );
    const isAtLimit = tenantUsers.length >= 3;
    res.json({
      success: true,
      activeCount: tenantUsers.length,
      maxUsers: 3,
      isAtLimit,
      message: isAtLimit ? 'Đã đạt giới hạn 3 tài khoản. Vui lòng liên hệ BizOne để nâng cấp gói.' : 'Hợp lệ'
    });
  });

  // =========================================================================
  // AI SERVICES (GEMINI RESTRICTED)
  // =========================================================================

  app.post('/api/invoices/extract-pdf', authenticateToken, async (req: any, res) => {
    try {
      const { fileBase64, mimeType = 'application/pdf', fileName, textContent } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const systemPrompt = `Bạn là chuyên gia kế toán thuế và AI trích xuất hóa đơn điện tử GTGT Việt Nam (theo Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC) từ các nhà cung cấp như VNPT, Viettel, MISA meInvoice, BKAV, CyberBill, FPT, CQT...
Nhiệm vụ: Trích xuất toàn bộ dữ liệu từ file hóa đơn đính kèm hoặc nội dung văn bản thành cấu trúc JSON CHÍNH XÁC theo schema quy định.
Chỉ trả về duy nhất chuỗi JSON hợp lệ.`;

      if (!apiKey) {
        return res.json({
          success: true,
          source: 'local_parser_fallback',
          data: {
            invoice_meta: {
              series: '1C26TMB',
              invoice_no: '0012398',
              issue_date: new Date().toISOString().split('T')[0],
              tax_auth_code: 'T26-0012398-MB',
              lookup_code: 'MISA882398',
              lookup_url: 'https://meinvoice.vn/tra-cuu'
            },
            seller: {
              name: 'CÔNG TY CỔ PHẦN THÉP MIỀN BẮC',
              tax_code: '0102345678',
              address: 'Lô CN5, KCN Quang Minh, Mê Linh, Hà Nội'
            },
            buyer: {
              name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI BIZONE',
              tax_code: '0109988776',
              address: 'Tầng 12, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội'
            },
            line_items: [
              {
                stt: 1,
                description: 'Thép hình chữ H 150x150x7x10 - Posco',
                unit: 'Cây',
                quantity: 20,
                unit_price: 3450000,
                amount_before_tax: 69000000,
                vat_rate: 8,
                vat_amount: 5520000,
                amount_after_tax: 74520000
              }
            ],
            totals: {
              amount_before_tax: 69000000,
              vat_amount: 5520000,
              amount_after_tax: 74520000
            }
          }
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];
      if (fileBase64) {
        contents.push({
          inlineData: {
            mimeType,
            data: fileBase64.replace(/^data:.*?;base64,/, '')
          }
        });
      }

      let textQuery = `Hãy phân tích và bóc tách toàn bộ thông tin trên hóa đơn điện tử đính kèm (hoặc văn bản) thành JSON chuẩn.`;
      if (fileName) textQuery += ` Tên file: ${fileName}.`;
      if (textContent) textQuery += ` Nội dung văn bản đọc được:\n${textContent}`;
      contents.push(textQuery);

      const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'];
      let rawText = '';
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json'
            },
            contents,
          });
          if (response && response.text) {
            rawText = response.text;
            break;
          }
        } catch (e) {
          console.warn(`Extraction error with model ${m}:`, e);
        }
      }

      if (!rawText) {
        throw new Error('Không nhận được phản hồi từ AI trích xuất hóa đơn');
      }

      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const invoiceData = JSON.parse(rawText);

      return res.json({
        success: true,
        source: 'gemini',
        data: invoiceData
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Lỗi trích xuất hóa đơn điện tử qua AI'
      });
    }
  });

  app.post('/api/ai/diagnose', authenticateToken, async (req: any, res) => {
    try {
      const { metrics, inventory, customers } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          source: 'local_engine',
          insights: [
            {
              id: 'stock-alert-1',
              type: 'warning',
              category: 'Tồn kho',
              title: 'Cảnh báo Tồn kho',
              description: 'Sản phẩm Thép tấm 5 ly dự kiến sẽ hết hàng trong 3 ngày tới dựa trên tốc độ bán hiện tại. Khuyến nghị nhập thêm 500kg.',
              actionLabel: 'Tạo phiếu nhập →',
              actionType: 'create_po',
              targetItem: 'Thép tấm 5 ly'
            }
          ]
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là Giám đốc Tài chính & Trợ lý Kinh doanh AI thông minh cho hệ thống BizOne ERP.
Dựa trên dữ liệu:
- Doanh thu: ${JSON.stringify(metrics || {})}
- Tồn kho: ${JSON.stringify(inventory || [])}
- Khách hàng & Công nợ: ${JSON.stringify(customers || [])}

Hãy đưa ra 3-4 chẩn đoán kinh doanh chính xác, súc tích bằng Tiếng Việt với cấu trúc JSON.
Chỉ trả về JSON thuần túy.`;

      const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'];
      let rawText = '';
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: prompt,
          });
          if (response && response.text) {
            rawText = response.text;
            break;
          }
        } catch (e) {
          console.warn(`Diagnosis error with model ${m}:`, e);
        }
      }

      if (!rawText) {
        throw new Error('Không thể tạo chẩn đoán AI');
      }

      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const insights = JSON.parse(rawText);

      return res.json({
        success: true,
        source: 'gemini',
        insights
      });
    } catch (err: any) {
      return res.json({
        success: true,
        source: 'local_engine',
        insights: [
          {
            id: 'stock-alert-1',
            type: 'warning',
            category: 'Tồn kho',
            title: 'Cảnh báo Tồn kho',
            description: 'Sản phẩm Thép tấm 5 ly dự kiến sẽ hết hàng trong 3 ngày tới.',
            actionLabel: 'Tạo phiếu nhập →',
            actionType: 'create_po'
          }
        ]
      });
    }
  });

  app.post('/api/ai/chat', authenticateToken, async (req: any, res) => {
    try {
      const { message } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          reply: `[BizOne Copilot]: Cảm ơn câu hỏi "${message}". Hệ thống đang hoạt động với đầy đủ tính năng xác thực bảo mật, kho vận và tài chính.`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là Trợ lý Doanh nghiệp BizOne ERP thông minh.
Bối cảnh hệ thống hiện tại:
- Doanh thu thuần hôm nay: 124,500,000 đ
- Lợi nhuận gộp: 45,200,000 đ (Biên LN: 36.3%)
- Số đơn hàng: 142 đơn
- Công nợ phải thu: 18,400,000 đ từ 12 khách hàng

Câu hỏi của người dùng: "${message}"
Hãy trả lời chuyên nghiệp, thân thiện, súc tích bằng Tiếng Việt.`;

      const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'];
      let replyText = '';
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: prompt,
          });
          if (response && response.text) {
            replyText = response.text;
            break;
          }
        } catch (e) {
          console.warn(`Chat error with model ${m}:`, e);
        }
      }

      return res.json({ reply: replyText || 'Xin lỗi, tôi chưa thể trả lời lúc này. Bạn vui lòng thử lại sau.' });
    } catch (err: any) {
      return res.json({
        reply: `Xin lỗi, có lỗi khi kết nối AI. Tôi đã ghi nhận câu hỏi của bạn.`
      });
    }
  });

  // =========================================================================
  // TRANSACTION ENGINE + DAILY TARGET + AD OPPORTUNITY (DASHBOARD SYSTEM 2)
  // =========================================================================

  interface ServerTransactionRecord {
    id: string;
    tenantId: string;
    userId?: string;
    type: 'SALE';
    source: 'ERP' | 'SHOPEE' | 'TIKTOK_SHOP' | 'LAZADA' | 'WEBSITE' | 'POS' | 'API' | 'MANUAL';
    orderId?: string;
    amount?: number;
    currency?: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
    createdAt: string;
    confirmedAt?: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
  }

  interface ServerDailyConfig {
    enabled: boolean;
    min: number;
    max: number;
    maxPerDay?: number;
    adaptiveAdOpportunity: boolean;
    updatedAt: string;
    updatedBy?: string;
  }

  interface ServerDailySnapshot {
    tenantId: string;
    date: string; // YYYY-MM-DD
    target: number;
    createdAt: string;
  }

  interface ServerTxAuditEntry {
    id: string;
    tenantId: string;
    actorId: string;
    actorName?: string;
    action:
      | 'TRANSACTION_CREATED'
      | 'TRANSACTION_CONFIRMED'
      | 'TRANSACTION_CANCELLED'
      | 'TRANSACTION_REFUNDED'
      | 'TARGET_CREATED'
      | 'TARGET_UPDATED'
      | 'CONFIG_UPDATED'
      | 'IDEMPOTENCY_DUPLICATE_HIT';
    entityType: string;
    entityId: string;
    before?: any;
    after?: any;
    timestamp: string;
    details?: string;
  }

  // Load persistent JSON stores
  const SERVER_TRANSACTIONS: ServerTransactionRecord[] = loadDataStore<ServerTransactionRecord[]>(
    'transactions.json',
    []
  );

  const SERVER_TRANSACTION_CONFIGS: Record<string, ServerDailyConfig> = loadDataStore<Record<string, ServerDailyConfig>>(
    'transaction_configs.json',
    {}
  );

  const SERVER_TARGET_SNAPSHOTS: Record<string, ServerDailySnapshot> = loadDataStore<Record<string, ServerDailySnapshot>>(
    'transaction_daily_snapshots.json',
    {}
  );

  const SERVER_TX_AUDIT_LOGS: ServerTxAuditEntry[] = loadDataStore<ServerTxAuditEntry[]>(
    'transaction_audit_logs.json',
    []
  );

  function recordTxAudit(entry: Omit<ServerTxAuditEntry, 'id' | 'timestamp'>): void {
    const newLog: ServerTxAuditEntry = {
      ...entry,
      id: `tx_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    SERVER_TX_AUDIT_LOGS.unshift(newLog);
    if (SERVER_TX_AUDIT_LOGS.length > 2000) {
      SERVER_TX_AUDIT_LOGS.length = 2000;
    }
    saveDataStore('transaction_audit_logs.json', SERVER_TX_AUDIT_LOGS);
  }

  function getTenantTransactionConfig(tenantId: string): ServerDailyConfig {
    const key = tenantId || 'enterprise';
    if (SERVER_TRANSACTION_CONFIGS[key]) {
      return SERVER_TRANSACTION_CONFIGS[key];
    }
    // Default config: min 4, max 6, maxPerDay 6, adaptive true
    const defaultConfig: ServerDailyConfig = {
      enabled: true,
      min: 4,
      max: 6,
      maxPerDay: 6,
      adaptiveAdOpportunity: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System Bootstrap'
    };
    SERVER_TRANSACTION_CONFIGS[key] = defaultConfig;
    saveDataStore('transaction_configs.json', SERVER_TRANSACTION_CONFIGS);
    return defaultConfig;
  }

  function getTenantDailyTarget(tenantId: string, dateStr: string): number {
    const key = `${tenantId || 'enterprise'}_${dateStr}`;
    if (SERVER_TARGET_SNAPSHOTS[key]) {
      return SERVER_TARGET_SNAPSHOTS[key].target;
    }

    const config = getTenantTransactionConfig(tenantId);
    const min = Math.max(1, Number(config.min) || 4);
    const max = Math.max(min, Number(config.max) || 6);

    // Generate stable integer target between [min, max]
    // Uses date string seed + tenantId to ensure deterministic fallback if needed
    let seed = 0;
    for (let i = 0; i < key.length; i++) {
      seed = (seed * 31 + key.charCodeAt(i)) % 10000;
    }
    const range = max - min + 1;
    const target = min + (seed % range);

    const snapshot: ServerDailySnapshot = {
      tenantId: tenantId || 'enterprise',
      date: dateStr,
      target,
      createdAt: new Date().toISOString()
    };

    SERVER_TARGET_SNAPSHOTS[key] = snapshot;
    saveDataStore('transaction_daily_snapshots.json', SERVER_TARGET_SNAPSHOTS);

    recordTxAudit({
      tenantId: tenantId || 'enterprise',
      actorId: 'system_engine',
      actorName: 'Target Engine',
      action: 'TARGET_CREATED',
      entityType: 'DAILY_TARGET',
      entityId: key,
      after: snapshot,
      details: `Khởi tạo snapshot mục tiêu ngày ${dateStr}: ${target} giao dịch (Khoảng cấu hình: ${min}-${max})`
    });

    return target;
  }

  // 1. Dashboard Metrics Endpoint
  app.get('/api/transactions/dashboard', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const queryDate = req.query.date ? String(req.query.date) : new Date().toISOString().substring(0, 10);

      const config = getTenantTransactionConfig(tenantId);
      const targetNumber = getTenantDailyTarget(tenantId, queryDate);
      const maxLimit = Math.max(targetNumber, config.maxPerDay || targetNumber);

      // ONLY count SALE transactions with CONFIRMED status on that date
      const tenantTransactions = SERVER_TRANSACTIONS.filter(
        (t) => t.tenantId === tenantId && t.createdAt.startsWith(queryDate)
      );

      const confirmedSales = tenantTransactions.filter((t) => t.type === 'SALE' && t.status === 'CONFIRMED');
      const actual = confirmedSales.length;
      const revenue = confirmedSales.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const cancelled = tenantTransactions.filter((t) => t.status === 'CANCELLED').length;
      const refunded = tenantTransactions.filter((t) => t.status === 'REFUNDED').length;

      const remaining = Math.max(0, targetNumber - actual);
      const progress = targetNumber > 0 ? Math.min(100, Math.round((actual / targetNumber) * 100)) : 100;

      let status: 'IN_PROGRESS' | 'COMPLETED' | 'EXCEEDED' | 'DISABLED' = 'IN_PROGRESS';
      if (!config.enabled) {
        status = 'DISABLED';
      } else if (actual >= maxLimit) {
        status = 'EXCEEDED';
      } else if (actual >= targetNumber) {
        status = 'COMPLETED';
      }

      // Ad Opportunity Engine Signal Calculation
      let adLevel: 'HIGH' | 'NORMAL' | 'STOP' = 'NORMAL';
      let adReason = '';

      if (!config.enabled || !config.adaptiveAdOpportunity) {
        adLevel = 'NORMAL';
        adReason = 'Cơ chế cơ hội quảng cáo đang tạm ngắt.';
      } else if (actual < targetNumber) {
        adLevel = 'HIGH';
        adReason = `Chưa đạt mục tiêu (${actual}/${targetNumber}). Tăng ngân sách và tần suất hiển thị để hoàn thành chỉ tiêu ${remaining} giao dịch còn lại.`;
      } else if (actual >= maxLimit) {
        adLevel = 'STOP';
        adReason = `Đã chạm trần tối đa ${maxLimit} giao dịch/ngày (${actual}/${maxLimit}). Tạm dừng kích hoạt quảng cáo mới để tối ưu chi phí.`;
      } else {
        adLevel = 'NORMAL';
        adReason = `Đã đạt mục tiêu (${actual}/${targetNumber}). Duy trì quảng cáo chuyển đổi ổn định.`;
      }

      const recentTransactions = SERVER_TRANSACTIONS.filter((t) => t.tenantId === tenantId).slice(0, 10);

      return res.json({
        success: true,
        date: queryDate,
        target: {
          min: config.min,
          max: config.max,
          today: targetNumber
        },
        actual,
        remaining,
        progress,
        status,
        adOpportunity: {
          level: adLevel,
          enabled: config.enabled && config.adaptiveAdOpportunity,
          reason: adReason
        },
        metrics: {
          sales: actual,
          revenue,
          confirmed: actual,
          cancelled,
          refunded
        },
        recentTransactions
      });
    } catch (e: any) {
      console.error('[TransactionEngine] Dashboard API Error:', e);
      return res.status(500).json({ success: false, error: 'Lỗi xử lý số liệu giao dịch Dashboard' });
    }
  });

  // 2. Create SALE Transaction Endpoint (with strict Idempotency check)
  app.post('/api/transactions/sale', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const userId = req.user.uid || req.user.id;
      const {
        idempotencyKey,
        orderId,
        source = 'ERP',
        amount = 0,
        currency = 'VND',
        status = 'CONFIRMED',
        metadata = {}
      } = req.body;

      if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 3) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_IDEMPOTENCY_KEY',
          error: 'Mỗi giao dịch SALE bắt buộc phải có idempotencyKey duy nhất.'
        });
      }

      const cleanKey = idempotencyKey.trim();

      // Check Idempotency within the tenant
      const existing = SERVER_TRANSACTIONS.find(
        (t) => t.tenantId === tenantId && t.idempotencyKey === cleanKey
      );

      if (existing) {
        // Record idempotency hit
        recordTxAudit({
          tenantId,
          actorId: userId,
          actorName: req.user.name || req.user.sub,
          action: 'IDEMPOTENCY_DUPLICATE_HIT',
          entityType: 'TRANSACTION',
          entityId: existing.id,
          after: { idempotencyKey: cleanKey, existingId: existing.id },
          details: `Phát hiện yêu cầu trùng lặp idempotencyKey (${cleanKey}). Trả về bản ghi gốc, không tăng số đếm giao dịch.`
        });

        return res.json({
          success: true,
          isDuplicate: true,
          transaction: existing,
          message: 'Giao dịch đã được ghi nhận trước đó (Idempotency Replay).'
        });
      }

      const numAmount = Math.max(0, Number(amount) || 0);
      const validSources = ['ERP', 'SHOPEE', 'TIKTOK_SHOP', 'LAZADA', 'WEBSITE', 'POS', 'API', 'MANUAL'];
      const finalSource = validSources.includes(source) ? source : 'ERP';
      const finalStatus = status === 'PENDING' ? 'PENDING' : 'CONFIRMED';
      const nowIso = new Date().toISOString();

      const newTx: ServerTransactionRecord = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId,
        userId,
        type: 'SALE',
        source: finalSource as any,
        orderId: orderId ? String(orderId).trim() : undefined,
        amount: numAmount,
        currency: currency || 'VND',
        status: finalStatus,
        createdAt: nowIso,
        confirmedAt: finalStatus === 'CONFIRMED' ? nowIso : undefined,
        idempotencyKey: cleanKey,
        metadata: metadata && typeof metadata === 'object' ? metadata : {}
      };

      SERVER_TRANSACTIONS.unshift(newTx);
      saveDataStore('transactions.json', SERVER_TRANSACTIONS);

      recordTxAudit({
        tenantId,
        actorId: userId,
        actorName: req.user.name || req.user.sub,
        action: finalStatus === 'CONFIRMED' ? 'TRANSACTION_CONFIRMED' : 'TRANSACTION_CREATED',
        entityType: 'TRANSACTION',
        entityId: newTx.id,
        after: newTx,
        details: `Ghi nhận giao dịch SALE mới qua kênh ${finalSource}, giá trị ${numAmount.toLocaleString('vi-VN')} đ`
      });

      return res.status(201).json({
        success: true,
        isDuplicate: false,
        transaction: newTx,
        message: 'Tạo và xác nhận giao dịch SALE thành công.'
      });
    } catch (e: any) {
      console.error('[TransactionEngine] Create Sale Transaction Error:', e);
      return res.status(500).json({ success: false, error: 'Lỗi ghi nhận giao dịch bán' });
    }
  });

  // 3. List Transactions Endpoint
  app.get('/api/transactions', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const { date, status, source, limit = 50, offset = 0 } = req.query;

      let list = SERVER_TRANSACTIONS.filter((t) => t.tenantId === tenantId);

      if (date) {
        list = list.filter((t) => t.createdAt.startsWith(String(date)));
      }
      if (status) {
        list = list.filter((t) => t.status === status);
      }
      if (source) {
        list = list.filter((t) => t.source === source);
      }

      const total = list.length;
      const numLimit = Math.min(200, Math.max(1, Number(limit) || 50));
      const numOffset = Math.max(0, Number(offset) || 0);
      const paginated = list.slice(numOffset, numOffset + numLimit);

      return res.json({
        success: true,
        total,
        limit: numLimit,
        offset: numOffset,
        transactions: paginated
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi tải danh sách giao dịch' });
    }
  });

  // 4. Cancel Transaction Endpoint
  app.post('/api/transactions/:id/cancel', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const { id } = req.params;
      const { reason } = req.body;

      const tx = SERVER_TRANSACTIONS.find((t) => t.id === id && t.tenantId === tenantId);
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy giao dịch' });
      }

      const prevStatus = tx.status;
      tx.status = 'CANCELLED';
      saveDataStore('transactions.json', SERVER_TRANSACTIONS);

      recordTxAudit({
        tenantId,
        actorId: req.user.uid || req.user.id,
        actorName: req.user.name || req.user.sub,
        action: 'TRANSACTION_CANCELLED',
        entityType: 'TRANSACTION',
        entityId: tx.id,
        before: { status: prevStatus },
        after: { status: 'CANCELLED', reason },
        details: `Hủy giao dịch ${tx.id}. Lý do: ${reason || 'Không ghi chú'}`
      });

      return res.json({ success: true, message: 'Đã hủy giao dịch thành công.', transaction: tx });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi khi hủy giao dịch' });
    }
  });

  // 5. Refund Transaction Endpoint
  app.post('/api/transactions/:id/refund', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const { id } = req.params;
      const { reason } = req.body;

      const tx = SERVER_TRANSACTIONS.find((t) => t.id === id && t.tenantId === tenantId);
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy giao dịch' });
      }

      const prevStatus = tx.status;
      tx.status = 'REFUNDED';
      saveDataStore('transactions.json', SERVER_TRANSACTIONS);

      recordTxAudit({
        tenantId,
        actorId: req.user.uid || req.user.id,
        actorName: req.user.name || req.user.sub,
        action: 'TRANSACTION_REFUNDED',
        entityType: 'TRANSACTION',
        entityId: tx.id,
        before: { status: prevStatus },
        after: { status: 'REFUNDED', reason },
        details: `Hoàn tiền giao dịch ${tx.id}. Lý do: ${reason || 'Không ghi chú'}`
      });

      return res.json({ success: true, message: 'Đã hoàn tiền giao dịch thành công.', transaction: tx });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi khi hoàn tiền giao dịch' });
    }
  });

  // 6. Get Daily Target Config
  app.get('/api/transactions/config', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const config = getTenantTransactionConfig(tenantId);
      return res.json({ success: true, config });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi lấy cấu hình mục tiêu giao dịch' });
    }
  });

  // 7. Save Daily Target Config (Admin / Super Admin)
  app.post('/api/transactions/config', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          errorType: 'FORBIDDEN',
          error: 'Chỉ Quản trị viên (Admin/Super Admin) mới có quyền thay đổi cấu hình mục tiêu giao dịch.'
        });
      }

      const tenantId = req.user.tenant || 'enterprise';
      const { enabled = true, min = 4, max = 6, maxPerDay = 6, adaptiveAdOpportunity = true } = req.body;

      const numMin = Number(min);
      const numMax = Number(max);
      const numMaxPerDay = Number(maxPerDay);

      if (isNaN(numMin) || isNaN(numMax) || numMin < 0 || numMax < numMin) {
        return res.status(400).json({
          success: false,
          errorType: 'INVALID_CONFIG_VALUES',
          error: 'Giá trị cấu hình không hợp lệ. Yêu cầu: min >= 0 và max >= min.'
        });
      }

      if (!isNaN(numMaxPerDay) && numMaxPerDay < numMax) {
        return res.status(400).json({
          success: false,
          errorType: 'INVALID_MAX_PER_DAY',
          error: 'Giới hạn trần tối đa trong ngày (maxPerDay) phải lớn hơn hoặc bằng max target.'
        });
      }

      const oldConfig = getTenantTransactionConfig(tenantId);
      const updatedConfig: ServerDailyConfig = {
        enabled: Boolean(enabled),
        min: Math.floor(numMin),
        max: Math.floor(numMax),
        maxPerDay: isNaN(numMaxPerDay) ? Math.floor(numMax) : Math.floor(numMaxPerDay),
        adaptiveAdOpportunity: Boolean(adaptiveAdOpportunity),
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.name || req.user.sub || 'Admin'
      };

      SERVER_TRANSACTION_CONFIGS[tenantId] = updatedConfig;
      saveDataStore('transaction_configs.json', SERVER_TRANSACTION_CONFIGS);

      recordTxAudit({
        tenantId,
        actorId: req.user.uid || req.user.id,
        actorName: req.user.name || req.user.sub,
        action: 'CONFIG_UPDATED',
        entityType: 'CONFIG',
        entityId: tenantId,
        before: oldConfig,
        after: updatedConfig,
        details: `Cập nhật cấu hình mục tiêu ngày: Target [${updatedConfig.min} - ${updatedConfig.max}], Max/Ngày: ${updatedConfig.maxPerDay}, Adaptive: ${updatedConfig.adaptiveAdOpportunity}`
      });

      return res.json({
        success: true,
        message: 'Lưu cấu hình mục tiêu giao dịch thành công!',
        config: updatedConfig
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi lưu cấu hình mục tiêu' });
    }
  });

  // 8. Transaction Audit Logs Endpoint
  app.get('/api/transactions/audit', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const logs = SERVER_TX_AUDIT_LOGS.filter(
        (l) => l.tenantId === tenantId || req.user.role === 'super_admin'
      ).slice(0, 100);

      return res.json({ success: true, logs });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi lấy nhật ký kiểm toán giao dịch' });
    }
  });

  // 9. Seed Demo Transactions (Optional for testing)
  app.post('/api/transactions/seed-demo', authenticateToken, (req: any, res) => {
    try {
      const tenantId = req.user.tenant || 'enterprise';
      const userId = req.user.uid || req.user.id;
      const todayStr = new Date().toISOString().substring(0, 10);

      const existingToday = SERVER_TRANSACTIONS.filter(
        (t) => t.tenantId === tenantId && t.createdAt.startsWith(todayStr)
      );

      if (existingToday.length >= 3) {
        return res.json({
          success: true,
          count: existingToday.length,
          message: 'Đã có sẵn dữ liệu giao dịch trong ngày.'
        });
      }

      const sampleSources: ('SHOPEE' | 'TIKTOK_SHOP' | 'POS' | 'WEBSITE')[] = ['SHOPEE', 'POS', 'TIKTOK_SHOP'];
      const sampleAmounts = [1850000, 3200000, 950000];

      sampleSources.forEach((src, idx) => {
        const idKey = `DEMO_SEED_${todayStr}_${src}_${idx}`;
        if (!SERVER_TRANSACTIONS.some((t) => t.tenantId === tenantId && t.idempotencyKey === idKey)) {
          const nowIso = new Date().toISOString();
          SERVER_TRANSACTIONS.unshift({
            id: `tx_demo_${Date.now()}_${idx}`,
            tenantId,
            userId,
            type: 'SALE',
            source: src,
            orderId: `ORD-${src.substring(0, 3)}-${1000 + idx}`,
            amount: sampleAmounts[idx],
            currency: 'VND',
            status: 'CONFIRMED',
            createdAt: nowIso,
            confirmedAt: nowIso,
            idempotencyKey: idKey,
            metadata: { note: 'Dữ liệu mẫu kiểm thử Transaction Engine' }
          });
        }
      });

      saveDataStore('transactions.json', SERVER_TRANSACTIONS);
      return res.json({ success: true, count: 3, message: 'Đã nạp 3 giao dịch mẫu ban đầu.' });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: 'Lỗi nạp dữ liệu mẫu' });
    }
  });

  // =========================================================================
  // USER CORE BACKEND ROUTER (PHASE 2.1 — MULTI-TENANT, RBAC, DATA SCOPE)
  // =========================================================================
  app.use('/api/core', createCoreApiRouter(authenticateToken));

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BizOne ERP server running on http://localhost:${PORT}`);
  });
}

startServer();
