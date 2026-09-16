# M2 — Data-Flow Audit Spec (redesign pass)

Author: @researcher · Inputs: `DATABASE_SCHEMA.sql`, `src/store/gameStore.ts`,
`src/lib/rules.ts`, `src/lib/money.ts`, History/Stats/Settlement pages.
Every finding was confirmed against the code and, where money is involved,
against a Python mirror of the store logic (see repro snippets below).

## Verified CORRECT (do not "fix" — cover with tests)

| Path | Verdict |
|---|---|
| Per-frame money filter (`e.frameId === f.id && !e.undone`) in `endFrame` (gameStore.ts:423) | ✅ sim: 2-frame balls-mode session, no leak, zero-sum |
| `archiveAndReset` idempotency (gameStore.ts:176 `if (f && !f.endedAt)`) | ✅ both paths: ended-frame archive does NOT re-merge; mid-frame archive merges exactly once |
| `inferBreakPhase` returns `RED_FIRST` on `end_turn`; `legalBalls()` single next colour after reds gone | ✅ code correct (rules.ts:122, 156-158) |
| `optimizeTransfers` minimal-transfer zero-sum | ✅ |
| `useElapsedSum` session clock = sum of frame durations (excludes between-frame pause) | ✅ useElapsed.ts:28-41 |

## BUGS (fix in M4, encode in M1 tests)

### B1 — HIGH: `pot()` breakValue is inflated by non-break events (breaks wrong)
- **Where**: gameStore.ts:266 `breakValue: st.events.filter(e => e.frameId === f.id && e.playerId === scorer.id && !e.undone).length + 1`
- **What**: counts **every** prior event of the shooter in the frame — including `end_turn` and `foul` — into the break. Reproduces as visible in `f.breaks` / `f.highestBreak` (endFrame.ts:446).
- **Repro** (balls mode): pot red (bv=1) → End turn → foul → pot black. Store reports bv=5; true (currentBreakCount, rules.ts:170) = 1.
- **Fix**: use `currentBreakCount(events, scorerId)` instead of the all-events count. Test: `highestBreak` never counts `end_turn`/`foul` boundaries.

### B2 — HIGH: /settlement page pay/undo is dead UI (paid state never reaches the panel)
- **Where**: src/app/settlement/page.tsx:15 `const [payments] = useState<PaymentRecord[]>([])` (never set); :62-67 passes `payments.map(...)` (always `[]`); SettlementPanel.tsx:39-42 derives `paidMap` only from the `payments` prop.
- **What**: clicking **Pay** adds a `from->to` key to `paidSet`, but the panel's row visual comes from `paidMap` — so rows never toggle. Header badge may say "All settled" while rows still say **Pay**. The **Export summary** button (page.tsx:70) has no `onClick` at all.
- **Repro**: start session → /settlement → click Pay on a transfer → row unchanged.
- **Fix**: lift `paidSet` into the store (or pass it as a prop + recompute row status from it), persist per-game paid state, wire Export to `buildSummaryText`/`exportCsv`.

### B3 — LOW: `endFrame` crowns a winner on a 0-0 (all-zero) frame
- **Where**: gameStore.ts:444 `winners.length ? winners[0].id : undefined` with `best >= 0` at :443.
- **Repro**: end a frame where nobody potted anything → `winnerId = players[0]`.
- **Fix**: require `best > 0` (or explicit "draw" state). Test: zero-score frame → no winner.

## DESIGN QUESTIONS (need @user sign-off, not a code guess)

### Q1 — Ball-mode fouls have NO money effect (asymmetric with points mode)
- money.ts:59-65 computes ball-mode value from **potted-ball counts only**; the `-2` foul in BALLS_RULES lands in `scores` but never in money. Points-mode fouls (`-4`) DO move money (scores × rate).
- **Repro**: balls mode, rate 10, A pots red then fouls → A scores −1 but money = +10/−10 as if no foul.
- **Decision**: keep (money = potted balls only, fouls are score-only) or make fouls cost money in ball mode?

### Q2 — Table-fee split rounding drift (sub-1฿, cosmetic + accounting)
- gameStore.ts:491 `Math.round(((balances[p.id] ?? 0) - share) * 100) / 100` per player; 100/3 → 33.33 × 3 = 99.99 collected (0.01 unaccounted). FrameSummary.tsx:125 displays `Math.round(tableFee / n)` = 33 while the per-player line shows −33.33.
- **Decision**: accept (note in copy "rounded per player") or track residual as an explicit line.

## SCHEMA / CODE DRIFT (align or document as intentional)

1. **event types `undo`, `end_frame`, `new_frame` never emitted** (schema:117 allows them; `undo()` slices the event list instead, endFrame/newFrame push nothing). Replay/undo contract in the schema comment doesn't match the store.
2. **`payments`, `player_session_stats`, `player_frame_stats` tables never written** — marked-paid state is ephemeral; `PlayerLifetime` (types:index.ts:30) never populated. Real-time only exists on the player page (supabase.ts/useRealtime.ts), not the match screen.
3. **`ArchivedGame` drops per-frame detail** — per-frame winner/money/highestBreak are discarded at archive; History/Stats therefore compute "winner" as **max net balance** (stats/page.tsx:78-89, ties broken by player order), not the actual frame winners. If per-frame breakdown or true winners matter, extend `ArchivedGame` (localStorage budget permitting).
4. **`endSession()` (gameStore.ts:161) is dead code** — never called; FramePauseSummary defines its own `endSession` → `archiveAndReset`.
5. **`startSession` still accepts `tableFee`** (gameStore.ts:127) but NewSession never sends it — dead param; `SessionSummary.moneyRateMismatch` (types:index.ts:104) unused.
6. **`endedAt` accuracy** — an archived game's `endedAt` = End-session **tap time** (archiveAndReset), not the last frame's true end. History dates and FrameSummary timestamps can be minutes off if the table sits open.

## STATS LOGIC SMELLS (low priority, mention in M3/M4)

- "Balanced player" achievement (stats/page.tsx:142-145): `.length >= 0` is a tautology and the comparator uses the leader's net; effectively unlocks when ANY player with ≥2 games has |net| < 50. Rewrite the predicate or drop the achievement.
- `highestNet` semantics: "best single-game net" via `Math.max(0, bal)` ignores negative (fine for the stated label, just document).

## SUMMARY FOR @fullstack-dev (M1 test additions)

- T1: `currentBreakCount`-based break values — `end_turn`/`foul` never inside a break (B1).
- T2: zero-score endFrame → no winner (B3).
- T3: settlement paid-state: Pay toggles row + allPaid consistently; export wired (B2).
- Keep all 5 originally-planned locks; they are correct today and must stay correct.