# Architecture Specification — Dinosaur Evolution Runner

> **Authoritative Lifecycle Reference**: [`docs/PROJECT_MASTER_PLAN.md`](./PROJECT_MASTER_PLAN.md)

---

## 1. Current Baseline vs. Target Architecture

### Current Baseline (Phase 2 — Template State)
- **Client**: `splash.html` (`splash.ts`) → `game.html` (`game.ts`) initializing **Phaser `4.2.1`** with `Phaser.Scale.RESIZE` and 5 template scenes (`Boot`, `Preloader`, `MainMenu`, `Game`, `GameOver`). `Game.ts` currently implements the starter counter demo (`/api/init`, `/api/increment`, `/api/decrement`).
- **Server**: **Hono `4.13.17`** (`src/server/index.ts`) with REST routes in `src/server/routes/` (`api.ts`, `forms.ts`, `menu.ts`, `triggers.ts`) reading/writing a single global Redis key (`'count'`).
- **Shared**: `src/shared/api.ts` defines TypeScript type aliases for the starter counter demo.

### Target Architecture
A modular separation between:
1. **Pure Simulation & Domain Logic** (Phaser-free, delta-time-based, unit-tested via `node --test`).
2. **Phaser 4.2.1 Presentation & Input Layer** (Scenes, animations, parallax environments, object pooling, HUD, audio).
3. **Devvit Web Server & Redis Layer** (Hono REST endpoints, authenticated Reddit identity, server-side score validation, scoped Devvit Redis leaderboards).

---

## 2. Client Architecture (`src/client/`)

### Entrypoints (`devvit.json`)
- **`splash.html` + `splash.ts` (`inline: true`)**: Must remain lightweight (no Phaser import). Displays the inline Reddit feed card and calls `requestExpandedMode(e, 'game')` from `@devvit/web/client`.
- **`game.html` + `game.ts` (Expanded View)**: Hosts `#game-container` and boots the Phaser `4.2.1` `Game` instance.

### Coordinate System & Responsive Viewport
The project uses `Phaser.Scale.RESIZE`, where `this.scale.width` and `this.scale.height` adapt to desktop modals and mobile Reddit iFrames.
- **Rule**: Gameplay physics, hitboxes, ground Y, and obstacle spawning must operate in a **fixed logical gameplay coordinate system**, completely decoupled from raw screen pixels.
- **Rendering**: A responsive camera/viewport mapping scales the logical world cleanly to fit any aspect ratio while HUD elements anchor to `this.scale.width` / `this.scale.height`.
- **Lifecycle Safety**: Every scene that attaches `this.scale.on('resize', handler)` **must** remove that exact handler on `Phaser.Scenes.Events.SHUTDOWN` to prevent duplicate listeners and memory leaks across restarts.

### Planned Client Module Structure
```text
src/client/
  game.ts                  # Phaser 4.2.1 GameConfig & startup
  splash.ts                # Lightweight inline Devvit splash
  game/                    # Pure TypeScript simulation (no Phaser imports)
    constants.ts           # Configurable physics, species, orb & environment tuning
    types.ts               # DinosaurSpecies, ObstacleType, EnvironmentId, GameState
    simulation.ts          # Delta-time step(), movement, abilities, AABB collision
    spawner.ts             # Fair obstacle & evolution orb generation
    transformations.ts     # ~10s transformation timer, 3s warning, species rules
  assets/
    manifest.ts            # Typed asset keys & paths
  services/
    apiClient.ts           # Typed fetch() wrappers with runtime validation (no `as` casts)
    audio.ts               # SFX/BGM controller + mute state
  scenes/
    Boot.ts                # Minimal preloader assets
    Preloader.ts           # Responsive loading bar + asset manifest loading
    MainMenu.ts            # Start screen, personal best / leaderboard entry
    Game.ts                # Bridges pure simulation <-> Phaser sprites, parallax, HUD, audio
    GameOver.ts            # Run summary, validated score submission, restart
```

### Simulation vs. Rendering Boundary
- `simulation.ts` advances world state using clamped `dt` (delta-time) so physics never depends on frame rate.
- `Game.ts` reads keyboard/touch input, steps the simulation, syncs pooled Phaser sprites/animations and parallax layers to simulation state, and triggers audio/particle feedback on domain events.

---

## 3. Server & Shared Architecture (`src/server/`, `src/shared/`)

### Communication Pattern
- **Hono REST + Shared Types**: Client calls `/api/*` using `fetch()`, validated at runtime against shared `type` aliases in `src/shared/api.ts` (zero `as` type casts per `AGENTS.md`).
- **Devvit Server Context**: Access `context`, `redis`, and `reddit` (`reddit.getCurrentUsername()`) via `@devvit/web/server`.

### Planned API Endpoints (`src/server/routes/api.ts`)
- `GET /api/init`: Returns authenticated `username`, `postId`, player's personal best, and initial leaderboard snapshot.
- `POST /api/run/complete`: Validates run payload (`score`, `distance`, `timestamp`/session checks), enforces plausibility bounds, prevents duplicate/malformed submissions, updates Devvit Redis records, and returns updated personal best and rank.
- `GET /api/leaderboard`: Queries ranked entries by scope (`top10`, `daily`, `weekly`, `alltime`).

### Planned Devvit Redis Schema (Phase 9)
All keys must be scoped appropriately (replacing the template's global `'count'` key):
- `lb:alltime:{subredditOrPost}` — Sorted set for subreddit all-time & Top 10 rankings.
- `lb:daily:{scope}:{YYYY-MM-DD}` — Sorted set for daily rankings (with TTL).
- `lb:weekly:{scope}:{YYYY-Www}` — Sorted set for weekly rankings (with TTL).
- `user:best:{scope}:{username}` — Hash/JSON storing personal best score, distance, and metadata.

### Internal Devvit Routes (`src/server/routes/`)
- `/internal/menu/post-create` → creates custom post (`src/server/core/post.ts`).
- `/internal/triggers/on-app-install` → auto-creates initial post on app install.
- Any new menu, form, or trigger endpoint must be registered in `devvit.json`.

---

## 4. Build, TypeScript & Platform Constraints

- **TypeScript (`6.0.3`)**: Composite project references in `tools/tsconfig.*.json` (`strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`, `noUnusedLocals: true`, `noUnusedParameters: true`).
- **Vite (`8.3.7`)**: `@devvit/start/vite` builds `dist/client` and `dist/server/index.cjs`.
- **Devvit Web Sandbox Rules**:
  - Devvit Web only (no `@devvit/public-api` Blocks).
  - No `window.alert`, `window.location`, `window.assign`, or inline `<script>` tags.
  - Prefer `type` aliases, named exports, and runtime validation instead of `as` type casts.
