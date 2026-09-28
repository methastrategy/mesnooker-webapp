# Design System — Mesnooker ("Raycast Precision")

Mesnooker's visual identity is built on the **Raycast Design System**: a high-density, macOS-inspired dark workspace engineered for zero-latency snooker match scoring, live money tracking, and tactical shot analysis.

## Core Design Principles

1. **Zero Drop Shadows & Zero Glows**: Elevation is communicated strictly through a 4-step dark surface color ladder and `1px solid` hairline borders (`#242728`). All `box-shadow` and `drop-shadow` utilities are globally neutralized.
2. **Mechanical Keycap Tactility**: Interactive controls (`SnookerBall`, `ActionButton`, `Button`, `.action-key`) use physical Y-axis keycap depression (`translateY: 2px`), top-edge anodized border highlights (`border-t-white/25`), and subtle brightness compression (`brightness(0.82–0.88)`) rather than 2D scale shrinking.
3. **Mobile-First Ergonomics (320px–430px)**:
   - **Scroll-Linked Compact Mode (`TurnHeader.tsx`)**: Sticky live scoreboard automatically compresses vertical padding, scales down typography, and condenses the shooter/up-next bar when scrolling down on mobile.
   - **Single-Row Non-Jumping `BallPad.tsx`**: Always renders all 7 snooker balls in a single horizontal row with dynamic left/right gradient fade hints for 320px screens.

---

## 1. Surface & Color Tokens (`src/app/globals.css`)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--color-background` / `--background` | `#07080a` | Deepest canvas background |
| `--color-surface` / `--muted` | `#0d0d0d` | Recessed or secondary surface (ball rack, inputs, pills) |
| `--color-card-solid` | `#101111` | Elevated modal / sheet surface (`.glass-strong`) |
| `--color-card` / `--card` | `#121212` | Primary card & panel surface (`.glass`) |
| `--color-line` / `--border` | `#242728` | `1px solid` structural hairline border |
| `--color-foreground` / `--foreground` | `#f4f4f6` | Primary crisp text |
| `--color-muted` / `--muted-foreground` | `#9c9c9d` | Secondary / muted labels (with `#d3d3d4` for high-contrast sublabels) |
| `--color-primary` / `--primary` | `#57c1ff` | Raycast Accent Blue — primary CTA, active shooter, positive money |
| `--color-primary-hover` | `#3ca2de` | Primary CTA hover state |
| `--color-gold` / `--gold` | `#ffc533` | Raycast Warm Gold — leader badges, break counters, solve snooker |
| `--color-danger` / `--destructive` | `#ff6161` | Raycast Coral Red — fouls, negative money, destructive actions |

---

## 2. Typography & Radii

- **Font Stack**: `Inter Variable`, `Inter`, `-apple-system`, `SF Pro Display`, system sans-serif with OpenType features `"calt", "kern", "liga", "ss03"`.
- **Numeric Discipline**: All scores, clocks, and money balances use `font-mono tabular-nums`.
- **Corner Radii**:
  - Cards & Containers: `8px`–`10px` (`rounded-[8px]`, `rounded-[10px]`, `rounded-lg`)
  - Keycap Buttons: `8px` (`rounded-[8px]`)
  - Badges & Micro-Pills: `4px`–`6px` (`rounded-[4px]`, `rounded-[6px]`)
  - Snooker Balls: `9999px` (`rounded-full`)