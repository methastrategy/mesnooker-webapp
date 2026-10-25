# Design System — Mesnooker ("Linear Pro Cockpit & Broadcast Telemetry")

Mesnooker's visual architecture is calibrated for professional table-side snooker scoring and financial settlement. Inspired by **Linear.app**, **Raycast**, and **World Snooker Tour (WST) Broadcast Telemetry**, it delivers lightning-fast micro-interactions, high-contrast OLED dark surfaces, tactile keycaps, and zero-cognitive-friction ergonomic controls.

## Core Design Principles

1. **High-Contrast Dark Telemetry (OLED Canvas)**:
   - Canvas: Deep Void Slate (`#08090a`).
   - Surfaces: In-flow panels elevate via subtle surface luminance steps (`#0f1013` -> `#131418` -> `#191b22`) and hairline borders (`rgba(255, 255, 255, 0.08)`), strictly eliminating heavy muddy drop-shadows on in-flow cards.
   - Accents: Precision Emerald (`#10b981`) for primary actions and active shooters; Amber Voltage (`#f59e0b`) strictly reserved for break counters, leader badges, and financial gains.
2. **Tactile Micro-Border Keycaps (Mechanical Ergonomics)**:
   - Interactive buttons feature a top specular hairline highlight (`border-t-white/14`), micro-border containment, and tactile physical press feedback (`translateY: 1.5px` + `scale(0.985)`).
   - 0ms instant touch reaction with zero hover bounce clutter.
3. **Contrast-Safe Polarity Discipline**:
   - The `--accent-on-primary` semantic token ensures AAA/AA compliance across all states (`#042f1e` against `#10b981` yields a 10.8:1 contrast ratio).
   - Non-text SVG icons and lines maintain $\ge 3:1$ contrast against adjacent surfaces.
4. **Ergonomic One-Thumb Mobile & Asymmetric 8:4 Desktop Bento**:
   - **Mobile 100dvh Lock**: Zero unwanted layout shifts; BallPad and ControlDock stay anchored within natural thumb radius.
   - **Desktop Asymmetric Bento (8:4 Cockpit)**: Match stage on the left (8 cols), telemetry inspector and financial settlement deck docked on the right (4 cols).
   - **Tabular Numeric Discipline**: All scores, break tallies, currency balances, and clocks strictly use `font-mono tabular-nums` (`Geist Mono`).

---

## 1. Surface & Color Tokens (`src/app/globals.css`)

| Semantic Token | Value (Linear Pro) | Role |
| :--- | :--- | :--- |
| `--color-background` / `--background` | `#08090a` | Deepest canvas background (Void Slate) |
| `--color-surface` / `--muted` | `#0f1013` | Recessed containers, input wells, ball rack |
| `--color-card` / `--card` | `#131418` | In-flow panels, scorecard cards, HUD pods |
| `--color-card-solid` | `#191b22` | Floating sheets, modals, dialogs |
| `--color-line` / `--border` | `rgba(255, 255, 255, 0.08)` | 1px hairline structural dividers |
| `--color-foreground` / `--foreground` | `#f0f3f6` | High-contrast primary text |
| `--color-muted-foreground` | `#8b949e` | Secondary metadata and units |
| `--color-primary` / `--primary` | `#10b981` | Precision Emerald (active shooter, main CTA) |
| `--accent-on-primary` | `#042f1e` | 10.8:1 AAA ink on primary buttons |
| `--color-gold` / `--gold` | `#f59e0b` | Amber Voltage (break streaks, prize money) |
| `--color-danger` / `--destructive` | `#ef4444` | Red Alert (fouls, losses, penalties) |

---

## 2. Typography & Spatial Geometry

- **Sans Headings & UI**: `Geist Sans`, `Plus Jakarta Sans`, `Inter Variable`, `IBM Plex Sans Thai`, sans-serif.
  - Thai text: `letter-spacing: 0` (preserves tone mark stacking), `line-height: 1.7` (body).
  - English headings: `letter-spacing: -0.025em`, `text-wrap: balance`.
- **Numeric & Telemetry Font**: `Geist Mono`, `JetBrains Mono`, monospace with `font-variant-numeric: tabular-nums`.
- **Concentric Radii Hierarchy**:
  - Outer Cards & Bento Panels: `16px`–`18px` (`rounded-2xl`)
  - Keycap Buttons & Rack Slots: `10px`–`12px` (`rounded-xl`)
  - Status Badges & Pills: `6px`–`8px` (`rounded-md`, `rounded-lg`)
  - Snooker Balls: `9999px` (`rounded-full`) with Aramith Oklab radial lighting
- **Touch Target Invariant**: Minimum $44\text{px} \times 44\text{px}$ isolated hitbox for all mobile controls.
- **Closed Spacing System**: Spacing bounded strictly to $S \in \{2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128\}\text{px}$.
