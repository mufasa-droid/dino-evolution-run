import {
  canChargeDestroyObstacle,
  createAbilityState,
  resetAbilityState,
  stepAbilityTimers,
  tryAbsorbCollision,
  tryActivateAbility,
} from './abilities.ts';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { getEnvironmentForDistance } from './environments.ts';
import { SPAWN_PATTERNS } from './obstacles.ts';
import {
  computeCurrentSpeed,
  computeDifficultyFactor,
  computeNextOrbDistance,
  computeSafeReactionGap,
  selectSpawnPattern,
  spawnPatternObstacles,
  tryCreateSafeOrb,
} from './spawner.ts';
import { DINOSAUR_SPECS } from './species.ts';
import {
  applyEvolutionOrb,
  createTransformationState,
  stepTransformationTimer,
} from './transformations.ts';
import type {
  AbilityKind,
  DinosaurSpecies,
  EnvironmentId,
  EvolutionOrb,
  Obstacle,
  PlayerState,
  RunnerConfig,
  RunnerInput,
  RunnerState,
  RunnerStepEvents,
} from './types.ts';

type Rect = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
};

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function getPlayerHitbox(player: PlayerState): Rect {
  const left = player.x + player.hitboxOffsetX;
  const bottom = player.y - player.hitboxOffsetY;
  return {
    left,
    right: left + player.hitboxWidth,
    top: bottom - player.hitboxHeight,
    bottom,
  };
}

function emptyEvents(): RunnerStepEvents {
  return {
    jumped: false,
    collided: false,
    orbCollected: false,
    transformedTo: null,
    transformationWarning: false,
    transformationExpired: false,
    abilityActivated: null,
    obstacleDestroyed: false,
    armourBlocked: false,
    environmentChanged: null,
  };
}

/**
 * Updates player species, visual size, and collision hitbox while preserving
 * vertical position (feet Y), vertical velocity, and grounding state.
 */
export function applySpeciesToPlayer(
  player: PlayerState,
  species: DinosaurSpecies,
): void {
  const spec = DINOSAUR_SPECS[species];
  player.species = species;
  player.visualWidth = spec.visualWidth;
  player.visualHeight = spec.visualHeight;
  player.hitboxWidth = spec.hitboxWidth;
  player.hitboxHeight = spec.hitboxHeight;
  player.hitboxOffsetX = spec.hitboxOffsetX;
  player.hitboxOffsetY = spec.hitboxOffsetY;
}

function isPlayerOverGap(state: RunnerState): boolean {
  const footCenterX =
    state.player.x + state.player.hitboxOffsetX + state.player.hitboxWidth * 0.5;
  for (const obstacle of state.obstacles) {
    if (obstacle.kind !== 'gap') {
      continue;
    }
    if (footCenterX > obstacle.x + 8 && footCenterX < obstacle.x + obstacle.width - 8) {
      return true;
    }
  }
  return false;
}

/**
 * Creates a fresh Phase 6 runner state with T-Rex grounded at the starting line.
 */
export function createRunnerState(
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG,
): RunnerState {
  const trexSpec = DINOSAUR_SPECS.trex;

  return {
    status: 'running',
    player: {
      x: config.trexX,
      y: config.groundY,
      vy: 0,
      species: 'trex',
      visualWidth: trexSpec.visualWidth,
      visualHeight: trexSpec.visualHeight,
      hitboxWidth: trexSpec.hitboxWidth,
      hitboxHeight: trexSpec.hitboxHeight,
      hitboxOffsetX: trexSpec.hitboxOffsetX,
      hitboxOffsetY: trexSpec.hitboxOffsetY,
      isGrounded: true,
      isFallingInGap: false,
    },
    abilities: createAbilityState(),
    obstacles: [],
    orbs: [],
    transformation: createTransformationState(config),
    currentEnvironment: 'desert',
    nextObstacleId: 1,
    nextOrbId: 1,
    distanceToNextSpawn: computeSafeReactionGap(config.baseSpeed, 0, config),
    distanceToNextOrb: 300,
    speed: config.baseSpeed,
    difficulty: 0,
    distance: 0,
    score: 0,
    groundOffset: 0,
  };
}

/**
 * Advances the runner simulation by dtSeconds (clamped to prevent tunneling).
 */
export function stepRunnerSimulation(
  state: RunnerState,
  input: RunnerInput,
  dtSeconds: number,
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG,
  rng: () => number = Math.random,
): RunnerStepEvents {
  if (state.status !== 'running') {
    return emptyEvents();
  }

  const dt = Math.min(Math.max(dtSeconds, 0), config.maxDeltaSeconds);
  if (dt === 0) {
    return emptyEvents();
  }

  // Advance active ability durations and cooldowns
  stepAbilityTimers(state.abilities, dt);

  let abilityActivated: AbilityKind | null = null;
  if (input.abilityPressed === true) {
    abilityActivated = tryActivateAbility(
      state.player.species,
      state.abilities,
      config.abilities,
    );
  }

  const activeSpec = DINOSAUR_SPECS[state.player.species];
  state.difficulty = computeDifficultyFactor(state.distance, config);
  const baseDifficultySpeed = computeCurrentSpeed(state.difficulty, config);
  const speciesSpeed = baseDifficultySpeed * activeSpec.movement.speedMultiplier;

  if (state.player.species === 'triceratops' && state.abilities.chargeActive) {
    state.speed = Math.min(
      config.abilities.triceratopsChargeMaxSpeed,
      speciesSpeed * config.abilities.triceratopsChargeSpeedMultiplier,
    );
  } else {
    state.speed = speciesSpeed;
  }

  let jumped = false;

  if (input.jumpPressed && state.player.isGrounded && !state.player.isFallingInGap) {
    state.player.vy = config.jumpVelocity * activeSpec.movement.jumpVelocityMultiplier;
    state.player.isGrounded = false;
    state.abilities.landingTimer = 0;
    jumped = true;
  }

  const overGap = isPlayerOverGap(state);

  if (state.player.isGrounded && overGap) {
    state.player.isGrounded = false;
    state.player.isFallingInGap = true;
  }

  // Vertical kinematics (including Pterodactyl low-glide when airborne and holding Jump)
  if (!state.player.isGrounded) {
    const glideTargetY = config.groundY - config.abilities.pterodactylGlideElevation;
    const canGlide =
      state.player.species === 'pterodactyl' &&
      !state.player.isFallingInGap &&
      (input.jumpHeld ?? false) &&
      state.player.vy >= 0;

    if (canGlide) {
      state.abilities.isGliding = true;
      if (state.player.y < glideTargetY) {
        state.player.vy = Math.min(
          state.player.vy + config.gravity * activeSpec.movement.gravityMultiplier * dt,
          config.abilities.pterodactylGlideMaxFallSpeed,
        );
        state.player.y = Math.min(glideTargetY, state.player.y + state.player.vy * dt);
      } else {
        state.player.y = glideTargetY;
        state.player.vy = 0;
      }
    } else {
      state.abilities.isGliding = false;
      state.player.vy += config.gravity * activeSpec.movement.gravityMultiplier * dt;
      state.player.y += state.player.vy * dt;
    }

    if (state.player.y >= config.groundY) {
      if (!overGap && !state.player.isFallingInGap) {
        state.player.y = config.groundY;
        state.player.vy = 0;
        state.player.isGrounded = true;
        state.abilities.isGliding = false;
        if (state.player.species === 'trex') {
          state.abilities.landingTimer = config.abilities.trexLandingDurationSeconds;
        }
      } else {
        state.player.isFallingInGap = true;
        state.abilities.isGliding = false;
        if (state.player.y >= config.groundY + config.gapFallThreshold) {
          resetAbilityState(state.abilities);
          state.status = 'gameover';
          return {
            ...emptyEvents(),
            jumped,
            collided: true,
            abilityActivated,
          };
        }
      }
    }
  } else {
    state.abilities.isGliding = false;
  }

  // Continuous ground & distance progression
  const dx = state.speed * dt;
  state.groundOffset += dx;
  state.distance += dx / config.pixelsPerMeter;
  state.score = Math.floor(state.distance * config.scorePerMeter);

  let environmentChanged: EnvironmentId | null = null;
  const nextEnvironment = getEnvironmentForDistance(state.distance);
  if (nextEnvironment !== state.currentEnvironment) {
    state.currentEnvironment = nextEnvironment;
    environmentChanged = nextEnvironment;
  }

  // Move existing obstacles & prune off-screen
  const activeObstacles: Obstacle[] = [];
  for (const obstacle of state.obstacles) {
    obstacle.x -= (state.speed + obstacle.speedOffset) * dt;
    if (obstacle.x + obstacle.width > -80) {
      activeObstacles.push(obstacle);
    }
  }
  state.obstacles = activeObstacles;

  // Move existing orbs & prune off-screen
  const activeOrbs: EvolutionOrb[] = [];
  for (const orb of state.orbs) {
    orb.x -= dx;
    if (orb.x + orb.width > -80) {
      activeOrbs.push(orb);
    }
  }
  state.orbs = activeOrbs;

  // Spawn next obstacle pattern
  state.distanceToNextSpawn -= dx;
  if (state.distanceToNextSpawn <= 0) {
    const pattern = selectSpawnPattern(
      state.difficulty,
      rng,
      SPAWN_PATTERNS,
      state.currentEnvironment,
    );
    const batch = spawnPatternObstacles(
      pattern,
      config.worldWidth + 40,
      state.nextObstacleId,
      state.speed,
      state.difficulty,
      config,
      rng,
    );
    state.nextObstacleId = batch.nextObstacleId;
    state.distanceToNextSpawn = batch.distanceToNextSpawn;
    for (const obs of batch.obstacles) {
      state.obstacles.push(obs);
    }
  }

  // Attempt fair evolution orb spawn only after reaching orbUnlockDistanceMeters
  if (state.distance >= config.orbUnlockDistanceMeters) {
    state.distanceToNextOrb -= dx;
    if (state.distanceToNextOrb <= 0) {
      const orb = tryCreateSafeOrb(
        config.worldWidth + 40,
        state.nextOrbId,
        config,
        state.obstacles,
      );
      if (orb) {
        state.nextOrbId += 1;
        state.orbs.push(orb);
        state.distanceToNextOrb = computeNextOrbDistance(config, rng);
      } else {
        state.distanceToNextOrb = config.orbRetryDistance;
      }
    }
  }

  // Check evolution orb collection before advancing timer so consecutive orbs reset cleanly
  const playerRect = getPlayerHitbox(state.player);
  let orbCollected = false;
  let transformedTo: DinosaurSpecies | null = null;
  const remainingOrbs: EvolutionOrb[] = [];

  for (const orb of state.orbs) {
    const orbRect: Rect = {
      left: orb.x,
      right: orb.x + orb.width,
      top: orb.y - orb.height,
      bottom: orb.y,
    };
    if (!orbCollected && rectsOverlap(playerRect, orbRect)) {
      orbCollected = true;
      const nextSpecies = applyEvolutionOrb(state.transformation, rng);
      applySpeciesToPlayer(state.player, nextSpecies);
      resetAbilityState(state.abilities);
      transformedTo = nextSpecies;
    } else {
      remainingOrbs.push(orb);
    }
  }
  state.orbs = remainingOrbs;

  // Advance simulation-driven transformation timer (skip decrement on exact collection frame)
  let transformationWarning = false;
  let transformationExpired = false;

  if (!orbCollected) {
    const timerResult = stepTransformationTimer(state.transformation, dt);
    transformationWarning = timerResult.warningTriggered;
    transformationExpired = timerResult.expired;
    if (timerResult.expired) {
      applySpeciesToPlayer(state.player, 'trex');
      resetAbilityState(state.abilities);
    }
  }

  // Evaluate obstacle collisions, Triceratops charge destruction, and Ankylosaurus armour
  const updatedPlayerRect = getPlayerHitbox(state.player);
  let obstacleDestroyed = false;
  let armourBlocked = false;
  const survivingObstacles: Obstacle[] = [];

  for (let i = 0; i < state.obstacles.length; i += 1) {
    const obstacle = state.obstacles[i];
    if (!obstacle) {
      continue;
    }
    if (obstacle.kind === 'gap') {
      survivingObstacles.push(obstacle);
      continue;
    }

    const obstacleRect: Rect = {
      left: obstacle.x + 2,
      right: obstacle.x + obstacle.width - 2,
      top: obstacle.y - obstacle.height + 2,
      bottom: obstacle.y - 2,
    };

    if (rectsOverlap(updatedPlayerRect, obstacleRect)) {
      if (
        canChargeDestroyObstacle(
          state.player.species,
          state.abilities,
          obstacle,
        )
      ) {
        obstacleDestroyed = true;
        continue;
      }

      const absorption = tryAbsorbCollision(
        state.player.species,
        state.abilities,
        obstacle,
        config.abilities,
      );
      if (absorption.absorbed) {
        if (absorption.armourConsumed) {
          armourBlocked = true;
        }
        survivingObstacles.push(obstacle);
        continue;
      }

      resetAbilityState(state.abilities);
      state.status = 'gameover';
      return {
        jumped,
        collided: true,
        orbCollected,
        transformedTo,
        transformationWarning,
        transformationExpired,
        abilityActivated,
        obstacleDestroyed,
        armourBlocked,
        environmentChanged,
      };
    }

    survivingObstacles.push(obstacle);
  }
  state.obstacles = survivingObstacles;

  return {
    jumped,
    collided: false,
    orbCollected,
    transformedTo,
    transformationWarning,
    transformationExpired,
    abilityActivated,
    obstacleDestroyed,
    armourBlocked,
    environmentChanged,
  };
}
