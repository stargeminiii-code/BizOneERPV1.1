import { dbQuery } from './client.js';

export async function databaseHealth() {
  if (!process.env.DATABASE_URL) {
    return { configured: false, connected: false };
  }

  try {
    await dbQuery('SELECT 1');
    return { configured: true, connected: true };
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return { configured: true, connected: false };
  }
}
