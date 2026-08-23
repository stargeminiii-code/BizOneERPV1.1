# BizOne Backend / PostgreSQL — Round 1

Round 1 adds a PostgreSQL foundation without rewriting the existing ERP UI or business modules.

## Production flow

`wiup.vn` → `api.wiup.vn` → Node/Express → PostgreSQL

## Environment

Required on the backend host only:

- `DATABASE_URL`
- `JWT_SECRET`
- `SUPER_ADMIN_PHONE`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_INITIAL_PASSWORD`

Never expose these as `VITE_*` variables and never commit `.env`.

## Fresh database

This round intentionally starts with an empty production database. Existing demo JSON/in-memory data is not migrated.

Run after the database is created:

```bash
npm install
npm run db:migrate
npm run db:seed
```

`db:seed` creates exactly one `super_admin` if none exists. The password is bcrypt-hashed and is never stored in plaintext in the database.

## Schema

Initial tables:

- `tenants`
- `users`
- `subscriptions`
- `sessions`
- `otp_codes`
- `audit_logs`
- `schema_migrations`

ERP business tables are intentionally deferred to Round 3 so the current ERP is not rewritten prematurely.

## Render

Set the service environment variables in Render. Do not paste secret values into GitHub files.

For the first database connection, set `DATABASE_URL` to the PostgreSQL provider's connection string and keep `DB_SSL=true` for managed PostgreSQL.

The Render service is configured as a free web service in `render.yaml`; it can later be upgraded without changing the application architecture.
