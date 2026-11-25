import { CACTUS_DIMENSIONS, CACTUS_VARIANTS, DEFAULT_RUNNER_CONFIG } from './constants.ts';
import type {
  CactusObstacle,
  CactusVariant,
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

function pickRandomVariant(rng: () => number): CactusVariant {
  const index = Math.floor(rng() * CACTUS_VARIANTS.length);
  const clamped = Math.max(0, Math.min(CACTUS_VARIANTS.length - 1, index));
  const variant = CACTUS_VARIANTS[clamped];
  return variant ?? 'small';
}

function computeSpawnInterval(config: RunnerConfig, rng: () => number): number {
  const span = config.maxSpawnInterval - config.minSpawnInterval;
  return config.minSpawnInterval + rng() * span;
}

/**
 * Creates a fresh Phase 3 runner state with T-Rex grounded at the starting line.
 */
export function createRunnerState(
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG,
  rng: () => number = Math.random,
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
    },
    obstacles: [],
    nextObstacleId: 1,
    spawnTimer: computeSpawnInterval(config, rng),
    speed: config.baseSpeed,
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

  let jumped = false;

  // Jump only when grounded (prevents infinite mid-air jumping)
  if (input.jumpPressed && state.trex.isGrounded) {
    state.trex.vy = config.jumpVelocity;
    state.trex.isGrounded = false;
    jumped = true;
  }

  // Vertical kinematics
  if (!state.trex.isGrounded) {
    state.trex.vy += config.gravity * dt;
    state.trex.y += state.trex.vy * dt;

    if (state.trex.y >= config.groundY) {
      state.trex.y = config.groundY;
      state.trex.vy = 0;
      state.trex.isGrounded = true;
    }
  }

  // Continuous ground & distance progression
  const dx = state.speed * dt;
  state.groundOffset += dx;
  state.distance += dx / config.pixelsPerMeter;
  state.score = Math.floor(state.distance * config.scorePerMeter);

  // Move existing obstacles and prune off-screen ones
  const activeObstacles: CactusObstacle[] = [];
  for (const obstacle of state.obstacles) {
    obstacle.x -= dx;
    if (obstacle.x + obstacle.width > -60) {
      activeObstacles.push(obstacle);
    }
  }
  state.obstacles = activeObstacles;

  // Spawn new cactus when timer expires
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const variant = pickRandomVariant(rng);
    const dims = CACTUS_DIMENSIONS[variant];
    const newObstacle: CactusObstacle = {
      id: state.nextObstacleId,
      variant,
      x: config.worldWidth + 40,
      y: config.groundY,
      width: dims.width,
      height: dims.height,
    };
    state.nextObstacleId += 1;
    state.obstacles.push(newObstacle);
    state.spawnTimer = computeSpawnInterval(config, rng);
  }

  // Forgiving AABB collision check
  const trexRect: Rect = {
    left: state.trex.x + config.hitboxPaddingX,
    right: state.trex.x + state.trex.width - config.hitboxPaddingX,
    top: state.trex.y - state.trex.height + config.hitboxPaddingY,
    bottom: state.trex.y - config.hitboxPaddingY,
  };

  for (const obstacle of state.obstacles) {
    const obstacleRect: Rect = {
      left: obstacle.x + 2,
      right: obstacle.x + obstacle.width - 2,
      top: obstacle.y - obstacle.height + 2,
      bottom: obstacle.y,
    };
    if (rectsOverlap(trexRect, obstacleRect)) {
      state.status = 'gameover';
      return { jumped, collided: true };
    }
  }

  return { jumped, collided: false };
}
