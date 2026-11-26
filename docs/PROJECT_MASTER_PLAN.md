# PROJECT MASTER PLAN
## Dinosaur Evolution Runner

**Project Type:** Reddit Arcade Game  
**Platform:** Reddit  
**Framework:** Devvit Web  
**Game Engine:** Phaser 4.2.1  
**Language:** TypeScript  
**Build Tool:** Vite  
**Server Framework:** Hono  
**Database:** Devvit Redis  
**Development Environment:** Antigravity

---

# 1. PROJECT VISION

Dinosaur Evolution Runner is a minimalist 2D endless-running arcade game inspired by Chrome's offline Dinosaur Game.

The game introduces a unique transformation mechanic that allows players to evolve into different dinosaur species, each possessing specialized abilities and movement mechanics.

Players must avoid obstacles, collect evolution orbs, adapt to changing environments, and survive for as long as possible.

The game will be integrated into Reddit through Devvit, allowing players to compete through personal records and community leaderboards.

## Primary Objectives

1. Build an enjoyable and responsive endless-runner game.
2. Introduce meaningful dinosaur transformation mechanics.
3. Create distinct environments with progressive difficulty.
4. Provide competitive gameplay through Reddit leaderboards.
5. Deliver a polished experience on desktop and mobile.
6. Maintain a modular, scalable and maintainable codebase.

---

# 2. PRODUCT REQUIREMENTS

## 2.1 Core Gameplay

The game must support:

- Automatic dinosaur movement.
- Jumping and specialized dinosaur abilities.
- Randomized obstacle generation.
- Collision detection.
- Evolution orb collection.
- Temporary dinosaur transformations.
- Environment progression.
- Increasing difficulty.
- Score calculation.
- Game-over and restart functionality.

## 2.2 Dinosaur Species

### T-Rex — Standard Form
- Default starting dinosaur.
- Automatically runs.
- Tap or press Space to jump.
- Balanced movement characteristics.

### Pterodactyl — Flying Form
- Tap and hold to glide close to the ground.
- Can avoid selected ground obstacles.
- Must navigate aerial obstacles.
- Has specialized aerial movement.

### Triceratops — Charging Form
- Tap to activate a forward charge.
- Can destroy designated breakable obstacles.
- Has a limited charge duration.
- Cannot destroy every obstacle.

### Ankylosaurus — Defensive Form
- Tap to activate temporary armour.
- Can survive one otherwise fatal collision while protected.
- Has a defined cooldown.
- Cannot remain permanently protected.

## 2.3 Transformation System

- Transformation is activated by collecting evolution orbs.
- The orb selects an alternative dinosaur.
- Transformation lasts approximately 10 seconds initially.
- The final three seconds provide a visual warning.
- The player returns to T-Rex when transformation expires.
- Consecutive transformations are permitted.
- Immediate repetition of the same dinosaur should be avoided where possible.

All balancing values must remain configurable.

## 2.4 Environment Progression

The game will contain four initial environments:

1. Desert — 0–500 metres.
2. Grasslands — 500–1,200 metres.
3. Jungle — 1,200–2,000 metres.
4. Volcanic Lands — 2,000 metres onward.

Environment transitions should be visually smooth.

Each environment must introduce appropriate obstacle combinations without creating unavoidable collisions.

## 2.5 Competition

The initial competitive features include:

- Personal best.
- Top 10 leaderboard.
- Daily leaderboard.
- Weekly leaderboard.
- Subreddit all-time leaderboard.

The game remains single-player during an individual run.

Competition is asynchronous through recorded scores.

---

# 3. DEVELOPMENT PHASES

Each phase must have a defined objective, implementation requirements, testing requirements and completion criteria.

A phase cannot be marked complete simply because its code has been generated.

## PHASE 1 — GAME DESIGN AND ARCHITECTURE

**Status:** Completed

### Objectives
- Establish the game concept.
- Define gameplay mechanics.
- Define dinosaur abilities.
- Define environment progression.
- Select the technology stack.
- Establish project architecture.
- Establish development standards.

### Deliverables
- GAME_DESIGN_DOCUMENT.md
- ARCHITECTURE.md
- ROADMAP.md
- PROJECT_MASTER_PLAN.md

### Success Criteria
- Core gameplay is documented.
- Dinosaur abilities are clearly differentiated.
- Technical architecture is established.
- Development phases are defined.

---

## PHASE 2 — PROJECT INITIALIZATION

**Status:** Completed — initial Devvit project successfully created and launched.

### Objectives
- Establish the Devvit development environment.
- Confirm Reddit playtesting works.
- Understand the generated project structure.
- Audit existing configurations.
- Prepare Antigravity instructions.

### Existing Technology
- Devvit Web.
- Phaser 4.2.1.
- TypeScript.
- Vite.
- Hono.
- Devvit Redis.

### Requirements
- Preserve working Devvit configuration.
- Understand existing client and server entry points.
- Identify template code that will eventually be replaced.
- Resolve architectural issues before implementing dependent features.
- Establish documentation and project rules.

### Success Criteria
- Project launches inside Reddit.
- Development server works.
- Existing configurations are understood.
- Antigravity understands the project architecture.
- No unnecessary dependency replacements.

---

## PHASE 3 — CORE GAMEPLAY FOUNDATION

**Status:** Completed

### Objective
Build the first playable version using only the T-Rex.

### Implementation Tasks

1. Establish the logical game coordinate system.
2. Implement the game loop.
3. Create the T-Rex character.
4. Implement running animation.
5. Implement jumping mechanics.
6. Create scrolling ground.
7. Implement cactus spawning.
8. Implement obstacle movement.
9. Implement collision detection.
10. Implement score tracking.
11. Implement game-over state.
12. Implement restart functionality.

### Technical Requirements
- Use a fixed logical gameplay coordinate system.
- Separate gameplay simulation from rendering.
- Use delta-time-based movement.
- Avoid frame-rate-dependent physics.
- Keep collision detection predictable.
- Ensure responsive scaling.
- Clean up scene event listeners.

### Testing Requirements
- Dinosaur jumps correctly.
- Dinosaur cannot jump infinitely.
- Obstacles spawn at valid intervals.
- Collision detection works.
- Score increases consistently.
- Restart resets the game correctly.
- No duplicate event listeners after restarting.

### Success Criteria

A player can open the Reddit game, start running, jump over obstacles, accumulate a score, lose through collision and restart successfully.

This phase must produce a stable playable prototype.

---

## PHASE 4 — OBSTACLE AND SPAWNING SYSTEM

**Status:** Completed

### Objective
Create a reusable obstacle generation system.

### Implementation Tasks
- Cactus obstacles.
- Rock obstacles.
- Flying birds.
- Low branches.
- Ground gaps.
- Obstacle combinations.
- Spawn intervals.
- Spawn difficulty scaling.
- Object cleanup and pooling where beneficial.

### Technical Requirements
- Obstacles must use reusable configurations.
- Spawn positions must be predictable and testable.
- Avoid unavoidable obstacle combinations.
- Obstacle difficulty must be configurable.
- Avoid unnecessary object creation during gameplay.

### Success Criteria
- Multiple obstacle types work correctly.
- Obstacles spawn without overlapping unfairly.
- Obstacle cleanup does not cause memory leaks.
- Difficulty can increase without breaking gameplay.

---

## PHASE 5 — TRANSFORMATION SYSTEM

**Status:** Completed

### Objective
Introduce the evolution orb and temporary dinosaur transformations.

### Implementation Tasks
- Evolution orb entity.
- Orb spawning.
- Orb collection.
- Transformation state management.
- Dinosaur switching.
- Transformation countdown.
- Expiration handling.
- Transformation effects.
- Transformation HUD.

### Technical Requirements
- Transformation logic must be independent of rendering.
- Dinosaur state must remain consistent during transformations.
- Collecting another orb must follow defined transformation rules.
- Expiration must return the player to T-Rex.
- Collision hitboxes must adapt to dinosaur forms.

### Success Criteria
- Orbs spawn correctly.
- Collecting an orb triggers a transformation.
- Dinosaur visuals and movement change correctly.
- Transformation expires at the correct time.
- No broken game states during repeated transformations.

---

## PHASE 6 — DINOSAUR ABILITIES

**Status:** Completed

### Objective
Implement the unique gameplay abilities of each dinosaur.

### Implementation Tasks

**T-Rex**
- Jumping.
- Jump animation.
- Landing animation.

**Pterodactyl**
- Low-glide movement.
- Glide animation.
- Aerial collision handling.

**Triceratops**
- Charging movement.
- Destructible obstacle interaction.
- Charge animation.
- Charge duration and cooldown.

**Ankylosaurus**
- Armour activation.
- Damage prevention.
- Armour visual effect.
- Cooldown handling.

### Technical Requirements
- Each dinosaur must have its own movement configuration.
- Abilities must be modular.
- Cooldowns must be configurable.
- Ability activation must have visual feedback.
- No dinosaur should become objectively superior in every situation.

### Success Criteria
- Every dinosaur has a distinct gameplay identity.
- All abilities work correctly.
- Abilities interact properly with obstacles.
- Transformations preserve gameplay consistency.

---

## PHASE 7 — ENVIRONMENT AND DIFFICULTY SYSTEM

**Status:** Completed

### Objective
Introduce progressive environments and increasingly challenging gameplay.

### Implementation Tasks
- Desert environment.
- Grasslands environment.
- Jungle environment.
- Volcanic environment.
- Environment transitions.
- Background movement.
- Environmental obstacle configurations.
- Progressive running speed.
- Spawn frequency adjustment.
- Maximum difficulty limit.

### Technical Requirements
- Environment changes must not interrupt gameplay.
- Background layers should scroll independently.
- Each environment must have appropriate obstacle types.
- Difficulty must increase gradually.
- Maximum speed must be capped.
- Every obstacle combination must remain reasonably avoidable.

### Success Criteria
- Environments transition correctly.
- New environments introduce meaningful variation.
- Difficulty progresses consistently.
- The game remains playable at higher scores.

---

## PHASE 8 — USER INTERFACE, ANIMATION AND AUDIO

**Status:** Completed

### Objective
Create a polished arcade experience.

### Implementation Tasks
- Start screen.
- Gameplay HUD.
- Score display.
- Distance display.
- Dinosaur indicator.
- Transformation timer.
- Game-over screen.
- Personal best display.
- Restart button.
- Sound effects.
- Background audio where appropriate.
- Particle effects.
- Transformation animations.
- Screen feedback.

### Design Requirements
- Minimalist visual language.
- Consistent typography.
- Clear information hierarchy.
- Restrained colour palette.
- Smooth transitions.
- No unnecessary interface elements.
- Mobile-first interaction considerations.

### Success Criteria
- Interface is visually consistent.
- Gameplay information is readable.
- Animations communicate important events.
- Audio can be controlled appropriately.
- UI works on mobile and desktop.

---

## PHASE 9 — REDDIT INTEGRATION AND COMPETITION

**Status:** Pending

### Objective
Connect gameplay with Reddit identity and persistent competitive records.

### Implementation Tasks
- Identify authenticated Reddit players.
- Implement score submission.
- Implement score validation.
- Store personal best.
- Implement top 10 rankings.
- Implement daily rankings.
- Implement weekly rankings.
- Implement subreddit all-time rankings.

### Technical Requirements
- Use Devvit server APIs.
- Use Redis for persistent records.
- Scope records appropriately.
- Never blindly trust client-submitted scores.
- Validate score submissions on the server.
- Prevent duplicate or malformed submissions.
- Handle network errors gracefully.
- Avoid exposing sensitive player information.

### Success Criteria
- Scores persist after sessions.
- Players can retrieve their records.
- Leaderboards display correct rankings.
- Invalid scores are rejected.
- Reddit identity integration works correctly.

---

## PHASE 10 — TESTING AND QUALITY ASSURANCE

**Status:** Pending

### Objective
Verify the complete game before publishing.

### Testing Categories

**Gameplay**
- Movement.
- Jumping.
- Collision.
- Transformations.
- Dinosaur abilities.
- Obstacle generation.
- Difficulty progression.

**Technical**
- TypeScript compilation.
- Production build.
- Unit tests.
- Server tests.
- Memory and performance checks.
- Error handling.

**Platform**
- Reddit desktop experience.
- Reddit mobile experience.
- Expanded game mode.
- Network interruptions.
- Authentication.
- Score persistence.

### Success Criteria
- No critical gameplay bugs.
- No critical security vulnerabilities.
- All essential tests pass.
- Production build succeeds.
- Game remains responsive during extended runs.
- Mobile and desktop interactions work.

---

## PHASE 11 — REDDIT PUBLISHING AND LAUNCH

**Status:** Pending

### Objective
Prepare and publish the game to Reddit.

### Implementation Tasks
- Finalize app configuration.
- Prepare custom post experience.
- Prepare game presentation.
- Verify permissions.
- Complete required Devvit checks.
- Test installation and launch.
- Prepare publishing materials.
- Complete Reddit review requirements.
- Publish the application.

### Success Criteria
- Devvit publishing requirements are satisfied.
- Game installs successfully.
- Players can launch and complete a run.
- Leaderboards work.
- The published experience matches the tested build.

---

# 4. DEVELOPMENT GUIDELINES

These rules apply throughout the entire project.

## 4.1 Architecture

- Follow modular architecture.
- Separate rendering from gameplay logic.
- Keep game systems independently testable.
- Separate client and server responsibilities.
- Use shared types where appropriate.
- Avoid unnecessary abstractions.
- Follow the existing Devvit project structure unless there is a justified reason to change it.

## 4.2 Code Quality

- Use TypeScript strict mode.
- Avoid unnecessary type assertions.
- Avoid `any` unless explicitly justified.
- Use descriptive names.
- Keep functions focused.
- Avoid duplicated logic.
- Handle errors explicitly.
- Remove unused code.
- Do not introduce unnecessary dependencies.

## 4.3 Phaser Development

- Target the installed Phaser 4.2.1 API.
- Do not copy Phaser 3 examples without checking compatibility.
- Manage scene lifecycle correctly.
- Clean up event listeners.
- Avoid unnecessary object creation.
- Use appropriate animation and asset management.
- Keep game simulation independent of rendering where practical.

## 4.4 Performance

- Target smooth gameplay.
- Avoid excessive DOM manipulation.
- Avoid unnecessary server requests.
- Reuse objects where beneficial.
- Keep assets optimized.
- Avoid memory leaks.
- Test on lower-powered mobile devices.

## 4.5 Responsive Design

- Support desktop and mobile.
- Use appropriate input handling.
- Maintain readable HUD elements.
- Preserve gameplay proportions.
- Handle viewport changes.
- Do not allow Reddit interface constraints to break the game.

## 4.6 Antigravity Working Rules

Before every major implementation:

1. Inspect the existing code.
2. Identify affected files.
3. Explain the proposed implementation.
4. Identify dependencies.
5. Implement only the approved scope.
6. Run relevant tests.
7. Run type checking and linting.
8. Report changed files.
9. Document remaining issues.
10. Recommend the next logical task.

Never:
- Rewrite the entire project unnecessarily.
- Replace working Devvit configurations without justification.
- Implement several unrelated systems in one task.
- Ignore existing project conventions.
- Claim a feature works without testing it.
- Introduce placeholder implementations as completed features.

---

# 5. TESTING AND COMPLETION POLICY

Every phase must pass its success criteria before the next dependent phase begins.

A phase is considered complete only when:

- Its required functionality is implemented.
- Its acceptance criteria are satisfied.
- Relevant tests pass.
- Type checking passes.
- Linting passes.
- No unresolved critical defects remain.
- Documentation is updated.

If a test fails, investigate and fix the problem before proceeding.

Do not hide failing tests or mark incomplete functionality as complete.

---

# 6. PROJECT DOCUMENTATION POLICY

The following files are the project's documentation source of truth:

**GAME_DESIGN_DOCUMENT.md**
Defines what the game is and how gameplay should work.

**ARCHITECTURE.md**
Defines how the game is technically structured and implemented.

**ROADMAP.md**
Tracks phases, implementation tasks and development progress.

**PROJECT_MASTER_PLAN.md**
Defines the entire project lifecycle, requirements, guidelines, success criteria and completion standards.

**AGENTS.md**
Defines the coding and implementation instructions Antigravity must follow.

When a project decision changes, update the relevant documentation.

Avoid contradictory specifications across documents.

---

# 7. FINAL PROJECT SUCCESS GOALS

The project will be considered successfully delivered when:

1. Players can launch the game inside Reddit.
2. The game has responsive and enjoyable endless-runner mechanics.
3. Four dinosaur species have distinct abilities.
4. Evolution orbs trigger temporary transformations.
5. Four environments progressively introduce new challenges.
6. Difficulty scales appropriately.
7. Players can save and retrieve personal bests.
8. Reddit community leaderboards work correctly.
9. Desktop and mobile experiences are supported.
10. The game passes required quality and platform checks.
11. The application is successfully published on Reddit.

---

# 8. LONG-TERM EXPANSION POSSIBILITIES

These are future opportunities, not launch requirements:

- Additional dinosaur species.
- More environments.
- Unlockable dinosaur skins.
- Daily missions.
- Achievements.
- Special event environments.
- Seasonal challenges.
- Additional power-ups.
- Community competitions.
- New obstacle types.

Do not implement these features before the initial release unless explicitly approved.

---

# 9. PROJECT GOVERNANCE

This document is the master reference for development.

The project architect is responsible for maintaining technical consistency and deciding implementation order.

Antigravity is responsible for implementing approved tasks within the documented architecture.

Every significant architectural change must be reviewed and documented.

The priority order is:

1. Correct functionality.
2. Stable architecture.
3. Performance.
4. Responsive experience.
5. Visual polish.
6. Additional features.

**Final principle: Build a stable, enjoyable game first. Expand it without compromising the foundation.**