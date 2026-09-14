# Deploy to Vercel — Snooker Money Tracker Pro

Production hosting for **Snooker Money Tracker Pro** is **Vercel**. The project is a
standard Next.js 15 App Router app, so deployment is push-driven and requires no custom
server or build command.

> **Before you start**: the app builds and runs *fully offline* with no environment
> variables (Supabase realtime is optional). If you skip the env setup you still get a
> working single-player deployment; set `NEXT_PUBLIC_*` vars only when you want live
> multiplayer sync.

---

## 1. Prerequisites

- A **GitHub** account with the repo pushed and accessible (public or private; Vercel can
  read private repos when you authorize it).
- A **Vercel** account.
- *(Optional)* A **Supabase** project with the `NEXT_PUBLIC_SUPABASE_URL` + anon key if you
  want realtime multiplayer. See [ENVIRONMENT_TEMPLATE.md](./ENVIRONMENT_TEMPLATE.md).

Also confirm locally that the project builds before pushing:

```bash
npm install
npm run build        # must pass with no errors
npm run lint
```

The project builds successfully today with all routes (`/`, `/match`, `/player`,
`/history`, `/stats`, `/settlement`, `/settings`, `/about`, plus error/loading/not-found
pages).

---

## 2. Import from GitHub

1. Open [vercel.com](https://vercel.com) → **Add New… → Project**.
2. **Import** your repository (`snooker-money-tracker`) from GitHub. Authorize Vercel to
   access it when prompted.
3. Vercel detects the framework automatically.
4. Configure the project (see below), then click **Deploy**.

### Framework preset

Vercel's auto-detection sets:

- **Framework Preset**: `Next.js`
- **Build Command**: `next build` (default — leave as-is)
- **Output Directory**: `Next.js` (default — leave as-is)
- **Install Command**: `npm install` (default — leave as-is)
- **Node.js Version**: use a Node 18+ LTS (Next 15 requires Node ≥ 18.18).

Do **not** override the build/output commands; the project ships a stock
`next.config.ts` (`reactStrictMode: true`, no `output: export`), so deployment uses Vercel's
standard Next.js server for App Router + PWA.

---

## 3. Set Environment Variables

> `NEXT_PUBLIC_*` vars are baked into the client bundle at **build time**. After changing
> them you must trigger a **new production build** (redeploy), not just a runtime change.

### Via the Vercel dashboard (recommended)

1. In your project → **Settings → Environment Variables**.
2. Add each variable for the **Production** (and **Preview**, **Development**) environment:
   - `NEXT_PUBLIC_SUPABASE_URL` — `https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your **anon** (publishable) key, *not* the
     `service_role` key — see [ENVIRONMENT_TEMPLATE.md](./ENVIRONMENT_TEMPLATE.md).
3. Click **Save**, then trigger a redeploy (**Deployments → Redeploy** or push a commit).

### Via `vercel` CLI

```bash
npm i -g vercel
vercel login
vercel link          # link the CLI to your project
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

---

## 4. Automatic Deploys (push-to-deploy)

- Pushing to the **production branch** (`main` / `master`) triggers a **Production** deploy.
- Pushing to any **other branch** creates a **Preview** deployment with a unique URL
  (great for PR review).
- Each commit that touches the repo redeploys automatically; framework caching keeps
  `npm install` + `next build` incremental.
- Deploy logs and inspect output are streamed live in the Vercel dashboard under
  **Deployments**.

---

## 5. Manual / CLI Deploy

```bash
# One-off production deploy from the current branch
vercel deploy --prod
```

- Add `--yes` to skip interactive prompts in CI.
- For CI pipelines, set a `VERCEL_TOKEN` env var and use the Vercel GitHub Action, or:
  ```bash
  npx vercel --token $VERCEL_TOKEN --prod --yes
  ```

---

## 6. Domain Setup

1. In the dashboard: project → **Settings → Domains**.
2. **Add** your domain (`example.com`, `www.example.com`).
3. Follow Vercel's DNS instructions at your registrar:
   - **Apex** (`example.com`): add an `A` record pointing to `76.76.21.21`.
   - **`www`**: add a `CNAME` record `www` → `<project>.vercel.app`.
   - (Optional) enable automatic `www` → apex redirect in the Domains panel.
4. HTTPS is provisioned automatically (Let's Encrypt) once DNS propagates.
5. Update your Supabase project's **Auth → URL Configuration → Site URL / Redirect
   URLs** to include the production domain.

---

## 7. Post-deploy Checklist

- [ ] `vercel.app` (or custom domain) loads with the dark Emerald Noir UI.
- [ ] Airplane/offline check: reload with DevTools offline → the PWA shell still shows
      (see [PWA_SETUP.md](./PWA_SETUP.md)).
- [ ] If Supabase configured: create a session → a second device in the same room sees
      changes live.
- [ ] PWA installability: Lighthouse PWA checks pass; manifest + icons served from `/`.
- [ ] `curl -I https://<your-domain>/` returns `200`; `/manifest.webmanifest` returns
      `application/manifest+json`.
- [ ] DNS: `A`/`CNAME` records propagate; HTTPS valid in the browser.
- [ ] Build & lint pass in CI/deploy logs with **no** red steps.

---

## Troubleshooting

- **"Module not found" / build error** → run `npm install && npm run build` locally; a
  local green build almost always fixes the deploy.
- **Realtime not working in production** → confirm both `NEXT_PUBLIC_*` vars are set for the
  **Production** env and a redeploy happened *after* the change; also verify the Supabase
  RLS policies allow anon access (see `DATABASE_SCHEMA.sql`).
- **Env var shows but app ignores it** → `NEXT_PUBLIC_*` is client-side; you must redeploy,
  not just save the variable.
- **Stale PWA cache after deploy** → the service worker caches aggressively; hard-reload
  once, or see the cache-bump note in [PWA_SETUP.md](./PWA_SETUP.md).