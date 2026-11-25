import type { CactusVariant, RunnerConfig } from './types.ts';

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
  pixelsPerMeter: 24,
  scorePerMeter: 10,
  minSpawnInterval: 0.95,
  maxSpawnInterval: 1.85,
  maxDeltaSeconds: 0.05,
  hitboxPaddingX: 6,
  hitboxPaddingY: 5,
};

export const CACTUS_DIMENSIONS: Record<
  CactusVariant,
  { readonly width: number; readonly height: number }
> = {
  small: { width: 24, height: 42 },
  tall: { width: 32, height: 62 },
  cluster: { width: 54, height: 46 },
};

export const CACTUS_VARIANTS: readonly CactusVariant[] = [
  'small',
  'tall',
  'cluster',
];
