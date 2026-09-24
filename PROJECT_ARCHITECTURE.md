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

### The Snooker Coach Engine (`src/lib/geometry/` + `src/lib/coach/`)

A self-contained module for practice and escape-solver work — **fully isolated from the
scoring/money system** (no imports from `rules.ts`/`money.ts`, own store, own routes).

| File | Responsibility |
|------|----------------|
| `types.ts` | Shared data contracts: `Ball`, `Vec`, `SolvePath`, `Drill`, `ShotAnalysis`, `CounselNote`. All coordinates in table units (1200 × 600 playing area). |
| `vector.ts` | Pure 2D vector math (dot/cross/normalize/lerp/angle). |
| `tables.ts` | 12ft table constants: pockets, ball radius, baulk line/spots, dockets, `clampToTable()`. |
| `collision.ts` | Line–circle collision: closest point on segment, segment-hit test, ray–circle intersection. |
| `reflection.ts` | **Reflection / Mirror Method**: `unfoldStraight()` mirrors a target across cushion planes (BFS over `Side[]` sequences) and recovers legal bounce points. |
| `solver.ts` | **Escape Solver**: ghost-ball computation, Cushion Reflection Tree (BFS over ≤6 bounces), legal bounces/pocket-mouth/blocker checks, `difficultyScore()` (1–10) and the Path Ranking Algorithm. |
| `coach.ts` | **AI Coach**: deterministic coaching from a solved path — aim point/angle, hit thickness, power suggestion, per-cushion explanation. |
| `src/lib/coach/analysis.ts` | **Shot Analyzer**: compares a user-drawn aim line with the best path (error angle, contact offset in ball radii, will-contact test). |
| `src/lib/coach/drills.ts` | **Practice Generator**: 4 drill types (safety / escape / thin contact / position) at difficulty 1–10; every generated pose is verified solvable by the engine. localStorage persistence + JSON share/handoff. |

UI lives in `src/components/coach/` (`CoachTable` — SVG table with drag & drop, path
overlays, ghost ball, bounce markers, replay; `AiCoachPanel` — right sidebar) and the
routes `app/solve/page.tsx` + `app/practice/page.tsx`. State is in `src/store/coachStore.ts`
(a separate Zustand store — deliberately NOT persisted into the game store).

**Invariants:** pure math (no React in `lib/geometry`), theme tokens only (Emerald Noir
re-skins the module automatically), and the match/money tracker is untouched.

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

## 5. Supabase Layer — `src/supabase/`

Optional and additive. Realtime sync mirrors store actions to other devices.

```
src/supabase/
├── client.ts              # createBrowserClient(url, anonKey)
└── services/
    ├── rooms.ts           # CRUD for shared rooms
    ├── events.ts          # append/stream GameEvents
    ├── frames.ts          # frame documents + realtime subscribe
    └── payments.ts        # settlement records + realtime subscribe
```

- `client.ts` reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Services subscribe via `supabase.channel(...).on('postgres_changes', …)` to `frames`, `events`, and `payments` and dispatch into the Zustand store.
- The store remains the authority; Supabase is a sync fabric.

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