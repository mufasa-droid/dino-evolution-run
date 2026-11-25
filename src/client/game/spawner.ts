import { OBSTACLE_CATALOG, SPAWN_PATTERNS } from './obstacles.ts';
import type { Obstacle, RunnerConfig, SpawnPattern } from './types.ts';

/**
 * Computes normalized difficulty in [0, 1] from distance traveled.
 */
export function computeDifficultyFactor(
  distance: number,
  config: RunnerConfig,
): number {
  if (config.difficultyDistanceForMax <= 0) {
    return 1;
  }
  const ratio = Math.max(0, Math.min(1, distance / config.difficultyDistanceForMax));
  // Smooth ease-out curve so early progression is gentle and late-game stays controlled
  return 1 - Math.pow(1 - ratio, 1.4);
}

/**
 * Computes current horizontal speed in [baseSpeed, maxSpeed].
 */
export function computeCurrentSpeed(
  difficulty: number,
  config: RunnerConfig,
): number {
  const clamped = Math.max(0, Math.min(1, difficulty));
  return config.baseSpeed + (config.maxSpeed - config.baseSpeed) * clamped;
}

/**
 * Exact airborne duration for a full ground-to-ground T-Rex jump.
 */
export function computeJumpAirTime(config: RunnerConfig): number {
  return (2 * Math.abs(config.jumpVelocity)) / config.gravity;
}

/**
 * Maximum ground-gap width that T-Rex can safely clear with landing margin.
 */
export function computeMaxSafeGapWidth(
  speed: number,
  config: RunnerConfig,
): number {
  const jumpSpan = speed * computeJumpAirTime(config);
  return Math.floor(jumpSpan * 0.55);
}

/**
 * Minimum safe reaction distance between the end of one pattern and the start of the next.
 */
export function computeSafeReactionGap(
  speed: number,
  difficulty: number,
  config: RunnerConfig,
  extraBirdMargin = 0,
): number {
  const jumpAirTime = computeJumpAirTime(config);
  const recoverySeconds = 0.42 - 0.16 * Math.max(0, Math.min(1, difficulty));
  return speed * (jumpAirTime + recoverySeconds) + extraBirdMargin;
}

/**
 * Selects an eligible spawn pattern weighted by config at the current difficulty.
 */
export function selectSpawnPattern(
  difficulty: number,
  rng: () => number,
  patterns: readonly SpawnPattern[] = SPAWN_PATTERNS,
): SpawnPattern {
  const eligible = patterns.filter((p) => p.minDifficulty <= difficulty);
  const pool = eligible.length > 0 ? eligible : patterns;

  let totalWeight = 0;
  for (const pattern of pool) {
    totalWeight += pattern.weight;
  }

  let roll = rng() * totalWeight;
  for (const pattern of pool) {
    roll -= pattern.weight;
    if (roll <= 0) {
      return pattern;
    }
  }

  const fallback = pool[pool.length - 1];
  if (!fallback) {
    throw new Error('SPAWN_PATTERNS must not be empty');
  }
  return fallback;
}

export type SpawnBatchResult = {
  readonly obstacles: Obstacle[];
  readonly nextObstacleId: number;
  readonly distanceToNextSpawn: number;
};

/**
 * Instantiates obstacles for a pattern starting at spawnX and computes the next
 * safe spawn distance (accounting for pattern width and any bird speed offsets).
 */
export function spawnPatternObstacles(
  pattern: SpawnPattern,
  spawnX: number,
  startObstacleId: number,
  speed: number,
  difficulty: number,
  config: RunnerConfig,
  rng: () => number,
): SpawnBatchResult {
  const obstacles: Obstacle[] = [];
  let nextId = startObstacleId;
  let patternRightEdge = spawnX;
  let maxBirdOffset = 0;

  const maxSafeGap = computeMaxSafeGapWidth(speed, config);

  for (const item of pattern.items) {
    const def = OBSTACLE_CATALOG[item.typeId];
    const clampedWidth =
      def.kind === 'gap' ? Math.min(def.width, maxSafeGap) : def.width;
    const x = spawnX + item.offsetX;
    const y = config.groundY - def.elevationAboveGround;

    obstacles.push({
      id: nextId,
      typeId: def.typeId,
      kind: def.kind,
      x,
      y,
      width: clampedWidth,
      height: def.height,
      destructible: def.destructible,
      speedOffset: def.speedOffset,
    });

    nextId += 1;
    patternRightEdge = Math.max(patternRightEdge, x + clampedWidth);
    maxBirdOffset = Math.max(maxBirdOffset, def.speedOffset);
  }

  const patternSpan = patternRightEdge - spawnX;
  const extraBirdMargin = maxBirdOffset > 0 ? maxBirdOffset * 1.5 : 0;
  const minSafeGap = computeSafeReactionGap(
    speed,
    difficulty,
    config,
    extraBirdMargin,
  );
  const gapMultiplier =
    config.minSpawnGapMultiplier +
    rng() * (config.maxSpawnGapMultiplier - config.minSpawnGapMultiplier);

  return {
    obstacles,
    nextObstacleId: nextId,
    distanceToNextSpawn: patternSpan + minSafeGap * gapMultiplier,
  };
}
