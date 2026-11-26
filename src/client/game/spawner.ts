import { getEnvironmentPatternWeight } from './environments.ts';
import { OBSTACLE_CATALOG, SPAWN_PATTERNS } from './obstacles.ts';
import type {
  EnvironmentId,
  EvolutionOrb,
  Obstacle,
  RunnerConfig,
  SpawnPattern,
} from './types.ts';

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
 * Selects an eligible spawn pattern weighted by config and environment at the current difficulty.
 */
export function selectSpawnPattern(
  difficulty: number,
  rng: () => number,
  patterns: readonly SpawnPattern[] = SPAWN_PATTERNS,
  environmentId: EnvironmentId = 'desert',
): SpawnPattern {
  const eligible = patterns.filter((p) => p.minDifficulty <= difficulty);
  const pool = eligible.length > 0 ? eligible : patterns;

  let totalWeight = 0;
  for (const pattern of pool) {
    totalWeight += getEnvironmentPatternWeight(pattern, environmentId);
  }

  let roll = rng() * totalWeight;
  for (const pattern of pool) {
    roll -= getEnvironmentPatternWeight(pattern, environmentId);
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

export function computeNextOrbDistance(
  config: RunnerConfig,
  rng: () => number,
): number {
  const span = config.maxOrbSpawnDistance - config.minOrbSpawnDistance;
  return config.minOrbSpawnDistance + rng() * span;
}

function isOrbPathSafe(
  orbX: number,
  orbElevation: number,
  config: RunnerConfig,
  obstacles: readonly Obstacle[],
): boolean {
  const orbW = config.orbWidth;
  const orbH = config.orbHeight;
  const orbBottomY = config.groundY - orbElevation;
  const orbTopY = orbBottomY - orbH;

  const isGroundOrb = orbElevation <= 20;
  const approachMargin = isGroundOrb ? 95 : 115;
  const exitMargin = isGroundOrb ? 95 : 145;
  const pathLeft = orbX - approachMargin;
  const pathRight = orbX + orbW + exitMargin;

  for (const obs of obstacles) {
    const obsLeft = obs.x;
    const obsRight = obs.x + obs.width;
    const obsBottomY = obs.y;
    const obsTopY = obs.y - obs.height;

    // Never spawn an orb whose collection/landing path overlaps a ground gap
    if (obs.kind === 'gap') {
      if (pathLeft < obsRight + 40 && pathRight > obsLeft - 40) {
        return false;
      }
      continue;
    }

    if (isGroundOrb) {
      // Ground-level orbs are safe only if no ground-blocking hazard is in the path
      const blocksGround =
        obs.kind === 'cactus' ||
        obs.kind === 'rock' ||
        obs.typeId === 'bird_low';
      if (blocksGround && pathLeft < obsRight && pathRight > obsLeft) {
        return false;
      }
    } else {
      // Jump-arc orbs require clear takeoff/landing zones, vertical clearance above any ground obstacle underneath, and clear air space
      const takeoffLeft = orbX - 140;
      const takeoffRight = orbX - 35;
      const landingLeft = orbX + orbW + 35;
      const landingRight = orbX + orbW + 140;

      if (obs.kind === 'cactus' || obs.kind === 'rock') {
        const inTakeoff = takeoffLeft < obsRight && takeoffRight > obsLeft;
        const inLanding = landingLeft < obsRight && landingRight > obsLeft;
        if (inTakeoff || inLanding) {
          return false;
        }
        // If underneath the orb's arc, require sufficient vertical clearance above the obstacle
        const underArc = orbX - 35 < obsRight && orbX + orbW + 35 > obsLeft;
        if (underArc && obsTopY < orbBottomY + 14) {
          return false;
        }
      }

      // Check vertical + horizontal clearance against aerial/overhead hazards
      const airHorizOverlap =
        orbX - 70 < obsRight && orbX + orbW + 70 > obsLeft;
      const airVertOverlap =
        orbTopY - 24 < obsBottomY && orbBottomY + 24 > obsTopY;
      if (airHorizOverlap && airVertOverlap) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Attempts to spawn an evolution orb along a verified fair collection path.
 * Returns null if no safe position exists (caller should skip rather than force).
 */
export function tryCreateSafeOrb(
  spawnX: number,
  orbId: number,
  config: RunnerConfig,
  obstacles: readonly Obstacle[],
): EvolutionOrb | null {
  const candidates: ReadonlyArray<{ readonly xOffset: number; readonly elevation: number }> = [
    { xOffset: 0, elevation: 12 },
    { xOffset: 0, elevation: 66 },
    { xOffset: 150, elevation: 12 },
  ];

  for (const candidate of candidates) {
    const candidateX = spawnX + candidate.xOffset;
    if (isOrbPathSafe(candidateX, candidate.elevation, config, obstacles)) {
      return {
        id: orbId,
        x: candidateX,
        y: config.groundY - candidate.elevation,
        width: config.orbWidth,
        height: config.orbHeight,
      };
    }
  }

  return null;
}
