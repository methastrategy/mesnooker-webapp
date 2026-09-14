-- ============================================================================
-- Snooker Money Tracker Pro — PostgreSQL schema for Supabase
--
-- Run this in the Supabase SQL Editor. It creates the full data model for
-- the app and matches the TypeScript domain types in src/types/index.ts.
--
-- Design points:
--   * UUID primary keys (gen_random_uuid()), timestamps via timestamptz.
--   * JSONB columns for the snapshot-style scores / money grids so a
--     frame's state is stored atomically (app reads them back directly).
--   * Foreign keys with sensible ON DELETE behavior (frames/events/payments
--     cascade with their session/frame; players/sessions are kept).
--   * Row Level Security enabled everywhere; anon + authenticated read and
--     write policies so the realtime hook (src/hooks/useRealtime.ts)
--     works with the publishable anon key.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- UUID helper (PG 13+ has gen_random_uuid() built in; no extension needed)
-- ---------------------------------------------------------------------------
-- gen_random_uuid() is available by default in Supabase Postgres 14+. If you
-- are on an older version, instead:
--   create extension if not exists "pgcrypto";

-- ============================================================================
-- players
-- ---------------------------------------------------------------------------
-- A snooker player participating in sessions. `color` is the BallColor the
-- player plays as (used for identity badges); `avatar` optionally references
-- an uploaded image. Lifetime stats live in player_session_stats / derived.
-- ============================================================================
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  nickname    text not null check (length(trim(nickname)) between 1 and 64),
  color       text not null default 'red',   -- red|yellow|green|brown|blue|pink|black
  avatar      text,
  created_at  timestamptz not null default now()
);
comment on table public.players is 'Snooker players that appear in sessions.';
comment on column public.players.color is 'BallColor identity of the player (red..black).';
comment on column public.players.avatar is 'Optional avatar image URL.';

-- ============================================================================
-- rooms
-- ---------------------------------------------------------------------------
-- Collaborative realtime rooms keyed by a short shareable code. The app's
-- useRoom() generates a 6-char code; when Supabase is configured, players
-- join the same room to sync live.
-- ============================================================================
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,           -- e.g. "A1B2C3"
  name        text,
  created_at  timestamptz not null default now()
);
comment on table public.rooms is 'Shareable realtime rooms for multiplayer sync.';
comment on column public.rooms.code is 'Short unique room code a player types to join.';

-- ============================================================================
-- sessions
-- ---------------------------------------------------------------------------
-- One play session (a table session). mode: points|balls; moneyRate is the
-- value per unit; moneyPer: point|ball. players is a JSONB snapshot of the
-- participating Player[] (id/nickname/color/avatar) at creation time.
-- status: live|ended.
-- ============================================================================
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.rooms(id) on delete set null,
  created_at  timestamptz not null default now(),
  mode        text not null default 'points' check (mode in ('points','balls')),
  money_rate  numeric not null default 0 check (money_rate >= 0),
  money_per   text not null default 'point' check (money_per in ('point','ball')),
  players     jsonb not null default '[]'::jsonb, -- snapshot of Player[]
  status      text not null default 'live' check (status in ('live','ended'))
);
comment on table public.sessions is 'A playing session (mode, stake, participants).';
comment on column public.sessions.players is 'JSONB snapshot of the session Player[] roster.';
comment on column public.sessions.status is 'live while frames are being played, ended after settlement.';

-- ============================================================================
-- frames
-- ---------------------------------------------------------------------------
-- A single frame/game within a session. scores and money are playerId-keyed
-- JSONB maps (scores: playerId->points; money: playerId->net money for this
-- frame). winner_id is the frame winner; highest_break caches the top break.
-- ============================================================================
create table if not exists public.frames (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  mode            text not null default 'points' check (mode in ('points','balls')),
  scores          jsonb not null default '{}'::jsonb,  -- playerId -> points
  money           jsonb not null default '{}'::jsonb,  -- playerId -> net money (frame)
  winner_id       uuid references public.players(id) on delete set null,
  highest_break   int not null default 0,
  target_cycle    jsonb not null default '{}'::jsonb   -- playerId -> targetPlayerId
);
comment on table public.frames is 'One frame of snooker within a session.';
comment on column public.frames.scores is 'JSONB map playerId -> points scored.';
comment on column public.frames.money is 'JSONB map playerId -> net money for this frame.';
comment on column public.frames.target_cycle is 'JSONB map playerId -> targetPlayerId (Thai bet cycle).';

-- ============================================================================
-- events
-- ---------------------------------------------------------------------------
-- Fine-grained log of every action in a frame (pot, foul, snooker_miss,
-- snooker_hit, end_turn, undo, end_frame, new_frame). Stores enough to replay
-- / undo. ts is a millisecond epoch to keep ordering stable across devices.
-- ============================================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  frame_id    uuid not null references public.frames(id) on delete cascade,
  player_id   uuid references public.players(id) on delete set null,
  target_id   uuid references public.players(id) on delete set null,
  type        text not null check (type in ('pot','foul','snooker_miss','snooker_hit','end_turn','undo','end_frame','new_frame')),
  ball        text,               -- red|yellow|... for pot events
  points      int not null default 0,
  ts          bigint not null,    -- epoch ms of the event
  undone      boolean not null default false
);
comment on table public.events is 'Event log for a frame (pot/foul/snooker/undo/end).';
comment on column public.events.ts is 'Millisecond epoch timestamp (stable ordering across devices).';
comment on column public.events.undone is 'True when the event was undone via the undo flow.';

-- ============================================================================
-- payments
-- ---------------------------------------------------------------------------
-- Settlement transfers between players. from_id pays to_id amount.
-- status: pending|paid|partial (partial carries paid_amount).
-- ============================================================================
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  frame_id      uuid references public.frames(id) on delete cascade, -- null = session-level settle
  from_id       uuid not null references public.players(id) on delete cascade,
  to_id         uuid not null references public.players(id) on delete cascade,
  amount        numeric not null check (amount > 0),
  paid_amount   numeric not null default 0 check (paid_amount >= 0),
  status        text not null default 'pending' check (status in ('pending','paid','partial')),
  ts            bigint not null,
  created_at    timestamptz not null default now()
);
comment on table public.payments is 'Settlement transfers (from_id pays to_id amount).';
comment on column public.payments.status is 'pending, paid, or partial (partial sets paid_amount).';

-- ============================================================================
-- player_session_stats
-- ---------------------------------------------------------------------------
-- Aggregated per-player-per-session counters (frames won, money earned/lost,
-- best break). Populated on session end / on demand.
-- ============================================================================
create table if not exists public.player_session_stats (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players(id) on delete cascade,
  session_id        uuid not null references public.sessions(id) on delete cascade,
  frames_won        int not null default 0,
  money_earned      numeric not null default 0,
  money_lost        numeric not null default 0,
  highest_break     int not null default 0,
  created_at        timestamptz not null default now(),
  unique (player_id, session_id)
);
comment on table public.player_session_stats is 'Per-player, per-session lifetime aggregates.';

-- ============================================================================
-- player_frame_stats
-- ---------------------------------------------------------------------------
-- Per-player, per-frame detail (break, fouls, snooker misses/hits, balls
-- potted) used by the stats dashboard.
-- ============================================================================
create table if not exists public.player_frame_stats (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references public.players(id) on delete cascade,
  frame_id       uuid not null references public.frames(id) on delete cascade,
  break_value    int not null default 0,
  fouls          int not null default 0,
  snooker_misses int not null default 0,
  snooker_hits   int not null default 0,
  balls_potted   int not null default 0,
  created_at     timestamptz not null default now(),
  unique (player_id, frame_id)
);
comment on table public.player_frame_stats is 'Per-player, per-frame scoring detail.';

-- ============================================================================
-- Indexes (FK lookups and common queries)
-- ============================================================================
create index if not exists idx_sessions_room_id      on public.sessions(room_id);
create index if not exists idx_sessions_status       on public.sessions(status);

create index if not exists idx_frames_session_id     on public.frames(session_id);
create index if not exists idx_frames_winner_id      on public.frames(winner_id);
create index if not exists idx_frames_ended_at       on public.frames(ended_at);

create index if not exists idx_events_frame_id       on public.events(frame_id);
create index if not exists idx_events_player_id      on public.events(player_id);
create index if not exists idx_events_ts             on public.events(ts);

create index if not exists idx_payments_frame_id     on public.payments(frame_id);
create index if not exists idx_payments_from_id      on public.payments(from_id);
create index if not exists idx_payments_to_id        on public.payments(to_id);
create index if not exists idx_payments_status       on public.payments(status);

create index if not exists idx_player_session_stats_player_id  on public.player_session_stats(player_id);
create index if not exists idx_player_session_stats_session_id on public.player_session_stats(session_id);

create index if not exists idx_player_frame_stats_player_id    on public.player_frame_stats(player_id);
create index if not exists idx_player_frame_stats_frame_id     on public.player_frame_stats(frame_id);

-- The events/frames queries are frequently filtered by time; a combined index helps.
create index if not exists idx_events_frame_ts      on public.events(frame_id, ts);

-- ============================================================================
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Enable RLS and grant row access. Policies are intentionally permissive for
-- `anon` and `authenticated` because the app ships a PWA whose realtime hook
-- reads/writes with the publishable (anon) key and there is no backoffice user
-- model. Lock these down before exposing the project to untrusted tenants.
-- ============================================================================
alter table public.players            enable row level security;
alter table public.rooms              enable row level security;
alter table public.sessions           enable row level security;
alter table public.frames             enable row level security;
alter table public.events             enable row level security;
alter table public.payments           enable row level security;
alter table public.player_session_stats enable row level security;
alter table public.player_frame_stats enable row level security;

-- Allow the app's anon + authenticated clients full row access (read/write).
-- Realistically the anon key is what the published PWA uses.
drop policy if exists "anon read all"      on public.players;
drop policy if exists "anon write all"     on public.players;
create policy "anon read all"  on public.players            for select using (true);
create policy "anon write all" on public.players            for all using (true) with check (true);

drop policy if exists "anon read rooms"    on public.rooms;
drop policy if exists "anon write rooms"   on public.rooms;
create policy "anon read rooms"  on public.rooms   for select using (true);
create policy "anon write rooms" on public.rooms   for all using (true) with check (true);

drop policy if exists "anon read sessions" on public.sessions;
drop policy if exists "anon write sessions" on public.sessions;
create policy "anon read sessions"  on public.sessions for select using (true);
create policy "anon write sessions" on public.sessions for all using (true) with check (true);

drop policy if exists "anon read frames"   on public.frames;
drop policy if exists "anon write frames"  on public.frames;
create policy "anon read frames"  on public.frames for select using (true);
create policy "anon write frames" on public.frames for all using (true) with check (true);

drop policy if exists "anon read events"   on public.events;
drop policy if exists "anon write events"  on public.events;
create policy "anon read events"  on public.events for select using (true);
create policy "anon write events" on public.events for all using (true) with check (true);

drop policy if exists "anon read payments" on public.payments;
drop policy if exists "anon write payments" on public.payments;
create policy "anon read payments"  on public.payments for select using (true);
create policy "anon write payments" on public.payments for all using (true) with check (true);

drop policy if exists "anon read pss"on public.player_session_stats;
drop policy if exists "anon write pss"on public.player_session_stats;
create policy "anon read pss"  on public.player_session_stats for select using (true);
create policy "anon write pss" on public.player_session_stats for all using (true) with check (true);

drop policy if exists "anon read pfs"on public.player_frame_stats;
drop policy if exists "anon write pfs"on public.player_frame_stats;
create policy "anon read pfs"  on public.player_frame_stats for select using (true);
create policy "anon write pfs" on public.player_frame_stats for all using (true) with check (true);

-- ============================================================================
-- Optional: enable Realtime on the sync tables so the realtime hook can push.
-- Enable these via the dashboard rather than SQL (Realtime is a dashboard
-- feature), but the tables that matter are: rooms, sessions, frames, events,
-- payments, player_frame_stats.
-- ============================================================================

-- ============================================================================
-- Done. Verify:
--   select tablename from pg_tables where schemaname='public' order by 1;
--   with the expected list: events, frames, payments, player_frame_stats,
--   player_session_stats, players, rooms, sessions.
-- ============================================================================