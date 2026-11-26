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
  orbWidth: 28,
  orbHeight: 28,
  orbUnlockDistanceMeters: 400,
  minOrbSpawnDistance: 4600,
  maxOrbSpawnDistance: 6800,
  orbRetryDistance: 220,
  transformationDurationSeconds: 10,
  transformationWarningSeconds: 3,
  abilities: {
    trexLandingDurationSeconds: 0.12,
    pterodactylGlideMaxFallSpeed: 65,
    pterodactylGlideElevation: 42,
    triceratopsChargeDurationSeconds: 1.2,
    triceratopsChargeCooldownSeconds: 3.0,
    triceratopsChargeSpeedMultiplier: 1.45,
    triceratopsChargeMaxSpeed: 720,
    ankylosaurusArmourDurationSeconds: 2.5,
    ankylosaurusArmourCooldownSeconds: 4.0,
    ankylosaurusInvulnerabilitySeconds: 0.6,
  },
};
