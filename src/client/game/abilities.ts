import type {
  AbilityConfig,
  AbilityKind,
  AbilityState,
  DinosaurSpecies,
  Obstacle,
} from './types.ts';

export function createAbilityState(): AbilityState {
  return {
    landingTimer: 0,
    isGliding: false,
    chargeActive: false,
    chargeRemainingSeconds: 0,
    chargeCooldownRemainingSeconds: 0,
    armourActive: false,
    armourRemainingSeconds: 0,
    armourCooldownRemainingSeconds: 0,
    invulnerabilityRemainingSeconds: 0,
    blockedObstacleIds: [],
  };
}

/**
 * Resets all active abilities, cooldowns, and temporary modifiers when
 * transforming to a new species, reverting to T-Rex, or ending a run.
 */
export function resetAbilityState(state: AbilityState): void {
  state.landingTimer = 0;
  state.isGliding = false;
  state.chargeActive = false;
  state.chargeRemainingSeconds = 0;
  state.chargeCooldownRemainingSeconds = 0;
  state.armourActive = false;
  state.armourRemainingSeconds = 0;
  state.armourCooldownRemainingSeconds = 0;
  state.invulnerabilityRemainingSeconds = 0;
  state.blockedObstacleIds = [];
}

export function canActivateSpeciesAbility(
  species: DinosaurSpecies,
  state: AbilityState,
): boolean {
  if (species === 'triceratops') {
    return !state.chargeActive && state.chargeCooldownRemainingSeconds <= 0;
  }
  if (species === 'ankylosaurus') {
    return !state.armourActive && state.armourCooldownRemainingSeconds <= 0;
  }
  return false;
}

export function tryActivateAbility(
  species: DinosaurSpecies,
  state: AbilityState,
  config: AbilityConfig,
): AbilityKind | null {
  if (!canActivateSpeciesAbility(species, state)) {
    return null;
  }

  if (species === 'triceratops') {
    state.chargeActive = true;
    state.chargeRemainingSeconds = config.triceratopsChargeDurationSeconds;
    state.chargeCooldownRemainingSeconds = config.triceratopsChargeCooldownSeconds;
    return 'charge';
  }

  if (species === 'ankylosaurus') {
    state.armourActive = true;
    state.armourRemainingSeconds = config.ankylosaurusArmourDurationSeconds;
    state.armourCooldownRemainingSeconds = config.ankylosaurusArmourCooldownSeconds;
    return 'armour';
  }

  return null;
}

/**
 * Advances active ability durations, separate cooldowns, landing timer, and
 * post-armour invulnerability using simulation delta time.
 */
export function stepAbilityTimers(
  state: AbilityState,
  dtSeconds: number,
): void {
  if (dtSeconds <= 0) {
    return;
  }

  if (state.landingTimer > 0) {
    state.landingTimer = Math.max(0, state.landingTimer - dtSeconds);
  }

  if (state.chargeActive) {
    state.chargeRemainingSeconds = Math.max(
      0,
      state.chargeRemainingSeconds - dtSeconds,
    );
    if (state.chargeRemainingSeconds <= 0) {
      state.chargeActive = false;
    }
  } else if (state.chargeCooldownRemainingSeconds > 0) {
    state.chargeCooldownRemainingSeconds = Math.max(
      0,
      state.chargeCooldownRemainingSeconds - dtSeconds,
    );
  }

  if (state.armourActive) {
    state.armourRemainingSeconds = Math.max(
      0,
      state.armourRemainingSeconds - dtSeconds,
    );
    if (state.armourRemainingSeconds <= 0) {
      state.armourActive = false;
    }
  } else if (state.armourCooldownRemainingSeconds > 0) {
    state.armourCooldownRemainingSeconds = Math.max(
      0,
      state.armourCooldownRemainingSeconds - dtSeconds,
    );
  }

  if (state.invulnerabilityRemainingSeconds > 0) {
    state.invulnerabilityRemainingSeconds = Math.max(
      0,
      state.invulnerabilityRemainingSeconds - dtSeconds,
    );
    if (state.invulnerabilityRemainingSeconds <= 0) {
      state.blockedObstacleIds = [];
    }
  }
}

export function canChargeDestroyObstacle(
  species: DinosaurSpecies,
  state: AbilityState,
  obstacle: Obstacle,
): boolean {
  return (
    species === 'triceratops' &&
    state.chargeActive &&
    obstacle.kind !== 'gap' &&
    obstacle.destructible
  );
}

/**
 * Checks whether Ankylosaurus armour or active post-hit invulnerability absorbs
 * an obstacle collision. Never protects against ground gaps.
 */
export function tryAbsorbCollision(
  species: DinosaurSpecies,
  state: AbilityState,
  obstacle: Obstacle,
  config: AbilityConfig,
): { readonly absorbed: boolean; readonly armourConsumed: boolean } {
  if (obstacle.kind === 'gap') {
    return { absorbed: false, armourConsumed: false };
  }

  // During post-hit invulnerability, ignore repeated overlap with obstacles
  if (state.invulnerabilityRemainingSeconds > 0) {
    if (!state.blockedObstacleIds.includes(obstacle.id)) {
      state.blockedObstacleIds.push(obstacle.id);
    }
    return { absorbed: true, armourConsumed: false };
  }

  if (species === 'ankylosaurus' && state.armourActive) {
    state.armourActive = false;
    state.armourRemainingSeconds = 0;
    state.invulnerabilityRemainingSeconds =
      config.ankylosaurusInvulnerabilitySeconds;
    state.blockedObstacleIds = [obstacle.id];
    return { absorbed: true, armourConsumed: true };
  }

  return { absorbed: false, armourConsumed: false };
}
