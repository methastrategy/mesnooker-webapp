# Mesnooker Engineering & UI/UX Design Conventions

## 1. Web Audio API & Sound Discipline
- **Singleton AudioContext:** NEVER instantiate `new AudioContext()` inside button click or tap event handlers. Always use the shared singleton in `src/lib/sound.ts`.
- **Autoplay Handling:** Always check `ctx.state === "suspended"` and call `void ctx.resume()` on user gesture before playing audio.
- **Procedural Audio:** Prefer Web Audio synthesis (oscillators and gain ramps) for snappy feedback (< 0.1s) without network latency or external asset loading.

## 2. Geometry Solver & Drag Performance
- **Visual Position vs. Heavy Solve:** In interactive canvas/SVG tables, NEVER run deep BFS raycast calculations (such as `solveEscape`) synchronously on every single `pointermove` event.
- **Decoupled 120fps Updates:** Update the ball's visual position immediately using `moveBall(id, pos, skipSolve = true)`.
- **Throttled Solver Execution:** Throttle solver calls during active drag to ~40ms intervals using `performance.now()` / `setTimeout`.
- **Pointer-Up Final Invariant:** Always trigger a clean, synchronous `solve()` on `pointerup` / `pointerleave` to guarantee 100% calculation precision on release.

## 3. Snooker Visual Realism & Table Aesthetics
- **Ball Specular Gloss:** Ensure `<defs>` gradient IDs match ball fill attributes (e.g. `ballGloss` / `sss-gloss`).
- **Ambient Ball Drop-Shadow:** Always render a soft drop-shadow ellipse beneath balls on the baize felt to anchor them in 3D space (`rx={BALL_R * 0.94}`, `ry={BALL_R * 0.72}`, `filter="url(#ball-shadow-blur)"`).
- **Cushion Height & Pockets:** Cushions must cast subtle drop-shadows onto the cloth edges (`cushion-drop-*`). Pockets should feature layered brass casting plates and leather drop depths.
- **Physical Tap Feedback:** Snooker balls are rigid phenolic resin (Aramith). NEVER squash them with unequal aspect ratios (`scaleX/scaleY`). Use uniform micro-depression `{ scale: 0.94, y: 1 }`.

## 4. Mobile Ergonomics & Bilingual Standards
- **Bottom Navigation Balance:** Keep mobile bottom dock labels short (1–2 words, max 10 chars per item) to prevent text wrapping or button crowding on 360px–390px viewports.
- **Bilingual Consistency:** All user-facing UI labels must support `locale` (`th` / `en`) via `src/lib/i18n.ts` and persist via Zustand `gameStore`.
