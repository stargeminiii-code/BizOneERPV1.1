import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.warn('[DB] DATABASE_URL is not configured. PostgreSQL features remain disabled until configured.');
}

export const db = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    })
  : null;

export async function dbQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  return db.query<T>(text, values);
}

export async function closeDb(): Promise<void> {
  if (db) await db.end();
}
