# 🎱 Snooker Money Tracker

**A Thai snooker money-tracking PWA** — score live snooker frames with friends, settle debts automatically, and never argue over who owes what again.

Built on the classic Thai club rule of **"eat the one you bet on"**: each player scores points, and the money value of those points is paid *by that player's target*. Since targets form a cycle, the table always sums to zero — and our settlement optimizer collapses the whole session down to at most `(n − 1)` transfers.

> **Author:** Metha · **Stack:** Next.js 15 · TypeScript · TailwindCSS v4 · Zustand · Supabase

---

## ✨ Features

### Game Modes
- **Point Count** — official snooker point values (red 1, yellow 2, green 3, brown 4, blue 5, pink 6, black 7).
- **Ball Count** — red/colors count as 1, pink & black count as 2 (a faster money-oriented scoring style).
- **Fouls & snooker** — foul penalties (−4 points, −2 balls), snooker misses (−2) and snooker hits (+1).

### Target-Player Money Engine
- Each player scores **against their target** (player *i* is paid into by player *i − 1* mod *n*) — matching the "1 scores against 3" Thai convention.
- **Money per point** or **money per ball** with a configurable `฿` rate.
- **Minimal-transfer settlement optimizer** — greedy largest-debtor → largest-creditor matching produces at most `(n − 1)` transfers.
- Running balance per player accumulates across frames in a session.

### Live Scoring
- **2–8 player** sessions with turn rotation (forward or reverse), manual shooter override, skip player.
- **Break tracking** — live current & highest break per player and per frame.
- **Undo / Redo** — walk back any pot, foul, snooker event with full state restoration.
- **Sessions with multiple frames** — end a frame, start a new one, keep the running balance.
- **Realtime multiplayer** via Supabase — sync frames, events, and payments live across devices.

### History, Stats & Export
- **History timeline** — every event is logged with a timestamp and frame grouping.
- **Stats dashboard** — frames won, money earned/lost, highest break (lifetime), sessions.
- **Export** — session + stats to **PNG / PDF / CSV / JSON**.
- **Settlement view** — who pays whom, how much, with paid/partial/pending tracking.

### Platform
- **PWA** — install on iPhone via Safari → *Share → Add to Home Screen*.
- **Offline-capable** local Zustand persistence (state survives reloads & refreshes).
- **Vercel-deploy-ready**.

---

## 🧰 Tech Stack

| Layer        | Tech |
|--------------|------|
| Framework    | Next.js **15** (App Router), React 19 |
| Language     | TypeScript |
| Styling      | TailwindCSS **v4** (`@theme`, CSS-first config) |
| UI           | shadcn/ui components (Button, Card) |
| Animation    | Framer Motion |
| Icons        | lucide-react |
| State        | Zustand **5** (persist middleware) |
| Backend      | Supabase (PostgreSQL + realtime Realtime) |
| Data parsing | Zod + react-hook-form + @hookform/resolvers |
| Charts       | Recharts |
| PWA          | next-pwa |
| Forms util   | class-variance-authority, clsx, tailwind-merge, tw-animate-css |

---

## 🎨 Theme — "Emerald Noir"

A dark felt-and-money aesthetic designed for low-light table-side use.

| Token | Value | Use |
|-------|-------|-----|
| Background | `#050505` | page canvas |
| Primary (emerald) | `#16C784` | actions, highlights, winning states |
| Gold | `#F59E0B` | winnings, money, highlights |
| Surface | `#101312` | elevated panels |
| Card | `rgba(18,18,18,0.68)` | glassmorphism cards |
| Foreground | `#F3F7F4` | text |
| Danger | `#EF4444` | losses, fouls |
| Radius | `24px` | cards / `.glass` |
| Font | Inter / system (`SF Pro`) | |

Glassmorphism utilities: `.glass` (blur 20px, saturate 160%), `.glass-strong` (blur 28px, saturate 180%), `.glow-emerald`, `.glow-gold`. iPhone safe-area utilities (`.safe-top`, `.safe-bottom`, `.pt-safe`, `.pb-safe`) are defined for the notched display.

---

## 🚀 Quick Start

### Prerequisites
- Node.js **18.18+** (Next.js 15 requirement)
- npm **9+**
- A Supabase project (optional for local-only play; required for realtime sync)

### 1. Install dependencies

```bash
cd ~/projects/snooker-money-tracker
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works fully offline/local using the built-in Zustand persistence — **no database is required to score frames and settle money** in a single device.

### 3. Build for production / start

```bash
npm run build     # type-checks + production build (PWA service worker is generated)
npm run start     # serves the production build
```

```bash
npm run lint      # eslint
```

---

## ☁️ Supabase Setup (Summary)

For **realtime multiplayer**, create a Supabase project and run the SQL in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → run the full schema script (tables, RLS, indexes, realtime publication).
3. Copy project **URL** + **anon key** from **Project Settings → API**.
4. Enable realtime on the `frames`, `events`, and `payments` tables (the schema script does this automatically).
5. Add the two env vars below.

**Anonymous auth note:** the app uses **anonymous sign-in** (`anon` key) so a friend installing the PWA can join a session without an account. Row-Level Security policies are scoped to `anon` and keyed on the Supabase `auth.uid()` of the anonymous user, so each person can only access their own rooms/data.

> Use the `anon` key in the browser **only**. Never expose the `service_role` key client-side. See `SUPABASE_SETUP.md` for full details.

---

## 🔐 Environment Variables

Create a `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes (realtime mode) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes (realtime mode) | Public anon key (safe for the browser) |

`.gitignore` already excludes `.env*` — secrets stay out of version control. Restart the dev server after changing these.

**Local-only mode:** skip env vars entirely — the store persists to `localStorage` and the app degrades gracefully to single-device scoring.

---

## ☁️ Deploy to Vercel

```bash
npm i -g vercel
vercel          # first time: link the project, use a Vercel account
vercel           # preview deploy
vercel --prod   # production deploy
```

Or push to GitHub and **Import** the repo in the Vercel dashboard (Vercel auto-detects Next.js).

1. In Vercel **Project → Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Leave build settings at defaults (Vercel detects `next build` automatically).
3. Set an alias/domain if desired.

---

## 📱 Install on iPhone (PWA)

1. Open the deployed(or `npm run dev`) URL in **Safari** (not Chrome).
2. Tap **Share** (the square-with-arrow icon).
3. Tap **Add to Home Screen**.
4. Name it (e.g., *Snooker Money*), tap **Add**.

It installs as a standalone app with its own icon. Because the app persists state locally (Zustand + `localStorage`) and is served with a service worker (next-pwa), it launches and scores **even without a network** — realtime sync reconnects when online.

> For the website to be installable and offline-ready the PWA manifest, service worker, and an installable icon must be present. `next-pwa` handles the service worker; ensure the manifest/web app meta (theme color `#050505`, `#16C784` primary) is configured in `src/app/manifest.ts` (or `public/manifest.json`).

---

## 📁 Project Structure (Overview)

```
snooker-money-tracker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # root layout, fonts, metadata
│   │   ├── globals.css         # Tailwind v4 theme, glass utilities
│   │   └── page.tsx            # home route
│   ├── components/             # shadcn/ui primitives
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── lib/                    # pure logic (no React)
│   │   ├── rules.ts            # point values, ball order, target cycle
│   │   ├── money.ts            # money engine, settlement optimizer
│   │   └── utils.ts            # cn(), formatMoney(), uid()
│   ├── store/
│   │   └── gameStore.ts        # Zustand store (persist)
│   ├── types/
│   │   └── index.ts            # domain types
│   └── supabase/               # client + service modules (realtime)
│       ├── client.ts
│       └── services/…
├── public/                     # static assets, PWA icons
├── next.config.ts
├── tsconfig.json
└── .env.local                  # (gitignored)
```

See **[`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md)** for the full architectural walkthrough and **[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)** for the database setup.

---

## 📄 License

Private / personal project by **Metha**. Reuse at your own discretion.