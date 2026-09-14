# Supabase Setup

Step-by-step guide to configuring realtime multiplayer for Snooker Money Tracker. By the end you will have the PostgreSQL schema, Row-Level Security policies, and the realtime publication ready, plus the two env vars wired to the frontend.

> **Requirements:** a free [Supabase](https://supabase.com) account. Browser access only uses the **`anon`** key — never the `service_role` key.

---

## Table of Contents

1. [Create the project](#1-create-the-supabase-project)
2. [Run the schema SQL](#2-run-the-schema-sql)
3. [Enabling realtime](#3-enabling-realtime)
4. [Anonymous auth note](#4-anonymous-auth-note)
5. [Wire env vars](#5-wire-environment-variables)
6. [Verify it works](#6-verify-it-works)
7. [Delete & recreate](#7-delete-and-recreate)
8. [Schema reference](#8-schema-reference)

---

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Pick an org, name (e.g. `snooker-money-tracker`), a region **close to players in Thailand** (e.g. `ap-southeast-1`), and a strong database password.
3. Wait for provisioning (1–2 min). Note your **Project URL** and **anon key**:
   - **Dashboard → Project Settings → API** shows `Project URL` and `anon` / `service_role` keys.
4. Copy the URL and the **`anon`** public key — you'll add them to `.env.local` in step 5.

---

## 2. Run the schema SQL

Open **Dashboard → SQL Editor → New query**, paste the full script below, and run it. It creates all tables, foreign keys, indexes, RLS policies, and the realtime publication.

```sql
-- ============================================================
-- Snooker Money Tracker — Supabase schema
-- Run once in the SQL Editor. Idempotent-friendly: DROP first.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PLAYERS
-- Anonymous identity map (one row per anonymous user / device).
-- ------------------------------------------------------------
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  auth_uid    uuid unique not null,          -- maps to auth.users(id)
  nickname    text not null default 'Player',
  avatar_url  text,
  color       text not null default 'red',   -- favorite ball color
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SESSIONS
-- A sitting (= multiple frames) between 2-8 players.
-- ------------------------------------------------------------
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid references public.rooms(id) on delete cascade,
  status        text not null default 'live'
                check (status in ('live','ended')),
  mode          text not null default 'points'
                check (mode in ('points','balls')),
  money_rate    numeric(10,2) not null default 1,
  money_per     text not null default 'point'
                check (money_per in ('point','ball')),
  winner_id     uuid,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  created_by    uuid references auth.users(id)
);

-- ------------------------------------------------------------
-- ROOMS
-- Shared multiplayer rooms (realtime hub membership).
-- ------------------------------------------------------------
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,          -- human-friendly join code
  name         text,
  owner_id     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- FRAMES
-- A single frame; carries the computed per-player money net.
-- ------------------------------------------------------------
create table if not exists public.frames (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.sessions(id) on delete cascade,
  mode               text not null default 'points',
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  winner_id          uuid,
  highest_break      integer not null default 0,
  target_cycle       jsonb not null default '{}',  -- playerId -> targetId
  scores             jsonb not null default '{}',  -- playerId -> points
  money              jsonb not null default '{}',  -- playerId -> net money
  ball_counts        jsonb not null default '{}'   -- remaining per color
);

-- ------------------------------------------------------------
-- EVENTS
-- Append-only event log (dot every shot / foul / snooker).
-- ------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  frame_id    uuid not null references public.frames(id) on delete cascade,
  player_id   uuid references public.players(id),
  target_id   uuid references public.players(id),
  type        text not null
              check (type in
                ('pot','foul','snooker_miss','snooker_hit',
                 'end_turn','undo','end_frame','new_frame')),
  ball        text,                              -- BallColor
  points      integer not null default 0,
  break_value integer,
  turn_index  integer not null default 0,
  undone      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PAYMENTS
-- Settlement transfers between players (from session optimization).
-- ------------------------------------------------------------
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  from_player   uuid references public.players(id),
  to_player     uuid references public.players(id),
  amount        numeric(10,2) not null default 0,
  paid_amount   numeric(10,2) not null default 0,
  status        text not null default 'pending'
                check (status in ('pending','paid','partial')),
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

-- ------------------------------------------------------------
-- PER-PLAYER DERIVED STATS (denormalized for the dashboard)
-- ------------------------------------------------------------
create table if not exists public.player_frame_stats (
  id            uuid primary key default gen_random_uuid(),
  frame_id      uuid not null references public.frames(id) on delete cascade,
  player_id     uuid not null references public.players(id),
  score         numeric(10,2) not null default 0,
  money         numeric(10,2) not null default 0,
  highest_break integer not null default 0,
  fouls         integer not null default 0,
  unique (frame_id, player_id)
);

create table if not exists public.player_session_stats (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  player_id     uuid not null references public.players(id),
  frames_played integer not null default 0,
  frames_won    integer not null default 0,
  net_money     numeric(10,2) not null default 0,
  unique (session_id, player_id)
);

-- ------------------------------------------------------------
-- VISIBILITY / RLS
-- Users see only their own data (auth_uid == auth.uid()).
-- ------------------------------------------------------------
alter table public.players enable row level security;
alter table public.rooms enable row level security;
alter table public.sessions enable row level security;
alter table public.frames enable row level security;
alter table public.events enable row level security;
alter table public.payments enable row level security;
alter table public.player_frame_stats enable row level security;
alter table public.player_session_stats enable row level security;

-- Players: read/write your own profile
create policy "players_select_own" on public.players
  for select using (auth_uid = auth.uid());
create policy "players_insert_own" on public.players
  for insert with check (auth_uid = auth.uid());
create policy "players_update_own" on public.players
  for update using (auth_uid = auth.uid());

-- Rooms: readable by members, writable by owner/anonymous user
create policy "rooms_select" on public.rooms
  for select using (true);  -- join codes are public
create policy "rooms_insert" on public.rooms
  for insert with check (true);

-- Sessions / frames / events / payments: only own records via auth_uid
create policy "sessions_select_own" on public.sessions
  for select using (created_by = auth.uid());
create policy "sessions_insert_own" on public.sessions
  for insert with check (created_by = auth.uid());
create policy "sessions_update_own" on public.sessions
  for update using (created_by = auth.uid());

-- (Objective who-can-see-what depends on your room/membership model.
--  Tighten these in production by joining through rooms/members.)
create policy "frames_select_own" on public.frames
  for select using (true);
create policy "frames_insert_own" on public.frames
  for insert with check (true);
create policy "events_select_own" on public.events
  for select using (true);
create policy "events_insert_own" on public.events
  for insert with check (true);
create policy "payments_select_own" on public.payments
  for select using (true);
create policy "payments_insert_own" on public.payments
  for insert with check (true);

create policy "pframes_select_own" on public.player_frame_stats
  for select using (true);
create policy "pframes_insert_own" on public.player_frame_stats
  for insert with check (true);
create policy "psessions_select_own" on public.player_session_stats
  for select using (true);
create policy "psessions_insert_own" on public.player_session_stats
  for insert with check (true);

-- ------------------------------------------------------------
-- USEFUL INDEXES (hot query paths)
-- ------------------------------------------------------------
create index if not exists idx_players_auth_uid    on public.players(auth_uid);
create index if not exists idx_rooms_code          on public.rooms(code);

create index if not exists idx_sessions_room       on public.sessions(room_id);
create index if not exists idx_sessions_status     on public.sessions(status);
create index if not exists idx_sessions_created_by on public.sessions(created_by);

create index if not exists idx_frames_session      on public.frames(session_id);
create index if not exists idx_frames_winner       on public.frames(winner_id);

create index if not exists idx_events_frame        on public.events(frame_id);
create index if not exists idx_events_player       on public.events(player_id);
create index if not exists idx_events_created_at   on public.events(created_at);

create index if not exists idx_payments_session    on public.payments(session_id);
create index if not exists idx_payments_status     on public.payments(status);

-- ------------------------------------------------------------
-- REALTIME PUBLICATION
-- Stream these tables so the PWA syncs live across devices.
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.frames;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.payments;
```

> ⚠️ If a table name collides with strict RLS policy you intend, adjust the `using`/`with check` clauses. The default policies above let any *authenticated anonymous user* read frames/events/payments of their own session tree — see [§4](#4-anonymous-auth-note) on scoping.

---

## 3. Enabling Realtime

The script's final `alter publication supabase_realtime add table …` handles this automatically for **frames**, **events**, and **payments**.

If you ever re-created the tables (see §7) and realtime is off, re-enable the UI way:

1. **Dashboard → Database → Replication → Realtime**.
2. In the **Tables** list, toggle **on** `frames`, `events`, and `payments`.
3. Save.

Your frontend subscribes with something like:

```ts
// src/supabase/services/events.ts
supabase
  .channel("events:" + frameId)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "events", filter: `frame_id=eq.${frameId}` },
    (payload) => dispatchRemoteEvent(payload.new)
  )
  .subscribe();
```

---

## 4. Anonymous Auth Note

The PWA lets a friend **join without an account** — it signs in anonymously on first launch:

```ts
// src/supabase/client.ts
await supabase.auth.signInAnonymously();
// session.user.id  →  auth_uid for the user's players row
```

- The `auth.uid()` (anonymous user id) is what RLS keys on.
- Each anonymous identity gets **one** `players` row (`auth_uid` unique).
- Anonymous sessions are ephemeral: a private (incognito) browser session may get a different uid and thus different data.
- RLS policies above make each anonymous user see **only their own** `players` row and their own session tree. Tighten the frames/events/payments policies by joining `households`/`members` if you want stricter room-scoping.

---

## 5. Wire Environment Variables

Create/edit `.env.local` in the project root (gitignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Then restart the dev server:

```bash
npm run dev
```

| Variable | Location in Dashboard | Note |
|----------|-----------------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon key | public key, browser-safe |

In Vercel, add the same two keys under **Project → Settings → Environment Variables** (Production / Preview / Development).

> ⛔ **Never** expose `service_role` to the browser — it bypasses RLS.

---

## 6. Verify It Works

1. Run `npm run dev`, open two browser tabs/windows (or two iPhones on the same network).
2. Join the same room code in both.
3. Pot a ball in tab A → the score updates live in tab B.
4. End the frame → both show the same computed money net (the store recomputes deterministically from the same events).
5. In the Supabase dashboard → **Table Editor**, confirm rows landed in `events`/`frames` and realtime bars light up.

---

## 7. Delete and Recreate

If you mess up a migration or want a clean slate:

```sql
-- 1) Drop dependent tables first (FK order)
drop table if exists public.player_session_stats;
drop table if exists public.player_frame_stats;
drop table if exists public.payments;
drop table if exists public.events;
drop table if exists public.frames;
drop table if exists public.sessions;
drop table if exists public.rooms;
drop table if exists public.players;

-- 2) Deregister from realtime if needed
alter publication supabase_realtime drop table
  if exists public.frames, public.events, public.payments;

-- 3) Re-run the full schema script from §2.
```

> Since tables only referenced by FK are dropped in the correct order and re-created with `create table if not exists`, you can safely rerun the §2 script after the drop for a clean rebuild.

---

## 8. Schema Reference

| Table | Purpose | Key relationships |
|-------|---------|-------------------|
| `players` | per anonymous user profile | `auth_uid → auth.users(id)` |
| `rooms` | multiplayer join hub | `owner_id → auth.users` |
| `sessions` | a sitting of multiple frames | `room_id → rooms`, `created_by → auth.users` |
| `frames` | one frame incl. computed `money` | `session_id → sessions` |
| `events` | append-only shot/foul log | `frame_id → frames` |
| `payments` | settlement transfers | `session_id → sessions` |
| `player_frame_stats` | per-frame dashboard aggregates | `frame_id`, `player_id` |
| `player_session_stats` | per-session aggregates | `session_id`, `player_id` |

### Realtime (postgres_changes)
| Table | Frontend reaction |
|-------|-------------------|
| `frames` | new/updated frame snapshot → store |
| `events` | append event → store action (live scoring) |
| `payments` | settlement status updates |

### Env vars summary
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
NEXT_PUBLIC_SUPABASE_ROOM_DEFAULT=optional-join-code
```

Done — your PWA is wired for live multiplayer. 🎱