# Project Architecture

Snooker Money Tracker's architecture separates **pure domain logic** (the money & rules engine), a single **Zustand store**, and a **component layer** that is deliberately thin. All money math lives in pure functions with no I/O, so it is trivially testable and deterministic across devices.

This document covers the layered design, the state flow, the core data structures, and the full folder tree.

---

## 1. Layered Design (Atomic Design)

UI follows a modified **Atomic Design** methodology so components stay small, reusable, and decoupled from the store.

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| **Atoms** | Smallest UI primitives — no business logic | `Button`, `Card`, `Ball`, labels, inputs |
| **Molecules** | Composed atoms, self-contained units | score row, shooter indicator, break badge |
| **Organisms** | Complex compositions bound to one concern | scoring panel, players panel, settlement list |
| **Templates** | Page-level layout arranging organisms | game screen shell, stats screen shell |
| **Pages** | Route-level assembly wired to the store | `src/app/page.tsx`, dashboard, history |

**Key rule:** *Atoms and Molecules never import the store or Supabase.* They receive data via props. Composition and data wiring live in Organisms/Templates/Pages. This keeps primitives reusable and the domain logic testable in isolation.

Pure logic (`src/lib`, `src/store`) is framework-agnostic and imported only by the wiring layer.

---

## 2. Engine Layer — `src/lib/`

Deeply pure, dependency-free TypeScript. These files are the heart of the app and contain **no React, no I/O**, so they can be unit-tested and reused on the server.

### `src/lib/rules.ts` — scoring rules

Canonical snooker values and rules constants:

- `POINTS_RULES` — official point value per ball for **Point Count** mode.
- `BALLS_RULES` — per-ball value for **Ball Count** mode (red/colors = 1, pink/black = 2).
- `FOUL_VALUES` — penalties per mode (`points: -4`, `balls: -2`).
- `BALL_START` — starting count per ball (red 15, others 1).
- `BALL_ORDER`, `BALL_NAME`, `BALL_HEX` — ordering & display metadata (hex colors per ball for the UI).
- `ballValue(ball, mode)` — point value of a ball in the given mode.
- `buildTargetCycle(count)` — the **target cycle**: player *i* scores against player *(i − 1) mod n*, matching the Thai convention **"1 scores against 3"**.

  ```
  3 players:  0 → 2, 1 → 0, 2 → 1
  4 players:  0 → 3, 1 → 0, 2 → 1, 3 → 2
  ```

### `src/lib/money.ts` — the money engine

The **target-player** settlement core:

- `ballsPotted(counts)` — number of balls actually potted (start count − current count).
- `computeFrameMoney(args)` — the core rule. Each player's points are converted to money at a rate; that value is paid **by the player's target**:
  - `net[scorer] += value`
  - `net[target] -= value`
  - Negative points (fouls/snooker misses) simply flip the direction.
  - Because targets form a **cycle, the table always sums to zero.**
  - **Money-per-point:** `value = points × rate`
  - **Money-per-ball:** `value = ballsPotted × rate`
  - Returns `{ net, flows }` where `flows` are directed `fromId → toId` transfer instructions (rounded to 2dp).
- `mergeRunning(running, frameNet)` — folds a frame's net into the session's cumulative running balance.
- `optimizeTransfers(net, players)` — **minimal-transfer settlement optimizer**. Greedily matches the largest debtor to the largest creditor, settling the whole table to net zero in **at most `(n − 1)` transfers**.
- `potMoney(ball, mode, moneyPer, moneyRate)` — money value of a single potted ball event (used for live per-shot preview).

### `src/lib/utils.ts` — misc helpers

- `cn(...)` — `clsx` + `tailwind-merge` class merger (shadcn convention).
- `formatMoney(n)` — formats a number as `฿` with the Thai-bath symbol.
- `formatNumber`, `formatTime`, `formatDateTime` — display formatting.
- `uid()` — collision-resistant id generator.

### Streamlined Core Focus (Commit `1485bd0`)

The experimental geometric table simulator and AI coach modules were pruned in commit `1485bd0` (`chore: remove simulator and coach features, retain core scoring and history system`) to streamline the codebase into a high-performance, distraction-free snooker match scoring and instant settlement engine.

All active unit and property tests reside in `src/lib/__tests__/money.test.ts`, `src/store/__tests__/gameStore.test.ts`, and `src/lib/auth/__tests__/auth.test.ts`.

### Authentication (`src/lib/auth/` + `src/app/api/auth/` + `src/middleware.ts`)

Email + password accounts (sign up → immediately signed in; no email verification,
no reset — deliberate scope decision). `auth_users` lives in the dedicated Neon
database `mesnooker` (separate from MeBoard's `neondb`).

| File | Responsibility |
|------|----------------|
| `auth/password.ts` | scrypt (N=16384, node defaults) hash/verify, 16-byte random salt, constant-time compare |
| `auth/session.ts` | JWT HS256 via Web Crypto (same module runs in Edge middleware and Node routes), 30-day lifetime, `AUTH_SECRET` env var |
| `auth/db.ts` | `pg` pool + `auth_users` CRUD |
| `auth/validate.ts` | email format + 8–72 char password rules |
| `auth/ratelimit.ts` | 5 failed sign-ins / 15 min per IP (in-memory, per Vercel instance) |
| `app/api/auth/{signup,signin,signout,me}` | route handlers; session cookie `mesnooker_session` (httpOnly, Secure, SameSite=Lax) |
| `src/middleware.ts` | gate: `/login` public; `/api/auth/{signup,signin}` public; all other pages → `/login`, all other `/api/*` → 401 |
| `app/login/page.tsx` | Emerald Noir glass panel, Sign in / Sign up tabs, inline validation + server errors |
| `lib/auth-client.ts` | browser-side fetch helpers (`apiSignIn`, `apiSignUp`, `apiSignOut`, `fetchMe`) |

Sign out lives in the Settings sheet (Account section). Match/coach data stays in
localStorage (per device); per-user cloud sync is future work.

---

## 3. Domain Types — `src/types/index.ts`

Shared TypeScript contracts used across engine, store, components, and Supabase.

```ts
type GameMode    = "points" | "balls"
type BallColor   = "red" | "yellow" | "green" | "brown" | "blue" | "pink" | "black"
type EventType   = "pot" | "foul" | "snooker_miss" | "snooker_hit" | "end_turn"
                 | "undo" | "end_frame" | "new_frame"
type MoneyRateUnit = "point" | "ball"
```

| Type | Purpose |
|------|---------|
| `Player` | id, nickname, ball color, optional avatar, lifetime stats |
| `PlayerLifetime` | framesWon, moneyEarned, moneyLost, sessions, highestBreakLifetime |
| `GameEvent` | a single scored event: player, target, type, ball, points, break value, frame, turn index, undo flag |
| `BallCounts` | remaining count per ball color |
| `FrameSnapshot` | immutable snapshot of one frame: scores, money result, winner, breaks, fouls/snooker tallies, target cycle, ball counts, event ids |
| `SessionSummary` | the live session: mode, money rate/unit, players, frame ids, running balance, active frame, status |
| `SettlementPayment` | a recorded transfer: from/to, amount, paid/partial/pending state |

**Why snapshots?** `FrameSnapshot` is immutable and self-contained. Every `pot`/`foul`/`snooker` produces a `GameEvent`, and the frame aggregates derived numbers (scores, breaks, money) so the UI reads once and React's memoization works well. Undo/redo operates on the event log.

---

## 4. Store Layer — `src/store/gameStore.ts`

Single store (Zustand **5**) with `persist` middleware. This is the application's source of truth and the command bus for duplicating actions to Supabase realtime.

### State shape
- `session`, `players`, `mode`, `moneyRate`, `moneyPer`
- `ballCounts`, `startCounts`, `shooterIndex`, `reverse`
- `sound`, `haptics` (device feedback toggles)
- `frames: FrameSnapshot[]`, `events: GameEvent[]`

### Actions
- **Session lifecycle:** `startSession`, `endSession`, `endFrame`, `newFrame`, `setActiveFrameId`
- **Scoring:** `pot(ball)`, `foul()`, `snookerMiss()`, `snookerHit()`
- **Turn control:** `endTurn`, `setShooterManual`, `toggleReverse`, `skipPlayer`
- **State travel:** `undo()`, `redo()`
- **Config:** `setMode`, `setMoneyRate`, `setMoneyPer`, `renamePlayer`, `toggleSound`, `toggleHaptics`

### Persistence
```ts
persist(…, { name: "smoke-master-v1", version: 1, partialize: … })
```
- Persists the full live game to `localStorage`.
- `partialize` selects exactly the serialisable state (no functions).
- Bump `version` and add a `migrate` when you change the schema.

### Selectors (React hooks)
- `useActiveFrame()` — the current (last) frame.
- `useIsLive()` — whether a live session exists.
- `useFrameEvents(frameId)` — non-`undone` events for a frame (history timeline).
- `useRunningBalance()` — the session's cumulative balance.

**Reducer philosophy:** all mutations go through pristine `set()` with immutable-update spread copies (`[...frames]`, `{ ...frame }`) — never mutate state in place — so undo/redo and re-renders stay predictable.

---

## 5. Realtime Sync Layer — `src/lib/supabase.ts` & `src/hooks/useRealtime.ts`

Optional and additive. Realtime sync mirrors store actions to other devices when Supabase environment variables are configured (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`), gracefully falling back to local-only offline mode when absent.

- `src/lib/supabase.ts`: Client factory with memoized instance (`getSupabaseCached()`) and offline detection (`supabaseConfigured()`).
- `src/hooks/useRealtime.ts`: `useRealtimeSubscription` subscribes via `supabase.channel("snooker-room:...").on("postgres_changes", ...)` to mirror remote frame/event updates.
- `useRoom()`: Generates short 6-character room codes for live multiplayer synchronization.

The Zustand store remains the authority; Supabase acts as an event sync fabric.

> See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the full schema, RLS policies, and realtime configuration.

---

## 6. Hooks Layer

Reusable React hooks (alongside the store selectors) encapsulate side-effects:

- `useGameStore` selectors (above).
- `useRealtimeSession(roomId)` — subscribes/unsubscribes a Supabase channel and feeds remote events into the store.
- `useClock` / `useElapsed` — frame timers.
- `useExport` — PNG/PDF/CSV/JSON export of a session (stats + timeline).

---

## 7. Data Flow

A single **unidirectional** flow keeps the app deterministic:

```
 ┌─────────┐   action    ┌──────────────────────┐   derived   ┌──────────────────┐
 │  UI      │ ─────────► │  Zustand gameStore     │ ─────────► │  Presentational    │
 │ (atoms/  │            │  (pure mutations)      │            │  components        │
 │ molecules)│           └──────────┬───────────┘             └──────────────────┘
 └─────────┘                        │  sync (realtime only)
                                    ▼
                          Supabase (optional)
                    ┌─────────────────────────────┐
                    │  frames / events / payments  │
                    └─────────────────────────────┘
```

1. **User gesture** (e.g. tap a ball) → handler calls `pot("black")`.
2. `gameStore.pot` validates (`session`, active frame, ball remaining), **derives** new scores/breaks via `lib/rules` + `lib/money`, pushes a `GameEvent`, and `set()`s immutable new state.
3. Selectors recompute → React re-renders only subscribed components.
4. `endFrame` calls `computeFrameMoney` → stores `frame.money`, computes the winner & highest break, and `mergeRunning`s into the session balance.
5. **Realtime:** the store's action wrapper also pushes the event to Supabase; remote devices receive it via `postgres_changes` and apply it through `useRealtimeSession` → same reducer action → identical state.

Because the money math is **pure and identical on every device**, all clients converge on the same running balance — no conflict resolution needed.

---

## 8. Folder Tree (target)

```
snooker-money-tracker/
├── src/
│   ├── app/                          # App Router routes
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # home / game entry
│   │   ├── globals.css
│   │   └── (screens)/
│   │       ├── game/                 # live scoring screens
│   │       ├── history/              # timelines
│   │       ├── stats/                # dashboard
│   │       ├── settle/               # settlement optimizer view
│   │       ├── solve/                # Coach: escape solver + shot analyzer
│   │       ├── practice/             # Coach: drill generator
│   │       └── settings/
│   ├── components/
│   │   ├── ui/                       # shadcn primitives (atoms)
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   ├── atoms/                    # Ball, MoneyLabel, Badge, …
│   │   ├── molecules/                # ScoreRow, BreakBadge, ShooterIndicator, …
│   │   ├── organisms/                # ScoringPanel, PlayersPanel, SettlementList, …
│   │   ├── templates/                # GameScreen, DashboardScreen, …
│   │   └── coach/                    # Coach Engine UI (module)
│   │       ├── CoachTable.tsx        # SVG table, drag & drop, replay
│   │       └── AiCoachPanel.tsx      # right sidebar
│   ├── lib/
│   │   ├── rules.ts                  # scoring + target cycle
│   │   ├── money.ts                  # money engine + settlement optimizer
│   │   ├── utils.ts
│   │   ├── geometry/                 # Snooker Coach Engine (pure)
│   │   │   ├── types.ts / vector.ts / tables.ts
│   │   │   ├── collision.ts          # line–circle collision
│   │   │   ├── reflection.ts         # mirror method + reflection tree
│   │   │   ├── solver.ts            # escape solver + ranking
│   │   │   └── coach.ts             # AI coach derivations
│   │   └── coach/
│   │       ├── analysis.ts           # shot analyzer
│   │       └── drills.ts             # practice generator + storage
│   ├── store/
│   │   ├── gameStore.ts
│   │   └── coachStore.ts             # coach module state (isolated)
│   ├── hooks/                        # useRealtimeSession, useExport, timers
│   ├── supabase/
│   │   ├── client.ts
│   │   └── services/
│   │       ├── rooms.ts
│   │       ├── events.ts
│   │       ├── frames.ts
│   │       └── payments.ts
│   └── types/
│       └── index.ts
├── public/                           # PWA icons, manifest assets
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── .env.local                        # (gitignored)
```

---

## 9. Architectural Invariants

1. **Pure money math** — `lib/rules.ts` / `lib/money.ts` never touch I/O or the store; the table always sums to zero after a frame.
2. **Immutable state** — the store only ever produces fresh arrays/objects; no in-place mutation.
3. **Single source of truth** — the Zustand store, not individual components.
4. **Event log drives history & undo** — every action is an `event`; undo pops it and recomputes.
5. **Deterministic cross-device convergence** — the same reducer + same pure math → same balance everywhere.