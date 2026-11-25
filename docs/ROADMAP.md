# Development Roadmap — Dinosaur Evolution Runner

> **Authoritative Lifecycle Reference**: [`docs/PROJECT_MASTER_PLAN.md`](./PROJECT_MASTER_PLAN.md)
> **Rule**: Never mark unimplemented features as completed. A phase is complete only when its implementation, tests, type checks, linting, and acceptance criteria are satisfied.

---

## Phase 1 — Game Design and Architecture
**Status:** Completed
- [x] Establish game concept, core loop, dinosaur species, abilities, transformation rules, and environment progression (`docs/GAME_DESIGN_DOCUMENT.md`).
- [x] Define technical architecture, coordinate system, pure simulation boundary, Hono REST API, and Redis schema (`docs/ARCHITECTURE.md`).
- [x] Define development phases, requirements, testing standards, and completion policy (`docs/PROJECT_MASTER_PLAN.md`).
- [x] Establish phase-by-phase task tracking (`docs/ROADMAP.md`) and agent rules (`AGENTS.md`).

---

## Phase 2 — Project Initialization
**Status:** Completed
- [x] Initialize Devvit Web + Phaser `4.2.1` + TypeScript `6.0.3` + Vite `8.3.7` + Hono `4.13.17` project.
- [x] Verify `npm run dev` (`devvit playtest`) launches inside Reddit.
- [x] Audit existing project structure, Devvit entrypoints (`splash.html`, `game.html`), scenes, and configs.
- [x] Align documentation (`README.md`, `AGENTS.md`, `/docs`) with the verified tech stack.

---

## Phase 3 — Core Gameplay Foundation
**Status:** Completed
- [x] Fix `scale.on('resize', ...)` listener cleanup across scenes on `SHUTDOWN`.
- [x] Establish fixed logical gameplay coordinate system decoupled from screen pixels.
- [x] Implement delta-time-based game loop and pure simulation module (`src/client/game/`).
- [x] Create T-Rex character, running animation, jumping mechanics (no infinite jump), and scrolling ground.
- [x] Implement cactus spawning, obstacle movement, and predictable AABB collision detection.
- [x] Implement score tracking, game-over state, and clean restart functionality (no duplicate listeners).
- [x] Remove template `as` type casts in `src/client/scenes/Game.ts` (remaining `splash.ts` cleanup deferred to Phase 8).
- [x] Add unit tests for jump physics, collision, score, and restart state (`npm run test:unit`).

---

## Phase 4 — Obstacle and Spawning System
**Status:** Completed
- [x] Implement reusable obstacle configurations (cactus, rocks, flying birds, low branches, ground gaps).
- [x] Support fair obstacle combinations and configurable spawn intervals.
- [x] Implement spawn difficulty scaling without unavoidable obstacle overlaps.
- [x] Add obstacle cleanup and object pooling to prevent memory leaks.
- [x] Add unit tests for spawner fairness and interval calculations.

---

## Phase 5 — Transformation System
**Status:** Pending
- [ ] Implement evolution orb entity and orb spawning.
- [ ] Implement orb collection and pure transformation state management.
- [ ] Implement dinosaur species switching and adaptive collision hitboxes.
- [ ] Implement ~10-second transformation countdown, 3-second visual warning, and expiration back to T-Rex.
- [ ] Handle consecutive transformations while avoiding immediate species repetition where possible.
- [ ] Add transformation visual effects and transformation HUD timer.
- [ ] Add unit tests for transformation timers, state transitions, and edge cases.

---

## Phase 6 — Dinosaur Abilities
**Status:** Pending
- [ ] **T-Rex**: Jumping, jump animation, and landing animation.
- [ ] **Pterodactyl**: Tap-and-hold low-glide movement, glide animation, and aerial collision handling.
- [ ] **Triceratops**: Tap forward charge, destructible obstacle interaction, charge animation, duration, and cooldown.
- [ ] **Ankylosaurus**: Tap temporary armour activation, single fatal-collision protection, armour VFX, and cooldown.
- [ ] Ensure each dinosaur has distinct configurable movement tuning and visual feedback.
- [ ] Add unit tests for ability cooldowns, durations, and obstacle interactions.

---

## Phase 7 — Environment and Difficulty System
**Status:** Pending
- [ ] Implement four progressive environments: Desert (`0–500 m`), Grasslands (`500–1,200 m`), Jungle (`1,200–2,000 m`), Volcanic Lands (`2,000 m+`).
- [ ] Implement smooth, non-interrupting environment transitions and independent multi-layer parallax scrolling.
- [ ] Configure environment-specific obstacle sets.
- [ ] Implement progressive running speed, spawn frequency adjustment, and capped maximum difficulty.
- [ ] Add unit tests for distance thresholds, speed caps, and environment transitions.

---

## Phase 8 — User Interface, Animation and Audio
**Status:** Pending
- [ ] Build minimalist start screen (`MainMenu`) and responsive `Preloader` backed by typed asset manifest.
- [ ] Build responsive gameplay HUD (score, distance, dinosaur indicator, transformation timer).
- [ ] Build game-over screen with personal best display and restart button.
- [ ] Add sound effects (jump, land, orb, transform, ability, collision) and optional background audio with mute control.
- [ ] Add particle effects, transformation animations, and subtle screen feedback.
- [ ] Customize `splash.html` / `splash.css` / `splash.ts` for Dinosaur Evolution Runner.

---

## Phase 9 — Reddit Integration and Competition
**Status:** Pending
- [ ] Identify authenticated Reddit players via `@devvit/web/server` (`reddit.getCurrentUsername()`).
- [ ] Replace template counter contracts in `src/shared/api.ts` and `src/server/routes/api.ts`.
- [ ] Implement runtime-validated client API helpers (`src/client/services/apiClient.ts`) with zero `as` casts.
- [ ] Implement `/api/run/complete` with server-side score validation and duplicate/malformed submission protection.
- [ ] Store scoped Devvit Redis records: Personal Best, Top 10, Daily, Weekly, and Subreddit All-Time leaderboards.
- [ ] Display rankings and personal bests in `MainMenu` and `GameOver` with graceful network error handling.
- [ ] Add server validation unit tests.

---

## Phase 10 — Testing and Quality Assurance
**Status:** Pending
- [ ] Verify all gameplay systems (movement, jumping, collision, transformations, abilities, spawning, difficulty).
- [ ] Run full technical checks: `npm run test:types`, `npm run lint`, `npm run test:unit`, `npm run build`.
- [ ] Profile memory and extended-run performance (verify zero listener or object pool leaks).
- [ ] Complete Reddit platform QA on desktop web and mobile (touch controls, expanded mode, resize, auth, persistence, network errors).

---

## Phase 11 — Reddit Publishing and Launch
**Status:** Pending
- [ ] Clean up unused template boilerplate (e.g., `exampleForm` if unused) and finalize `devvit.json`.
- [ ] Verify app permissions, custom post presentation, and installation trigger.
- [ ] Run `npm run deploy` (`test:types` + `lint` + `devvit upload`) and test installation in target subreddit.
- [ ] Complete Reddit review requirements and publish via `npm run launch` (`devvit publish`).
