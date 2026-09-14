# Environment Variables — Snooker Money Tracker Pro

This project has exactly **two** environment variables, both optional. The app is
designed to run **completely offline / local-only** when they are empty, and to enable
**Supabase realtime multiplayer** when they are set.

Copy `.env.example` to `.env.local` to get started:

```bash
cp .env.example .env.local
```

---

## Variables

| Variable                      | Required | Purpose |
| ----------------------------- | -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL`    | no       | The URL of your Supabase project, e.g. `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no     | The publishable **anon** key from the Supabase dashboard |

> Both are prefixed `NEXT_PUBLIC_` because they are used **client-side** (Supabase
> `createClient` runs in the browser via `src/lib/supabase.ts`). That means they are
> baked into the JS bundle at **build time**.

### `.env.example`

```bash
# Required to enable Supabase realtime multiplayer. Leave empty for offline-only mode.
# Copy to .env.local and fill in your Supabase project credentials.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Offline mode vs. Realtime

The client factory in `src/lib/supabase.ts` returns `null` when **either** variable is
missing:

```ts
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: true }, realtime: { params: { eventsPerSecond: 20 } } });
}
```

- **Offline-only**: both vars empty → `getSupabase()` returns `null`,
  `supabaseConfigured()` is `false`. The app runs fully locally (Zustand store in memory),
  room creation falls back to a local share-code, and the realtime hooks no-op.
- **Realtime**: both set → the `useRealtime` hook
  (`src/hooks/useRealtime.ts`) subscribes to Postgres changes on a room channel
  (`snooker-room:<code>`) with a **maximum of 20 events/second**.

So you can develop, demo, and even ship a single-player build with **zero config** — the
Supabase integration is a pure optional upgrade for cross-device score sync.

---

## How to get the values from Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the project dashboard → **Project Settings → API**.
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (format `https://<project-ref>.supabase.co`)
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `anon`/`publishable` key,
     *never* `service_role` — `service_role` bypasses RLS and must not ship in the bundle).
4. Apply the schema from `DATABASE_SCHEMA.sql` (SQL Editor → run) and make sure the
   RLS policies allow anon row access on the tables you sync (see the schema's RLS section).
5. Optionally switch on **Realtime** for the relevant tables (Realtime → toggle the tables
   you subscribe to) and set **Auth → URL Configuration → Site URL** to your deployed domain.

### Local `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

Restart the dev server after editing (these are read at build/boot time).

---

## How to assign in Vercel

1. Project → **Settings → Environment Variables**.
2. Add both variables (Production; add to Preview/Development too if you want realtime in
   preview). Paste the same anon key.
3. **Save**, then **redeploy** — because they're `NEXT_PUBLIC_*`, the running server won't
   pick up changes until a new production build runs.

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for the full workflow and checklist.

---

## Security notes

- Only ever use the **anon** key client-side. Rotate / keep the `service_role` key secret.
- `NEXT_PUBLIC_*` vars are visible in the browser bundle by design — never put secrets there.
- Supabase **Row Level Security** must be enabled and policies permissive for `anon` so
  realtime rows are readable; the published schema documents the recommended policies.
- If a variable is missing, the app silently degrades to offline mode — it never crashes.