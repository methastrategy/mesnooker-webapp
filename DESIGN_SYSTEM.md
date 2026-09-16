# Design System — Snooker Money Tracker Pro ("Emerald Noir")

The visual identity of **Snooker Money Tracker Pro** is *Emerald Noir*: a near-black,
ambient-glow canvas with a single vivid emerald action color, warm gold for money/accent
moments, and frosted-glass panels throughout. Lightweight, mobile-first, and tuned for
both the desktop dashboard and the "tap" tethered match screen.

All tokens live in `src/app/globals.css`. There are two parallel token banks:

- **`@theme`** block (`--color-*`, `--font-sans`) — the Tailwind v4 design-token source
  (generates `bg-background`, `text-foreground`, `text-primary`, `bg-gold`, etc.).
- **`:root`** CSS custom properties (`--background`, `--primary`, `--border`, etc.) —
  the shadcn-style component layer consumed by `src/components/ui/*`.

When adding a color in markup, prefer the **`@theme`** tokens (e.g. `bg-background`,
`text-primary`, `text-gold`); the `:root` vars back the semantic shadcn components.

---

## 1. Color Tokens

All values as hex unless noted. **bg** = surface of the page, **fg** = foreground text.

### Brand palette (Tailwind `@theme`)

| Token            | Value                                | Usage                                        |
| ---------------- | ------------------------------------ | -------------------------------------------- |
| `--color-background` | `#050505`                         | App background (near-black, not pure `#000`) |
| `--color-surface`    | `#101312`                         | Raised surfaces, popovers, inputs            |
| `--color-card`       | `rgba(18, 18, 18, 0.68)`           | Glass card fill (translucent)                |
| `--color-card-solid` | `#121212`                         | Solid card fill (opaque cards, sheets)       |
| `--color-primary`    | `#16c784`                         | **Emerald** — primary actions, active, money  |
| `--color-secondary`  | `#14532d`                         | Deep green (muted secondary / accent tint)   |
| `--color-gold`       | `#f59e0b`                         | Money, settlement, highlights, awards        |
| `--color-danger`     | `#ef4444`                         | Fouls, errors, destructive actions           |
| `--color-info`       | `#3b82f6`                         | Information, focus assists, blue ball        |
| `--color-muted`      | `#8a8f8c`                         | Muted/secondary text, disabled               |
| `--color-foreground` | `#f3f7f4`                         | Primary text (soft white)                    |
| `--color-line`       | `rgba(255, 255, 255, 0.08)`       | Hairlines, borders, dividers                 |
| `--color-violation`  | `#ea580c`                         | **Amber** — snooker miss / solve (rule grey-area, distinct from foul red) |
| `--color-felt-hi`    | `#0e7a3a`                         | BallPad felt base (top)                      |
| `--color-felt-mid`   | `#0a5a27`                         | BallPad felt base (mid)                      |
| `--color-felt-deep`  | `#073d1a`                         | BallPad felt base (deep)                     |
| `--color-pos-soft`   | `rgba(22,199,132,0.10)`           | Money-chip positive background               |
| `--color-neg-soft`   | `rgba(239,68,68,0.10)`            | Money-chip negative background               |
| `--color-rail`       | `rgba(16,20,18,0.62)`             | Desktop side-rail glass (≥lg)                |

### Semantic component layer (`:root`)

| Variable              | Value                            |
| --------------------- | -------------------------------- |
| `--background`        | `#050505`                        |
| `--foreground`        | `#f3f7f4`                        |
| `--card`              | `#121212`                        |
| `--card-foreground`   | `#f3f7f4`                        |
| `--popover`           | `#101312`                        |
| `--popover-foreground`| `#f3f7f4`                        |
| `--primary`           | `#16c784`                        |
| `--primary-foreground`| `#050505` (emerald button text)  |
| `--secondary`         | `#14532d`                        |
| `--secondary-foreground` | `#f3f7f4`                     |
| `--muted`             | `#101312`                        |
| `--muted-foreground`  | `#8a8f8c`                        |
| `--accent`            | `#14532d`                        |
| `--accent-foreground` | `#f3f7f4`                        |
| `--destructive`       | `#ef4444`                        |
| `--destructive-foreground` | `#ffffff`                   |
| `--border`            | `rgba(255, 255, 255, 0.08)`      |
| `--input`             | `rgba(255, 255, 255, 0.1)`       |
| `--ring`              | `#16c784` (focus ring)            |
| `--radius`            | `0.75rem`                        |
| `--gold`              | `#f59e0b`                        |

### Snooker ball colors (`src/lib/rules.ts` — `BALL_HEX`)

Used for player avatars/colors, ball pads, and identity badges.

| Ball  | Hex      | Ball | Hex      |
| ----- | -------- | ---- | -------- |
| Red   | `#ef4444`| Blue | `#3b82f6`|
| Yellow| `#facc15`| Pink | `#ec4899`|
| Green | `#22c55e`| Black| `#1f2937`|
| Brown | `#a16207`|      |          |

---

## 2. Typography

Primary face is **Inter** (Variable), with a system stack fallback that prefers Apple's
San Francisco on iOS/macOS.

```css
--font-sans: "Inter Variable", "Inter", -apple-system, BlinkMacSystemFont,
  "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
```

- Font family: `var(--font-sans)` applied on `body`.
- Text rendering: `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`.
- Scale (Tailwind defaults): `text-xs` 12, `text-sm` 14, `text-base` 16,
  `text-lg` 18, `text-xl` 20, `text-2xl` 24, `text-3xl` 30, `text-4xl` 36.
- **Money / score numerals** are the hero typography — large, tabular, with the emerald
  or gold color. Live score uses the `.roll-num` roll animation container.
- **Match-page scale** (refined): labels 11px uppercase `tracking-wider`, values 16–20px
  tabular, hero money 28–34px tabular; superscript action value-tags (`−4`, `−2`, `+1`) 10px.
- Weights: `font-normal` 400, `font-medium` 500, `font-semibold` 600, `font-bold` 700.
- Headings: `font-semibold`/`font-bold`, tight `leading-tight`. Body: `font-normal`,
  `leading-relaxed`.
- Muted text uses `--color-muted` / `text-muted-foreground`.

---

## 3. Spacing — 8px Grid

Spacing follows an 8px base grid (Tailwind v4 spacing utilities):

- `p-1` `8px` · `p-2` `8px` · `p-4` `16px` · `p-6` `24px` · `p-8` `32px`
- Standard card padding `p-4`–`p-6`. Section gaps `gap-4`/`gap-6`. Page max-width `max-w-6xl`.
- Layout uses `px-4 md:px-8` side padding with `pb-safe/pt-safe` inset guards (see §5/PWA).
- Never use odd, non-multiple-of-8 gutters for structural rhythm.

---

## 4. Radii

| Token            | Value       | Usage                             |
| ---------------- | ----------- | --------------------------------- |
| `--radius`       | `0.75rem`   | shadcn component default (button-br.) |
| Glass panel      | `24px`      | `.glass` / `.glass-strong` cards and sheets |
| `.snooker-ball`  | `9999px`    | Fully round balls & avatars        |
| Buttons / badges | `rounded-lg`/`rounded-full`, per component |

Large, unmistakable radii are central to the premium look — **cards are 24px**, buttons
are fully rounded or pill-shaped, and the ball is a perfect circle.

---

## 5. Glassmorphism

Two ready-made classes in `globals.css`:

```css
.glass {
  background: var(--card);                              /* rgba(18,18,18,0.68) */
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}
.glass-strong {
  background: rgba(20, 24, 22, 0.85);                   /* frosted, more opaque */
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}
```

- Use `.glass` over the ambient emerald/gold glow for standard cards.
- Use `.glass-strong` for floating, transient or stacked surfaces (sheets, overlays).
- Always include the `-webkit-` prefix for Safari iOS.
- The app shell adds an **ambient glow** behind content:
  an emerald radial at the top-right and a faint gold radial at the bottom-left
  (see `app-shell.tsx`).

---

## 6. Shadows & Glows

Emerald and gold accents emit a subtle colored glow in addition to standard drop shadow.

```css
.glow-emerald {
  box-shadow: 0 0 24px rgba(22, 199, 132, 0.35), 0 8px 30px rgba(0, 0, 0, 0.5);
}
.glow-gold {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 8px 30px rgba(0, 0, 0, 0.5);
}
```

- Emerald glow → primary buttons, active state, "money up" highlights.
- Gold glow → settlement totals, awards, positive money flash.
- `.snooker-ball` uses a **bevel render**: inset dark bottom shadow
  (`inset 0 -6px 0 rgba(0,0,0,0.35)`), inset top-left highlight
  (`inset 3px 3px 6px rgba(255,255,255,0.25)`), plus `0 4px 10px rgba(0,0,0,0.5)`.

---

## 7. Motion & Animation

Animations are powered by **Framer Motion** and CSS transitions.

- **Springs**: the default spring is `type: "spring"`, `stiffness` ≈ 200–260,
  `damping` ≈ 20–30 (≈ 250ms settle). Page/screen transitions use `spring` motion
  with a short `opacity` + subtle `y` slide.
- **Micro-interactions**: button press scale (≈ `0.97`), list item fade/slide,
  number-roll for live scores (`.roll-num` container with overflow hidden so digits
  roll vertically).
- **Confetti** on frame win / settlement complete (`src/components/ui/confetti.tsx`).
- **Tab switching** in the live match uses layout-preserving `AnimatePresence` fades.

### `prefers-reduced-motion`

A global guard in `globals.css` disables all animation/transition when the user
requests reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

New animated components must still render a correct end-state even with all animation
durations forced to ~0.

---

## 8. Component Inventory

UI primitives live in `src/components/ui/`;

- `button.tsx` — variants: default (emerald), gold, **violation (amber)**, secondary, ghost,
  destructive, glass; `size` sm/md/lg/**tile (equal 56px)**/icon/iconSm. `rounded-full`, active glow.
- `card.tsx` — glass surface (24px radius) with optional header/footer.
- `badge.tsx` — pill labels (e.g. frame status, player color, "LIVE").
- `sheet.tsx` — mobile slide-over panel (glass-strong).
- `stat.tsx` — stat block for scoreboard / dashboard numbers.
- `snooker-ball.tsx` — renderable ball with `BALL_HEX` color + `.snooker-ball` bevel.
- `confetti.tsx` — celebration overlay on win/settle.

### Game / feature components (`src/components/game`, `layout`, `settlement`)

- `LiveMatch.tsx` — the full live scoring board (two-zone: action + analytics).
- `TurnHeader.tsx` / `MoneyStrip.tsx` — compact shooter identity with always-visible money + live running-balance rail.
- `ViolationPanel.tsx` / `TurnCluster.tsx` — segmented fouls and equal-height turn controls.
- `ClearRack.tsx` — non-blocking inline colour-order rack (replaces the old modal).
- `NewSession.tsx` — session setup (players, mode, money rate, per-point/per-ball).
- `PlayerCard.tsx`, `BallPad.tsx`, `EventLog.tsx`.
- `app-shell.tsx` — layout shell: ambient glow, `Sidebar` (desktop), `BottomNav` (mobile),
  safely padded main area.
- `SettlementPanel.tsx` — runs `optimizeTransfers` and renders the minimal transfer table.

---

## 9. Accessibility (WCAG)

- **Contrast**: near-black `#050505` background with `#f3f7f4` foreground text gives a
  very high luminance contrast ratio (≫ 7:1, AAA for normal text). Emerald `#16c784`
  on `#050505` clears WCAG AA for large/UI text and is reserved for primary actions and
  icons; body copy is `#f3f7f4`. `muted` `#8a8f8c` is used only for secondary/hint text.
- **Focus visible**: `--ring: #16c784` focus ring on interactive elements; keyboard
  focus order follows document order (sidebar, main, bottom nav).
- **Targets**: all interactive targets are ≥ **44px** (`min-h`/`min-w` enforced on
  buttons and nav items) — the mobile bottom-nav and ball pad hit areas meet and exceed
  Apple HIG / Android 48dp guidance.
- **Reduced motion** honored globally (see §7).
- **Color not sole indicator**: player identity uses icon/color + name label; money up/down
  pairs color with `+`/`−` sign; mode/status shown with readable text.
- Screen-reader labels are provided on icon-only buttons; the sheet uses an accessible
  dialog role with Escape-to-close.
- `scroll-behavior: smooth` is set but overridden to `auto` under reduced motion;
  `overscroll-behavior-y: none` prevents pull-to-refresh breaking the match view.

---

## 10. Mobile & Safe Areas

The app is PWA-first and portrait-optimized:

- Safe-area utility classes: `.safe-top`, `.safe-bottom`, `.pt-safe`, `.pb-safe`
  (render with `env(safe-area-inset-*)` guarded by `@supports (padding: max(0px))`).
- `-webkit-tap-highlight-color: transparent` removes default tap flash.
- Hide-scrollbar helpers (`.no-scrollbar`) for horizontal ball rows / stat scroll.