import type {
  AlternativeSpecies,
  DinosaurSpec,
  DinosaurSpecies,
} from './types.ts';

export const ALTERNATIVE_SPECIES: readonly AlternativeSpecies[] = [
  'pterodactyl',
  'triceratops',
  'ankylosaurus',
];

/**
 * Species visual, collision, and modular movement specifications.
 * Collision hitboxes are defined explicitly and independently of sprite visual dimensions.
 */
export const DINOSAUR_SPECS: Record<DinosaurSpecies, DinosaurSpec> = {
  trex: {
    species: 'trex',
    displayName: 'T-Rex',
    visualWidth: 44,
    visualHeight: 52,
    hitboxWidth: 32,
    hitboxHeight: 42,
    hitboxOffsetX: 6,
    hitboxOffsetY: 5,
    movement: {
      jumpVelocityMultiplier: 1.0,
      gravityMultiplier: 1.0,
      speedMultiplier: 1.0,
    },
  },
  pterodactyl: {
    species: 'pterodactyl',
    displayName: 'Pterodactyl',
    visualWidth: 52,
    visualHeight: 38,
    hitboxWidth: 38,
    hitboxHeight: 26,
    hitboxOffsetX: 7,
    hitboxOffsetY: 6,
    movement: {
      jumpVelocityMultiplier: 1.05,
      gravityMultiplier: 0.9,
      speedMultiplier: 1.05,
    },
  },
  triceratops: {
    species: 'triceratops',
    displayName: 'Triceratops',
    visualWidth: 56,
    visualHeight: 46,
    hitboxWidth: 42,
    hitboxHeight: 34,
    hitboxOffsetX: 7,
    hitboxOffsetY: 5,
    movement: {
      jumpVelocityMultiplier: 0.95,
      gravityMultiplier: 1.05,
      speedMultiplier: 1.0,
    },
  },
  ankylosaurus: {
    species: 'ankylosaurus',
    displayName: 'Ankylosaurus',
    visualWidth: 54,
    visualHeight: 40,
    hitboxWidth: 40,
    hitboxHeight: 30,
    hitboxOffsetX: 7,
    hitboxOffsetY: 4,
    movement: {
      jumpVelocityMultiplier: 0.92,
      gravityMultiplier: 1.08,
      speedMultiplier: 0.96,
    },
  },
};
