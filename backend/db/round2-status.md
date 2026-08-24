# Round 2 status

Implemented on branch `backend-db-foundation-round1`:

- PostgreSQL-backed customer registration.
- Pending tenant/user records before approval.
- Super Admin approval persisted in PostgreSQL.
- Automatic 7-day trial subscription on approval.
- PostgreSQL-backed customer login.
- PostgreSQL-backed password reset OTP storage.
- PostgreSQL-backed session creation and revocation on password reset.
- Compatibility server entrypoint so existing ERP routes remain in `server.ts`.
- Render build/deploy instructions.

Not yet migrated in Round 2:

- Existing ERP business-domain JSON stores.
- Legacy `SERVER_USERS` repository used by non-auth ERP endpoints.
- Legacy TOTP/2FA routes.
- Full audit log migration.

These are deliberately deferred to Round 3 to keep the current ERP UI and business modules stable.
