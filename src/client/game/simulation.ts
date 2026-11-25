import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import {
  computeCurrentSpeed,
  computeDifficultyFactor,
  computeSafeReactionGap,
  selectSpawnPattern,
  spawnPatternObstacles,
} from './spawner.ts';
import type {
  Obstacle,
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

function isTrexOverGap(state: RunnerState): boolean {
  const footCenterX = state.trex.x + state.trex.width * 0.5;
  for (const obstacle of state.obstacles) {
    if (obstacle.kind !== 'gap') {
      continue;
    }
    // Slight edge forgiveness so landing on the lip doesn't feel unfair
    if (footCenterX > obstacle.x + 8 && footCenterX < obstacle.x + obstacle.width - 8) {
      return true;
    }
  }
  return false;
}

/**
 * Creates a fresh Phase 4 runner state with T-Rex grounded at the starting line.
 */
export function createRunnerState(
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG,
): RunnerState {
  return {
    status: 'running',
    trex: {
      x: config.trexX,
      y: config.groundY,
      vy: 0,
      width: config.trexWidth,
      height: config.trexHeight,
      isGrounded: true,
      isFallingInGap: false,
    },
    obstacles: [],
    nextObstacleId: 1,
    distanceToNextSpawn: computeSafeReactionGap(config.baseSpeed, 0, config),
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
    return { jumped: false, collided: false };
  }

  const dt = Math.min(Math.max(dtSeconds, 0), config.maxDeltaSeconds);
  if (dt === 0) {
    return { jumped: false, collided: false };
  }

  state.difficulty = computeDifficultyFactor(state.distance, config);
  state.speed = computeCurrentSpeed(state.difficulty, config);

  let jumped = false;

  // Jump only when grounded and not already falling into a gap
  if (input.jumpPressed && state.trex.isGrounded && !state.trex.isFallingInGap) {
    state.trex.vy = config.jumpVelocity;
    state.trex.isGrounded = false;
    jumped = true;
  }

  const overGap = isTrexOverGap(state);

  if (state.trex.isGrounded && overGap) {
    state.trex.isGrounded = false;
    state.trex.isFallingInGap = true;
  }

  // Vertical kinematics
  if (!state.trex.isGrounded) {
    state.trex.vy += config.gravity * dt;
    state.trex.y += state.trex.vy * dt;

    if (state.trex.y >= config.groundY) {
      if (!overGap && !state.trex.isFallingInGap) {
        state.trex.y = config.groundY;
        state.trex.vy = 0;
        state.trex.isGrounded = true;
      } else {
        state.trex.isFallingInGap = true;
        if (state.trex.y >= config.groundY + config.gapFallThreshold) {
          state.status = 'gameover';
          return { jumped, collided: true };
        }
      }
    }
  }

  // Continuous ground & distance progression
  const dx = state.speed * dt;
  state.groundOffset += dx;
  state.distance += dx / config.pixelsPerMeter;
  state.score = Math.floor(state.distance * config.scorePerMeter);

  // Move existing obstacles (birds include conservative speedOffset) and prune off-screen ones
  const activeObstacles: Obstacle[] = [];
  for (const obstacle of state.obstacles) {
    obstacle.x -= (state.speed + obstacle.speedOffset) * dt;
    if (obstacle.x + obstacle.width > -80) {
      activeObstacles.push(obstacle);
    }
  }
  state.obstacles = activeObstacles;

  // Spawn next obstacle pattern when distance threshold is reached
  state.distanceToNextSpawn -= dx;
  if (state.distanceToNextSpawn <= 0) {
    const pattern = selectSpawnPattern(state.difficulty, rng);
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

  // Forgiving AABB collision check against solid/aerial/branch hazards
  const trexRect: Rect = {
    left: state.trex.x + config.hitboxPaddingX,
    right: state.trex.x + state.trex.width - config.hitboxPaddingX,
    top: state.trex.y - state.trex.height + config.hitboxPaddingY,
    bottom: state.trex.y - config.hitboxPaddingY,
  };

  for (const obstacle of state.obstacles) {
    if (obstacle.kind === 'gap') {
      continue;
    }
    const obstacleRect: Rect = {
      left: obstacle.x + 2,
      right: obstacle.x + obstacle.width - 2,
      top: obstacle.y - obstacle.height + 2,
      bottom: obstacle.y - 2,
    };
    if (rectsOverlap(trexRect, obstacleRect)) {
      state.status = 'gameover';
      return { jumped, collided: true };
    }
  }

  return { jumped, collided: false };
}
