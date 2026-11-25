import type { RunnerConfig } from './types.ts';

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const MIN_VISIBLE_WORLD_WIDTH = 540;
export const GROUND_Y = 440;

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  groundY: GROUND_Y,
  trexX: 140,
  trexWidth: 44,
  trexHeight: 52,
  jumpVelocity: -700,
  gravity: 2000,
  baseSpeed: 380,
  maxSpeed: 540,
  difficultyDistanceForMax: 2400,
  pixelsPerMeter: 24,
  scorePerMeter: 10,
  minSpawnGapMultiplier: 1.0,
  maxSpawnGapMultiplier: 1.65,
  gapFallThreshold: 48,
  maxDeltaSeconds: 0.05,
  hitboxPaddingX: 6,
  hitboxPaddingY: 5,
};
