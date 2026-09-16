# Match Page — Production UI/UX Redesign Specification

**Product:** Snooker Money Tracker Pro (Mesnooker)
**Identity:** Emerald Noir — near-black ambient-glow canvas, single emerald action color, warm gold for money, frosted-glass panels.
**Scope:** The `/match` page (New Session → Live Match → Frame Pause → Frame Complete). Game logic untouched.
**Author role:** Senior UI/UX Product Designer
**Status:** Developer-ready blueprint (no implementation code yet)

---

## 0. Design Read

**Reading this as:** a live match-scoring PWA for a mobile-first "tap" flow (4–7 player Thai snooker money games), served to friends around a real table, on a tethered phone. Premium dark, glassy, focused — the operator taps a ball and instantly updates a shared scoreboard; money is the tension, the ball pad is the input, the break is the story.

Dial baseline: **Variance 5 · Motion 5 · Density 5.** Asymmetric only where it helps tap ergonomics; motion conveys scoring & turn changes, never decoration; enough density to run a live match without cognitive load.

---

## 1. UX/UI Audit (Current State)

### 1.1 Information architecture — 4 states

| State | Trigger | Current UI |
|---|---|---|
| **Setup** | No session | `NewSession.tsx` — single glass card (mode, red count, rate, players) |
| **Live** | Session active | `LiveMatch.tsx` — `max-w-3xl` single column stack |
| **Frame pause** | "End frame" hit | `FramePauseSummary.tsx` — Next frame / End session |
| **Complete** | Session ended | `FrameCompleteSummary.tsx` — settlement, table fee, transfers |

### 1.2 Live frame stack (top → bottom)

1. **Shooter header** (`glass glow-emerald`) — ball avatar, `ON BREAK` badge, "shooting vs {target}", break count.
2. **Clocks bar** — Frame clock + Session clock.
3. **Action pad** — shooter total; `BallPad` with 3D balls; turn cluster; violation grid.
4. **Scoreboard** — collapsed/detailed toggle, two `glass` cards, `TurnControls` (Prev/End/Undo) wedged above.
5. **Frames + money** — `FrameDetails` chips + toggle cards.
6. **Clear-the-table modal** — full-screen blocking modal.

### 1.3 Problems identified (prioritized)

**P0 — Usability / money visibility**
- **Money is hidden.** The "setts you win the table" figure only lives inside the collapsed *Frame details*. In a money game the owner needs running money visible at a glance while they play. → Surface a compact running-balance strip on every state.
- **Scoreboard is collapsed by default.** Desktop space is wasted on a single `max-w-3xl` column and the scoreboard is an opt-in. → Two-zone layout on ≥lg: action left, live analytics right.

**P0 — Action-pad consistency**
- **Mixed button sizes in one grid.** Foul/miss are `lg`, undo/skip are `sm` → uneven rhythm, tiny secondary targets. → Equal-sized action tiles; hierarchy by semantic **color**, not size.
- **`TurnControls.tsx` is dead code.** Reverse-order, skip, redo exist in the store but the UI exposes only Prev/End/Undo. → Consolidate or drop; one consistent control surface.

**P1 — Interaction & feedback**
- **No scorer feedback on pot.** Tapping a ball updates the number but nothing pops. → Ball `pop` micro-interaction + score/money flash on the shooter card.
- **No turn-switch transition.** Shooter highlight jumps. → Shared-element ring moves between player slots.
- **Foul/miss lack emphasis.** Two red buttons with different values sit side-by-side; a foul should feel like a penalty. → Segmented violation panel with clear value tags + press-state flash.

**P1 — Accessibility**
- Clear-the-table modal: no `role="dialog"`, no `aria-modal`, no Escape close, no focus trap. → Accessible modal **or** a non-blocking inline "clear rack" that keeps the action pad usable (**recommended**, §4.4).
- Status text (`red first` / `pick a colour` / `clear: X`) is helpful plain text — keep, but align color to semantics.
- Icon-only buttons should carry `aria-label`; verify every new control does too.

**P2 — Layered polish**
- Redundant uppercase micro-labels; inconsistent `text-[9px]`/`text-[10px]` sizes across pads (interpolate toward token sizes, §5.3).
- Break count lives in the header but the "sets/potted" narrative is buried in details.
- No `prefers-reduced-motion` awareness inside framer springs.

---

## 2. New Information Architecture

### 2.1 Page states (flow unchanged, states refined)

```
/match
 ├── Setup        → Hero + NewSession (split: rules copy left, form right on lg)
 ├── Live Frame   → LiveMatch — two-zone layout
 ├── Live (clear) → same live zone; ClearRack replaces ActionPad in place (no modal)
 ├── Frame Pause  → FramePauseSummary (frame ceremony + Next / End session)
 └── Complete     → FrameCompleteSummary (settlement + fee + transfers)
```

### 2.2 Live frame — two-zone model

**Zone A — ACTION (primary input; always in thumb reach on mobile).**
1. `TurnHeader` — shooter identity + break + running money (replaces separate header + clocks bars).
2. `ActionPad` — felt + 3D balls (input).
3. `TurnCluster` — End turn primary + Prev/Skip/Redo icons.
4. `ViolationPanel` — segmented fouls + Undo ghost (compact, non-blocking).

**Zone B — ANALYTICS (live, no longer hidden).**
1. `Scoreboard` — player rows: points, money, active shooter slot with shared-element ring.
2. `MoneyStrip` — compact running per-player balances (+ 錢 icon).
3. `Potted rack` — colour-badge track + `BallCountBadge`.
4. `EventTimeline` — events grouped by turn.
5. `TurnHeader` **zone-anchored rail** (money strip pinned on ≥lg).

**Layout mapping**

| Responsive | Zone A | Zone B |
|---|---|---|
| Mobile | Above fold | Below fold; quick money peek always visible |
| Tablet (900) | Left (~55%) | Right |
| Desktop (≥1200) | Sticky left rail | Sticky right rail (scrollable independently) |

---

## 3. Component Inventory & Places

### 3.1 Proposed final composition (Algolia-ish top row, 5 columns)

| Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|
| TurnHeader (identity + break + money) | Scoreboard (money column) | ActionPad (3D balls) | MoneyStrip + EventTimeline |

### 3.2 Gap analysis (current → target)

| Piece | Current | Target | Notes |
|---|---|---|---|
| `TurnHeader` | header + separate clocks | new component | shooter identity · break · running money · clocks |
| `ActionPad` | base | refactor | wraps BallPad; owns status-line + scoring text ❶ |
| `BallPad` | felt + 3D balls | polish | felt + 3D balls; add `pop` + legal-glow on hover ❷ |
| `BallCountBadge` | count dots inline | new component | colour badge + remaining count |
| `TurnCluster` | scattered TurnControls | new component | End turn primary + Prev / Skip / Redo |
| `ViolationPanel` | raw 4-grid | new component | segmented foul/miss conform + Undo ghost |
| `ClearRack` | blocking modal | new component | non-blocking inline control (no modal) |
| `Scoreboard` | collapsed by default | refactor | always on ≥lg; active shooter ring + money column |
| `MoneyStrip` | none | new component | per-player running money (money-tracking) |
| `EventTimeline` | EventLog | refactor | group by turn; colour dots + value tags |
| `FrameCompleteSummary` | fee + stepper | refactor | keep fee; add mini money table + polish |
| `FramePauseSummary` | End/Prev | refactor | frame-winner ceremony + running session total |

### 3.3 Action pad (turn cluster + violations) — equal-size tiles
- One size: `h-14 min-w-14` (56px) touch target, pill `rounded-2xl`.
- Icon + label stacked; value tag (`−4`, `−2`, `+1`) as small superscript pill.
- Equal sizing within a group; hierarchy via **semantic color** (§5) + order. Consistent.

---

## 4. Interaction & Animation Guidelines

| Interaction | Motion | Why |
|---|---|---|
| Pot ball tapped | `scale 1.34 → 0.88` ball pop (180ms spring) + felt ripple `opacity .18→0` | Confirms input (feedback) |
| Score / money change | `AnimatedNumber` roll + tint flash on the number | Storytelling (scoring) |
| Shooter switch | `layoutId="scoreboard-active"` shared-element ring slides to next slot, 260ms spring | Spatial continuity (hierarchy) |
| Turn ends | shooter's status dot pulses once (not infinite) | Feedback, not decoration |
| Foul / miss | press-state red flash on the value; text `−X` staggers up | Penalty emphasis |
| Break rises | digit roll + tiny gold glow on the count | Reward storytelling |
| Zone A→B on mobile | details peek with `AnimatePresence` height fade, 220ms | Hierarchy (deeper) |
| Modal (if used) | scale 0.94→1 + scrim fade; Exit faster (120ms) | Modal entrance; quick dismiss |
| **Reduced motion** | springs gated by `useReducedMotion()` → fade-only or static | Accessibility |

**Rules:** animate `transform`/`opacity` only; 150–300ms micro, ≤400ms complex; one hero element per zone; `exit` ~60–70% of `enter`; every animation justified (feedback / storytelling / hierarchy / state).

---

## 5. Design System Updates

### 5.1 Tokens (add to `@theme` in `globals.css`)
```
--color-felt-deep  : #073d1a   (BallPad felt base)
--color-felt-mid   : #0a5a27
--color-felt-hi    : #0e7a3a
--color-violation  : #ea580c   (amber for "miss / solve" — distinct from foul red)
--color-pos-soft   : rgba(22,199,132,0.10)  (money chip bg)
--color-neg-soft   : rgba(239,68,68,0.10)
--color-rail       : rgba(16,20,18,0.62)    (side rail glass on ≥lg)
```
Keep Emerald Noir: no new hero colors; `danger` stays for fouls, add `violation` (amber) so Foul and Snooker-miss are *visually distinct despite both being penalties*.

### 5.2 New Button variant
- `variant="violation"` — amber fill, amber text — for Miss / Solve-near (rule grey area, not a fatal foul).

### 5.3 Typography spacing (refinement)
- Keep Inter + SF fallback, Tailwind scale. Standardize: **labels 11px** (uppercase, `tracking-wider`), **values 16–20px tabular**, **hero money 28–34px tabular**; superscript value tags 10px.
- Replace mixed `text-[9px]`/`text-[10px]` in pads with token sizes (10px allowed for the tiny `×N` count only; 11px min for readable text).

### 5.4 Elevation
- `.rail` side panel uses glass tokens, slightly more opaque on desktop for sustained reading.

---

## 6. Responsive Blueprint (mobile → tablet → desktop)

### Mobile (≤767) — portrait, thumb-first
```
TurnHeader (compact; money inline, padded)
ActionPad (felt + 3D balls)          ← top task order
TurnCluster | ViolationPanel (segmented)
[peek] Quick money row (mini MoneyStrip under header)
Frame details accordion (scoreboard / potted / events)
Sticky bottom: BottomNav (4 tabs, existing) — action pad sits above it, padded.
```
- Labels 16px min; action tiles 56px; side gutters px-4; safe-area insets.

### Tablet (768–1199)
- Two-column from 900px: **Zone A (left ~55%)** action + turn + violation; **Zone B (right)** scoreboard + potted + events.
- Clocks move into TurnHeader row (Frame | Session).
- Clearing: `ClearRack` sits inline in Zone A.

### Desktop (≥1200) — full width `max-w-6xl`
- Sticky Zone A (left rail) + scrollable Zone B (right rail). Scoreboard always visible, money strip pinned.
- Setup & summaries center at `max-w-3xl`.
- No horizontal scroll; keep max line length ~65ch for summary prose.

---

## 7. Developer-Ready Implementation Checklist

**Phase 1 — Structure & tokens (no behavior change)**
- [ ] Add §5.1 tokens + `violation` Button variant to `globals.css` / `button.tsx`.
- [ ] Build `TurnHeader` (name, ON BREAK, break, inline money) replacing header + clocks bars.
- [ ] Build equal-size `ActionPad` wrapper + action tiles.

**Phase 2 — Live flow**
- [ ] `TurnCluster` (End turn primary + Prev) — wire store `endTurn` / shooter set.
- [ ] `ViolationPanel` segmented (foul / miss / solve / undo) — one consistent row, ≥44px targets.
- [ ] `MoneyStrip` (compact running balances) always visible under TurnHeader.
- [ ] `Scoreboard` refactor with `layoutId` active-shooter ring + money column.
- [ ] `BallCountBadge` for potted rack.

**Phase 3 — Data narrative**
- [ ] `EventTimeline` groups events by turn; keeps colour dots + value tags.
- [ ] `ClearRack` inline control replacing the overlay modal; add Escape + `role="dialog"` if any modal remains.
- [ ] FrameComplete/Pause polish (winner ceremony, fee stepper kept).

**Phase 4 — Responsive & motion**
- [ ] Two-zone breakpoints (900px / 1200px) per §6; sticky rails.
- [ ] Micro-interactions per §4; gate all springs with `useReducedMotion()`.
- [ ] Keyboard: tab order = visual (action → turn → violation → details); visible focus ring on every control.

**Phase 5 — Verification**
- [ ] `npx next build` clean (TS + hooks).
- [ ] Grep built bundle for new user-visible strings to confirm ship.
- [ ] Test 375px, 768px, 1440px; landscape on phone.
- [ ] WCAG: amber `violation` on near-black ≥4.5:1 (aim 4.8+); every color paired with text/icon.
- [ ] Reduced-motion pass.
- [ ] No horizontal scroll anywhere; safe-area respected on PWA.

---

## 8. Anti-Patterns to Avoid
- Centering the whole board with wasted side gutters on desktop.
- Reintroducing a blocking full-screen modal for table-clearing.
- Mixing 4+ ad-hoc font sizes in the action pad.
- Color-only foul/miss distinction (must also carry `−2` / `−4` text).
- Turning on infinite pulsing animations (respect reduced motion; no decorative loops).
- Adding a money number that isn't `tabular-nums` (causes layout shift).
