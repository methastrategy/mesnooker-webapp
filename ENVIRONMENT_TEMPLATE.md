# Environment Variables — Mesnooker

The application is architected to operate in **100% Offline-First / Guest Mode** out-of-the-box with zero configuration required. All match scoring, target cycle money calculation, and PromptPay EMVCo QR code generation work immediately via browser LocalStorage.

Database configuration is required only if you wish to enable the optional **Cloud Accounts & Identity** system.

---

## Production Variables

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | Optional | Neon Postgres connection string with serverless pooler (`@neondatabase/serverless`) |
| `AUTH_SECRET` | Optional* | 32+ character random secret string used to sign HTTP-Only JWT session cookies (*required if `DATABASE_URL` is set) |

---

## Setting up on Vercel

```bash
# Add Neon database connection string
vercel env add DATABASE_URL production

# Add Auth Secret
vercel env add AUTH_SECRET production
```
