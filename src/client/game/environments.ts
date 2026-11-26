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
      skyColor: 0xd4ecfc,
      farParallaxColor: 0xa6d1b8,
      midParallaxColor: 0x6fa885,
      groundTintColor: 0xb8dca4,
      groundLineColor: 0x2f5e32,
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
      skyColor: 0xc4e3d4,
      farParallaxColor: 0x7bb599,
      midParallaxColor: 0x468568,
      groundTintColor: 0x8ec298,
      groundLineColor: 0x1f4530,
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
      skyColor: 0xe8c7ba,
      farParallaxColor: 0xb88176,
      midParallaxColor: 0x854e49,
      groundTintColor: 0xa68d88,
      groundLineColor: 0x361e1d,
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
