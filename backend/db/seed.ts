import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { dbQuery, closeDb } from './client.js';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for db:seed`);
  return value;
}

async function main() {
  const phone = required('SUPER_ADMIN_PHONE');
  const email = required('SUPER_ADMIN_EMAIL');
  const password = required('SUPER_ADMIN_INITIAL_PASSWORD');

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await dbQuery<{ id: string }>('SELECT id FROM users WHERE role = $1 LIMIT 1', ['super_admin']);
  if (existing.rowCount) {
    console.log('[DB] Super Admin already exists; seed skipped.');
    return;
  }

  await dbQuery(
    `INSERT INTO users
      (id, tenant_id, username, name, email, phone, password_hash, role, status, data_scope)
     VALUES ($1, NULL, $2, $3, $4, $5, $6, 'super_admin', 'active', 'ALL')`,
    [userId, phone, 'BizOne Platform Super Admin', email, phone, passwordHash],
  );

  console.log('[DB] Fresh Super Admin created. Password is stored only as a bcrypt hash.');
}

main().catch((error) => {
  console.error('[DB] Seed failed:', error);
  process.exitCode = 1;
}).finally(() => closeDb().catch(() => undefined));
