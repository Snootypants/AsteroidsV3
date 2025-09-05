Build & Startup
- `npm install` then `npm run dev` (Vite) — no errors, <2s startup.

Performance
- FPS counter stable ~60 with ~200 entities; no GC spikes.

Entity Behaviors
- Ship movement: WASD; mouse aim/rotation smooth and bounded.
- Asteroid spawn/motion follow constants; bullets fire/despawn correctly.
- World wrap works for ship, asteroids, and bullets.

Collisions & Scoring
- Bullet–asteroid hits; ship invulnerability windows; score/currency increments correctly.

UI/Overlays/HUD
- Start → Play → Pause → Game Over flows; HUD updates (currency/combo) reflect events.

Regressions
- Hook contracts unchanged (`useThreeScene`, `useGameState`, `useEntityPool`).
- No new console warnings/errors; no CSS regressions in HUD/overlays.

