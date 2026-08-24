import fs from 'node:fs/promises';
import path from 'node:path';
import { dbQuery, closeDb } from './client.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for db:migrate');
    process.exit(1);
  }

  const schema = await fs.readFile(path.resolve(process.cwd(), 'backend/db/schema.sql'), 'utf8');
  await dbQuery(schema);
  console.log('[DB] PostgreSQL schema applied successfully.');
}

main().catch((error) => {
  console.error('[DB] Migration failed:', error);
  process.exitCode = 1;
}).finally(() => closeDb().catch(() => undefined));
