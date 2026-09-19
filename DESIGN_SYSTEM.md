# Design System — Snooker Money Tracker Pro ("Billiard Night")

The visual identity is *Billiard Night*: a green-baize money table under a warm
tungsten lamp. Deep green-black canvas, brass action color, champagne money
highlights, amber-orange rule violations, and green felt wherever balls sit.
Lightweight, mobile-first, tuned for both the desktop dashboard and the "tap"
tethered match screen.

All tokens live in `src/app/globals.css`. There are two parallel token banks:

- **`@theme`** block (`--color-*`, `--font-sans`) — the Tailwind v4 design-token
  source (generates `bg-background`, `text-foreground`, `text-primary`, `bg-gold`,
  etc.).
- **`:root`** CSS custom properties (`--background`, `--primary`, `--border`,
  etc.) — the shadcn-style component layer consumed by `src/components/ui/*`.

When adding a color in markup, prefer the **`@theme`** tokens (e.g.
`bg-background`, `text-primary`, `text-gold`); the `:root` vars back the semantic
shadcn components.

---

## 1. Color Tokens

*All values as hex unless noted. **bg** = surface of the page, **fg** = text.*

## 0. Structural Layout (2026-09, match/dashboard)

The screen reads as **a table in a green room**, not a card feed:

- **Match (mobile)** — top-to-bottom: TurnHeader scoreboard rail → ClockStrip →
  `.table-stage` (brass frame containing the `.baize` ball pad) → inline MoneyStrip →
  `.control-dock` **fixed** gamepad deck (Foul/Miss/Solve + Turn + ⋯ + End frame)
  at `bottom: 5rem` (clears the 77 px BottomNav) → bottom spacer `h-24 lg:hidden`.
- **Match (≥lg)** — 2-col grid `lg:grid-cols-[minmax(0,1fr)_360px]`: ZONE A table +
  in-flow dock under the baize, ZONE B analytics `aside`.
- **Setup** — 2-step wizard inside `NewSession` (step 0 The table w/ mini `.baize`
  preview → step 1 Players & rate), brass step indicator `#1 / 2`.
- **Dashboard** — idle = `.table-stage` hero (mini baize ball row + "Set the table"
  CTA); live = Session-live hero + Money tonight + Leaderboard.
- Custom CSS lives in `src/app/globals.css` under layers: `@theme` tokens, `:root`
  semantic vars, component classes (`.glass`, `.glass-strong`, `.baize`, `.felt-spot`,
  `.table-stage`, `.scoreboard-head`, `.control-dock`), Tailwind utilities.

### Brand palette (Tailwind `@theme`, default theme `mono` = Billiard)

| Token              | Value                                 | Usage                                        |
| ------------------ | ------------------------------------- | -------------------------------------------- |
| `--color-background` | `#0d1210`                           | Green-black felt room (not pure `#000`)      |
| `--color-surface`    | `#141a16`                           | Raised surfaces, popovers, inputs            |
| `--color-card`       | `rgba(18,25,21,0.62)`               | Glass card fill (translucent, green tint)    |
| `--color-card-solid` | `#161d18`                           | Solid card fill (opaque cards, sheets)       |
| `--color-primary`    | `#d9a441`                           | **Brass** — main actions + winning money     |
| `--color-secondary`  | `#7d6b3a`                           | Muted brass (secondary / accent tint)        |
| `--color-gold`       | `#f0c25c`                           | **Champagne** — money, settlement, awards    |
| `--color-danger`     | `#e8534a`                           | Fouls, errors, destructive actions           |
| `--color-info`       | `#5aa2f5`                           | Information, focus assists, blue ball        |
| `--color-muted`      | `#9aa58f`                           | Muted/secondary text, disabled               |
| `--color-foreground` | `#f3efe4`                           | **Chalk ivory** primary text                 |
| `--color-line`       | `rgba(243,239,228,0.10)`            | Hairlines, borders, dividers                 |
| `--color-violation`  | `#f2731e`                           | **Amber-orange** — snooker miss / solve      |
| `--color-felt-hi`    | `#1c5a2f`                           | BallPad felt base, lamp-lit top              |
| `--color-felt-mid`   | `#12381f`                           | BallPad felt base (mid)                      |
| `--color-felt-deep`  | `#0a2413`                           | BallPad felt base (deep)                     |
| `--color-pos-soft`   | `rgba(217,164,65,0.12)`             | Money-chip positive background (brass)       |
| `--color-neg-soft`   | `rgba(232,83,74,0.12)`              | Money-chip negative background               |
| `--color-rail`       | `rgba(20,26,22,0.66)`               | Desktop side-rail glass (≥lg)                |

### Semantic component layer (`:root`)

| Variable                 | Value                            |
| ------------------------ | -------------------------------- |
| `--background`           | `#0d1210`                        |
| `--foreground`           | `#f3efe4`                        |
| `--card`                 | `#161d18`                        |
| `--primary`              | `#d9a441` (brass)                |
| `--primary-foreground`   | `#14100a`                        |
| `--secondary`            | `#7d6b3a`                        |
| `--muted-foreground`     | `#9aa58f`                        |
| `--destructive`          | `#e8534a`                        |
| `--border`               | `rgba(243,239,228,0.10)`         |
| `--ring`                 | `#d9a441` (focus ring)           |
| `--gold`                 | `#f0c25c`                        |
| `--radius`               | `0.9rem`                         |

### Snooker ball colors (`src/lib/rules.ts` — `BALL_HEX`, DO NOT CHANGE)

Used for player avatars/colors, ball pads, and identity badges. Balls stay on
green felt — bright enough to read (same as a real snooker table).

| Ball  | Hex    | Ball  | Hex   |
| ----- | ------ | ----- | ----- |
| Red   | `#ef4444`| Blue | `#3b82f6`|
| Yellow| `#facc15`| Pink | `#ec4899`|
| Green | `#22c55e`| Black| `#1f2937`|
| Brown | `#a16207`|       |        |

---

## 2. Typography

Primary face is **Inter** (Variable) with a system stack fallback that prefers
Apple's San Francisco on iOS/macOS.

- Font family: `var(--font-sans)` applied on `body`.
- **Money / score numerals** are the hero typography — large, tabular, brass or
  champagne. Live score uses the `.roll-num` roll animation container.
- **Match-page scale**: labels 11px uppercase `tracking-wider`, values 16-20px
  tabular, hero money 28-34px tabular; action value-tags (`−4`, `−2`, `+1`) 10px.
- Muted text uses `--color-muted` / `text-muted-foreground`.

---

## 3. Spacing — 8px Grid

Standard Tailwind spacing. Page max-width `max-w-6xl`. Layout uses
`px-4 md:px-8` with `pb-safe/pt-safe` insets (PWA).

---

## 4. Radii

| Context              | Value        |
| -------------------- | ------------ |
| `--radius`           | `0.9rem`     |
| Glass panel          | `24px` (`.glass` / `.glass-strong`) |
| Baize pad + rail     | `20px` felt / `26px` cushion rail   |
| Buttons / badges     | `rounded-lg` / `rounded-full`        |
| Balls                | `9999px`     |

Large radii are central to the premium look — cards 24px, buttons pill or
rounded, balls perfect circles.

---

## 5. Surfaces

- `.glass` — warm green-tinted glass card (light catching the baize rail).
- `.glass-strong` — frosted, more opaque (sheets, overlays).
- `.baize` — **the signature surface**: layered billiard-green felt
  (radial hi→mid→deep) with an inset shadow, like the lit bed of a real table.
- `.felt-spot` — tungsten spotlight pool overlay hovering over the felt
  (warm radial at the top, deep shade at the bottom).
- `.felt-tick` — chalk scoreboard tick mark along the cushion rail.
- `.cushion` — physical contact shadow under a pressed ball.
- The app shell adds ambient glows: champagne top-right, brass bottom-left,
  faint felt green bottom-right (see `app-shell.tsx`).

---

## 6. Shadows & Glows

Class names `glow-emerald` / `glow-gold` are KEPT (so components stay valid)
but re-pointed to Billiard Night accents: brass for live table & key cards,
champagne for money moments.

---

## 7. Motion & Animation

Powered by **Framer Motion** + CSS transitions.

- **Springs**: default spring `stiffness` ≈ 200-260, `damping` ≈ 20-30.
- **Ball squash**: balls squash on tap (`scaleX 1.18 / scaleY 0.74`,
  stiffness 420, damping 16) — playful, billiard-like.
- **Action keys** (`.action-key`): raised brass keycap that physically presses
  down 4px on `:active`.
- **Micro-interactions**: button press scale ≈ `0.97`, list fade/slide,
  number-roll for live scores (`.roll-num`).
- **Confetti** on frame win / settlement complete (`confetti.tsx`).
- `prefers-reduced-motion` globally disables animation/transition.

---

## 8. Components

See `src/components/ui/` (button, card, badge, sheet, stat, snooker-ball,
confetti) and `src/components/game/` (LiveMatch, BallPad, TurnHeader,
MoneyStrip, ViolationPanel, TurnCluster, ClearRack, NewSession...).

---

## 9. Accessibility (WCAG)

- Green-black `#0d1210` bg + chalk `#f3efe4` fg: high contrast (≫ 7:1).
- Brass `#d9a441` on dark clears WCAG AA for large/UI text; body copy uses the
  chalk foreground. `muted` only for secondary/hint text.
- Focus rings `--ring`, targets ≥ 44px, reduced motion honored.
- Color is never the sole indicator: money uses `+`/`−` signs; player identity
  uses icon/color + name; mode/status is text.