import { ALTERNATIVE_SPECIES } from './species.ts';
import type {
  AlternativeSpecies,
  DinosaurSpecies,
  RunnerConfig,
  TransformationState,
} from './types.ts';

export function createTransformationState(
  config: RunnerConfig,
): TransformationState {
  return {
    activeSpecies: 'trex',
    lastAlternativeSpecies: null,
    remainingSeconds: 0,
    durationSeconds: config.transformationDurationSeconds,
    warningSeconds: config.transformationWarningSeconds,
    warningActive: false,
    warningEmitted: false,
    expiredEmitted: false,
    elapsedSinceTransform: 0,
  };
}

/**
 * Selects an alternative dinosaur species, avoiding immediate repetition of the
 * currently active species (or most recent alternative species when T-Rex is active).
 */
export function selectNextAlternativeSpecies(
  activeSpecies: DinosaurSpecies,
  lastAlternativeSpecies: AlternativeSpecies | null,
  rng: () => number,
): AlternativeSpecies {
  const excluded =
    activeSpecies !== 'trex' ? activeSpecies : lastAlternativeSpecies;
  const candidates =
    excluded !== null
      ? ALTERNATIVE_SPECIES.filter((s) => s !== excluded)
      : ALTERNATIVE_SPECIES;

  const pool = candidates.length > 0 ? candidates : ALTERNATIVE_SPECIES;
  const index = Math.floor(rng() * pool.length);
  const clamped = Math.max(0, Math.min(pool.length - 1, index));
  return pool[clamped] ?? 'pterodactyl';
}

/**
 * Applies an evolution orb collection: switches to a non-repeating alternative
 * species, resets the transformation timer, and clears previous warning/expiration flags.
 */
export function applyEvolutionOrb(
  state: TransformationState,
  rng: () => number,
): AlternativeSpecies {
  const nextSpecies = selectNextAlternativeSpecies(
    state.activeSpecies,
    state.lastAlternativeSpecies,
    rng,
  );

  state.activeSpecies = nextSpecies;
  state.lastAlternativeSpecies = nextSpecies;
  state.remainingSeconds = state.durationSeconds;
  state.warningActive = false;
  state.warningEmitted = false;
  state.expiredEmitted = false;
  state.elapsedSinceTransform = 0;

  return nextSpecies;
}

export type TransformationStepResult = {
  readonly warningTriggered: boolean;
  readonly expired: boolean;
};

/**
 * Advances the simulation-driven transformation countdown.
 * Guarantees warning and expiration events fire at most once per transformation.
 */
export function stepTransformationTimer(
  state: TransformationState,
  dtSeconds: number,
): TransformationStepResult {
  if (state.activeSpecies === 'trex' || dtSeconds <= 0) {
    return { warningTriggered: false, expired: false };
  }

  state.elapsedSinceTransform += dtSeconds;
  state.remainingSeconds = Math.max(0, state.remainingSeconds - dtSeconds);

  if (state.remainingSeconds <= 0) {
    state.activeSpecies = 'trex';
    state.remainingSeconds = 0;
    state.warningActive = false;

    if (!state.expiredEmitted) {
      state.expiredEmitted = true;
      return { warningTriggered: false, expired: true };
    }
    return { warningTriggered: false, expired: false };
  }

  if (state.remainingSeconds <= state.warningSeconds) {
    state.warningActive = true;
    if (!state.warningEmitted) {
      state.warningEmitted = true;
      return { warningTriggered: true, expired: false };
    }
  }

  return { warningTriggered: false, expired: false };
}
