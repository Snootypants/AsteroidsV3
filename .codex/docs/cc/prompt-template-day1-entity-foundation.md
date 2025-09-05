Objective
- Implement Day 1 of Phase 3 — BaseEntity, Ship, Asteroid, Bullet with world wrap and shooting; target 60 FPS.

Scope
- Only edit: `src/framework/entities/*`, `src/framework/game/*`, `src/game/GameScene.tsx`.

Constraints
- Use constants from `src/framework/constants/gameConstants.ts`.
- Preserve contracts for `useThreeScene`, `useGameState`, and `useEntityPool`.
- Keep changes tightly scoped; avoid unrelated refactors.

Plan Request
- Propose at most 5 steps. Each step must include: (a) acceptance criteria, (b) a validation method.
- Pause after proposing the plan.

Diffs & Apply
- Show diffs for all files before applying changes, then pause.
- After apply, propose commands to run dev locally and provide a manual test checklist, then pause.

Acceptance Criteria
- Ship: WASD movement; mouse aim/rotation.
- Space to fire bullets; bullets despawn by lifetime or bounds.
- Asteroids: spawn and move according to constants.
- World wrapping for ship, bullets, asteroids.
- HUD/FPS stable; no console errors; ~60 FPS.

Validation
- Provide `npm` commands to run dev (Vite).
- Provide a manual test script: steps and expected outcomes.

Output Format
- Use concise plan (<=5 steps), then diffs preview, then apply, then validation instructions. Pause at each checkpoint for approval.

