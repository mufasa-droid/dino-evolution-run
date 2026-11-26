import type {
  EnvironmentConfig,
  EnvironmentId,
  EnvironmentPalette,
  SpawnPattern,
} from './types.ts';

export const ENVIRONMENT_ORDER: readonly EnvironmentId[] = [
  'desert',
  'grasslands',
  'jungle',
  'volcanic',
];

export const ENVIRONMENT_CONFIGS: Record<EnvironmentId, EnvironmentConfig> = {
  desert: {
    id: 'desert',
    displayName: 'Desert',
    minDistanceMeters: 0,
    palette: {
      skyColor: 0xf5efe0,
      farParallaxColor: 0xdfd3b8,
      midParallaxColor: 0xc9b997,
      groundTintColor: 0xe8dfc8,
      groundLineColor: 0x534b3b,
    },
    patternWeightMultipliers: {
      single_cactus_small: 1.25,
      single_cactus_tall: 1.25,
      single_cactus_cluster: 1.2,
      combo_double_cactus: 1.2,
    },
  },
  grasslands: {
    id: 'grasslands',
    displayName: 'Grasslands',
    minDistanceMeters: 500,
    palette: {
      skyColor: 0xe3f1e8,
      farParallaxColor: 0xc2decb,
      midParallaxColor: 0x98c1a6,
      groundTintColor: 0xd6e5c8,
      groundLineColor: 0x3c523b,
    },
    patternWeightMultipliers: {
      single_bird_high: 1.35,
      single_bird_low: 1.35,
      single_gap_small: 1.25,
      single_gap_wide: 1.25,
      combo_rock_then_bird_high: 1.3,
    },
  },
  jungle: {
    id: 'jungle',
    displayName: 'Jungle',
    minDistanceMeters: 1200,
    palette: {
      skyColor: 0xd7ebe4,
      farParallaxColor: 0xa6ccb9,
      midParallaxColor: 0x6ea68b,
      groundTintColor: 0xb9d6bc,
      groundLineColor: 0x2a4536,
    },
    patternWeightMultipliers: {
      single_low_branch: 1.5,
      combo_branch_then_rock: 1.45,
      single_bird_low: 1.25,
      single_rock_breakable: 1.25,
    },
  },
  volcanic: {
    id: 'volcanic',
    displayName: 'Volcanic Lands',
    minDistanceMeters: 2000,
    palette: {
      skyColor: 0xf0ddd3,
      farParallaxColor: 0xcba69b,
      midParallaxColor: 0x9c6e67,
      groundTintColor: 0xc4b0aa,
      groundLineColor: 0x452b29,
    },
    patternWeightMultipliers: {
      single_rock_solid: 1.3,
      single_rock_breakable: 1.35,
      combo_gap_then_cactus: 1.3,
      combo_rock_then_bird_high: 1.3,
      single_gap_wide: 1.25,
    },
  },
};

/**
 * Resolves the active environment for a given distance in metres.
 * Thresholds: 0 (Desert), 500 (Grasslands), 1200 (Jungle), 2000+ (Volcanic Lands).
 */
export function getEnvironmentForDistance(distanceMeters: number): EnvironmentId {
  if (distanceMeters >= ENVIRONMENT_CONFIGS.volcanic.minDistanceMeters) {
    return 'volcanic';
  }
  if (distanceMeters >= ENVIRONMENT_CONFIGS.jungle.minDistanceMeters) {
    return 'jungle';
  }
  if (distanceMeters >= ENVIRONMENT_CONFIGS.grasslands.minDistanceMeters) {
    return 'grasslands';
  }
  return 'desert';
}

/**
 * Returns the environment-adjusted pattern weight without bypassing minDifficulty
 * or any spawner fairness guarantees.
 */
export function getEnvironmentPatternWeight(
  pattern: SpawnPattern,
  environmentId: EnvironmentId,
): number {
  const multiplier =
    ENVIRONMENT_CONFIGS[environmentId].patternWeightMultipliers[pattern.id] ?? 1;
  return pattern.weight * multiplier;
}

/**
 * Linearly interpolates two 24-bit RGB colours (0xRRGGBB) by t in [0, 1].
 */
export function lerpRgbColor(from: number, to: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const r1 = (from >> 16) & 0xff;
  const g1 = (from >> 8) & 0xff;
  const b1 = from & 0xff;

  const r2 = (to >> 16) & 0xff;
  const g2 = (to >> 8) & 0xff;
  const b2 = to & 0xff;

  const r = Math.round(r1 + (r2 - r1) * clamped);
  const g = Math.round(g1 + (g2 - g1) * clamped);
  const b = Math.round(b1 + (b2 - b1) * clamped);

  return (r << 16) | (g << 8) | b;
}

export function lerpEnvironmentPalette(
  from: EnvironmentPalette,
  to: EnvironmentPalette,
  t: number,
): EnvironmentPalette {
  return {
    skyColor: lerpRgbColor(from.skyColor, to.skyColor, t),
    farParallaxColor: lerpRgbColor(from.farParallaxColor, to.farParallaxColor, t),
    midParallaxColor: lerpRgbColor(from.midParallaxColor, to.midParallaxColor, t),
    groundTintColor: lerpRgbColor(from.groundTintColor, to.groundTintColor, t),
    groundLineColor: lerpRgbColor(from.groundLineColor, to.groundLineColor, t),
  };
}
