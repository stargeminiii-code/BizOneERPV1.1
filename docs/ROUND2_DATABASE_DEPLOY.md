# BizOne ERP — Round 2 Database/Auth deployment

## Scope
Round 2 moves the customer registration, approval, login, password reset, session persistence and 7-day trial subscription flow to PostgreSQL while leaving the existing ERP UI/business APIs intact.

## Render
Set the Web Service Build Command to:

```bash
bun install && bun run db:migrate && bun run db:seed && bun run build
```

Start Command:

```bash
bun run start
```

Required environment variables on Render:

- `DATABASE_URL` — Render PostgreSQL connection string
- `JWT_SECRET` — random server-only secret, minimum 32 characters
- `SUPER_ADMIN_PHONE`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_INITIAL_PASSWORD`
- Existing email/SMS provider variables when OTP delivery is enabled

Do not put any of these values in source code, `.env` committed to Git, React/Vite variables, or frontend data files.

## Round 2 behavior

1. Customer registers -> PostgreSQL `tenants` + `users` are created with `pending` status.
2. Super Admin approves -> tenant/user become `active`.
3. Approval creates a `TRIAL_7_DAYS` subscription with 7 days and max 3 users.
4. Customer login reads the PostgreSQL user, not the old JSON repository.
5. Password reset OTP hashes are stored in PostgreSQL. OTP plaintext is never returned to the browser.
6. Password reset revokes all existing DB sessions.
7. Expired subscriptions are returned as `readOnly: true` by the DB login endpoint so the frontend can show the renewal state.

## Important limitation

This is a compatibility migration. The legacy `server.ts` repository still exists for ERP business endpoints and old demo data. Round 3 should migrate the remaining User/Role/2FA/Audit and ERP domain repositories to PostgreSQL and remove the legacy JSON/in-memory stores.
