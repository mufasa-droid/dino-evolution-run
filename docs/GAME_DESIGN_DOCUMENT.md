# Game Design Document — Dinosaur Evolution Runner

> **Status**: Target Design Specification (Implementation Pending — Phases 3–11)
> **Authoritative Lifecycle Reference**: [`docs/PROJECT_MASTER_PLAN.md`](./PROJECT_MASTER_PLAN.md)

---

## 1. High Concept

**Dinosaur Evolution Runner** is a minimalist 2D endless-running arcade game inspired by Chrome's offline Dinosaur Game, built for Reddit on **Devvit Web**.

Players start each run as a **T-Rex**, dodge increasingly challenging obstacles, collect **evolution orbs** to temporarily transform into specialized dinosaur species, adapt to four progressive prehistoric environments, and compete asynchronously on Reddit leaderboards.

---

## 2. Core Gameplay Loop

1. **Launch**: Player taps **Start** on the inline Reddit post (`splash.html`) to open expanded mode (`game.html`) and begins a run from `MainMenu`.
2. **Run & Dodge**: The dinosaur runs automatically rightward across scrolling terrain. The player jumps or triggers species-specific abilities to avoid ground and aerial hazards.
3. **Collect Evolution Orbs**: Collecting an evolution orb triggers a temporary transformation (~10 seconds initially) into an alternative dinosaur species.
4. **Adapt & Survive**: Each dinosaur form offers a distinct movement/survival advantage (gliding, charging through breakable obstacles, or temporary armour) suited to different obstacle combinations.
5. **Revert & Repeat**: During the final 3 seconds of a transformation, a visual warning alerts the player before returning to the standard **T-Rex** form. Consecutive transformations are permitted while avoiding immediate repetition of the same species where possible.
6. **Environment & Difficulty Progression**: Distance advances the player through Desert, Grasslands, Jungle, and Volcanic Lands while running speed and spawn intensity ramp smoothly up to a configurable cap.
7. **Game Over & Compete**: Colliding with a lethal obstacle (when unprotected) ends the run, displays score, distance, and personal best, and submits the validated score to Reddit leaderboards.

---

## 3. Controls & Accessibility

Designed for both **Desktop** and **Reddit Mobile iFrame**:

| Action | Desktop Input | Mobile / Touch Input |
| --- | --- | --- |
| Jump (T-Rex) / Species Ability | `Space`, `ArrowUp`, `W` | Tap / Tap-and-hold (species-dependent) |
| Restart (Game Over) | `Space`, `Enter` | Tap Restart button |
| Audio Mute Toggle | HUD Mute button | HUD Mute button |

---

## 4. Dinosaur Species & Abilities

All balancing values (speeds, durations, cooldowns, jump velocities) must remain configurable.

### 1. T-Rex — Standard Form
- **Role**: Default starting dinosaur and fallback form when transformations expire.
- **Controls & Movement**: Automatically runs; tap or press `Space` to jump. Balanced jump height, gravity, and hitbox characteristics.
- **Animations**: Run, jump, and landing animations.

### 2. Pterodactyl — Flying Form
- **Role**: Aerial evasion specialist.
- **Ability**: Tap and hold to glide close to the ground; specialized aerial movement.
- **Interactions**: Can avoid selected ground obstacles while navigating aerial hazards (e.g., flying birds, low branches).

### 3. Triceratops — Charging Form
- **Role**: Aggressive obstacle-breaker.
- **Ability**: Tap to activate a forward charge with a limited charge duration and cooldown.
- **Interactions**: Can destroy designated breakable obstacles during a charge, but cannot destroy every obstacle type.

### 4. Ankylosaurus — Defensive Form
- **Role**: Survivability specialist.
- **Ability**: Tap to activate temporary armour on a defined cooldown (cannot remain permanently protected).
- **Interactions**: Can survive one otherwise fatal collision while armour is active, with clear visual feedback.

---

## 5. Transformation System

- **Trigger**: Collecting an **evolution orb** spawned in the world.
- **Selection**: Selects an alternative dinosaur species (Pterodactyl, Triceratops, or Ankylosaurus), avoiding immediate repetition of the current species where possible.
- **Duration**: ~10 seconds initially (configurable).
- **Warning**: Final 3 seconds provide a clear visual countdown/warning on both the HUD timer and dinosaur feedback.
- **Expiration**: Automatically returns the player to **T-Rex** without breaking movement or collision state.
- **Consecutive Orbs**: Collecting another orb while transformed follows defined transformation rules and resets/updates the active form cleanly.
- **Hitbox Adaptation**: Collision hitboxes adapt accurately to each dinosaur form.

---

## 6. Obstacles & Spawning System

### Obstacle Types
- **Cactus**: Standard ground hazard.
- **Rocks**: Ground hazard (including designated breakable variants for Triceratops).
- **Flying Birds**: Aerial hazard requiring height/glide awareness.
- **Low Branches**: Overhead/mid-height hazard.
- **Ground Gaps**: Terrain gaps requiring jump or glide clearance.
- **Obstacle Combinations**: Fair, readable multi-obstacle patterns.

### Spawning Rules
- Obstacles use reusable configurations and object pooling/cleanup to avoid memory leaks.
- Spawn intervals scale with difficulty while enforcing minimum safe reaction gaps so unavoidable obstacle combinations are never generated.

---

## 7. Environment & Difficulty Progression

Smooth, non-interrupting visual transitions across four environments based on distance:

| Order | Environment | Distance Range | Notes |
| --- | --- | --- | --- |
| 1 | **Desert** | `0 – 500 m` | Starting biome; foundational cactus/rock patterns |
| 2 | **Grasslands** | `500 – 1,200 m` | Introduces expanded aerial/ground combinations |
| 3 | **Jungle** | `1,200 – 2,000 m` | Denser foliage hazards (low branches, mixed patterns) |
| 4 | **Volcanic Lands** | `2,000 m+` | End-game biome with peak difficulty |

- Multi-layer parallax backgrounds scroll independently.
- Running speed and spawn frequency increase gradually up to a **capped maximum speed** so high-score runs remain playable.

---

## 8. Scoring & Reddit Competition

- **Score & Distance**: Continuous distance tracking (metres) and score calculation during each run.
- **Competitive Records (Phase 9)**:
  - Personal Best
  - Top 10 Leaderboard
  - Daily Leaderboard
  - Weekly Leaderboard
  - Subreddit All-Time Leaderboard
- Single-player per run; asynchronous competition via server-validated Devvit Redis records.

---

## 9. UI, Visuals & Audio Direction

- **Visual Language**: Minimalist, high-contrast silhouettes, restrained colour palette, consistent typography, and clear information hierarchy optimized for small mobile Reddit iFrames.
- **Screens**:
  - **Inline Splash (`splash.html`)**: Lightweight Reddit feed card launching expanded mode.
  - **Start Screen (`MainMenu`)**: Title, start CTA, personal best / leaderboard access.
  - **Gameplay HUD (`Game`)**: Score, distance, active dinosaur indicator, transformation timer, audio mute control.
  - **Game Over (`GameOver`)**: Final score, distance, personal best indicator, leaderboard view, restart button.
- **Audio & Juice**: Sound effects (jump, landing, orb collection, transformation, charge/armour, collision), optional background audio with mute control, particle effects, transformation animations, and subtle screen feedback.
