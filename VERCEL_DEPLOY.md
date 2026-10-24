# Deploy to Vercel — Mesnooker

Production hosting for **Mesnooker** is configured for **Vercel** with Singapore edge region (`sin1` in `vercel.json`).

The application is fully **Offline-First**: it builds and runs with complete scoring, settlement, and PromptPay QR capabilities even with zero environment variables configured.

---

## 1. Quick Local Verification

```bash
npm run test        # Vitest: 76/76 unit tests
npx playwright test # Playwright: 11/11 E2E multi-device tests
npm run build       # Next.js: 21 static routes compiled
```

---

## 2. Deploy via GitHub Integration

1. Push your changes to the `main` branch:
   ```bash
   git push origin main
   ```
2. Open your [Vercel Dashboard](https://vercel.com).
3. Import or trigger deploy on repository `mesnooker`.
4. Configure Environment Variables in **Project Settings → Environment Variables**:
   - `DATABASE_URL` = your Neon PostgreSQL connection string
   - `AUTH_SECRET` = your random 32+ character JWT secret
5. Deploy to Production.
