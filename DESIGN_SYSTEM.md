# Design System — Mesnooker ("Tactile Lounge v2.0")

Mesnooker's visual identity is built on **Tactile Lounge**: a private snooker club atmosphere calibrated with warm espresso undertones, golden terracotta action accents, bottle-green felt highlights, and precision mechanical ergonomics.

## Core Design Principles

1. **Ambient Precision Depth**: Elevation is communicated through warm dark surface ladders (`#0c0a09` -> `#141210` -> `#1c1917` -> `#24201d`), frosted hairline borders (`rgba(204, 120, 92, 0.16)`), and subtle ambient specular glows.
2. **Mechanical Keycap Tactility**: Interactive controls (`SnookerBall`, `ActionButton`, `Button`, `.action-key`) feature tactile physical press feedback (`translateY: 2px` + `scale(0.98)`), top-edge rim highlights (`border-t-white/16`), and area-proportional scaling.
3. **Contrast-Safe Theme Science**: Dynamic contrast tokens (`--accent-on-primary`) ensure all action buttons achieve WCAG AA/AAA compliance across all selectable themes (`mono`, `emerald`, `forest`, `midnight`, `ember`, `violet`).
4. **Mobile & Large-Screen Ergonomics**:
   - **Sticky HUD (`TurnHeader.tsx`)**: Compresses smoothly on mobile scroll without layout jumps.
   - **Single-Row Non-Jumping `BallPad.tsx`**: Renders all 7 balls in a clean horizontal rack with tactile feedback.
   - **Asymmetric 8:4 Bento Grid (`src/app/page.tsx`)**: Balanced cockpit view for wide screens and clean single-column flow on mobile.

---

## 1. Surface & Color Tokens (`src/app/globals.css`)

| Token | Default (Mono / Lounge) | Emerald (Lounge) | Usage |
| :--- | :--- | :--- | :--- |
| `--color-background` / `--background` | `#0c0a09` | `#050505` | Deepest canvas background |
| `--color-surface` / `--muted` | `#141210` | `#0b0f0e` | Recessed surface (ball rack, inputs, pills) |
| `--color-card` / `--card` | `#1c1917` | `#111614` | Primary card & panel surface (`.glass`) |
| `--color-card-solid` | `#24201d` | `#111614` | Elevated modal / sheet surface (`.glass-strong`) |
| `--color-line` / `--border` | `rgba(204, 120, 92, 0.16)` | `rgba(22, 199, 132, 0.16)` | Hairline border |
| `--color-foreground` / `--foreground` | `#f5f5f4` | `#f3f7f4` | Primary crisp text |
| `--color-muted-foreground` | `#a8a29e` | `#8a8f8c` | Secondary / muted labels |
| `--color-primary` / `--primary` | `#cc785c` | `#16c784` | Primary action accent, active shooter |
| `--primary-foreground` / `--accent-on-primary` | `#ffffff` | `#042f1e` (AAA) | High-contrast ink on primary backgrounds |
| `--color-gold` / `--gold` | `#f59e0b` | `#f59e0b` | Warm Gold — break counters, leader badges, solve snooker |
| `--color-danger` / `--destructive` | `#ef4444` | `#ef4444` | Deep Red — fouls, negative money, destructive actions |

---

## 2. Typography & Radii

- **Display Headings**: `Fraunces` serif display (`font-heading`) with `text-wrap: balance`.
- **UI Body Font**: `Plus Jakarta Sans`, system sans-serif with OpenType features `"calt", "kern", "liga", "ss03"`.
- **Numeric Discipline**: All scores, clocks, and currency balances use `Geist Mono` (`font-mono tabular-nums`).
- **Corner Radii Hierarchy**:
  - Command Panels & Cards: `18px`–`24px` (`rounded-[20px]`, `rounded-2xl`)
  - Keycap Buttons: `12px`–`14px` (`rounded-[14px]`, `rounded-xl`)
  - Badges & Micro-Pills: `6px`–`8px` (`rounded-md`, `rounded-lg`)
  - Snooker Balls: `9999px` (`rounded-full`) with Aramith Oklab radial gradients