/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canActivateSpeciesAbility,
  createAbilityState,
  resetAbilityState,
  stepAbilityTimers,
  tryAbsorbCollision,
  tryActivateAbility,
} from './abilities.ts';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { OBSTACLE_CATALOG } from './obstacles.ts';
import type { Obstacle, ObstacleTypeId } from './types.ts';

function makeObstacle(id: number, typeId: ObstacleTypeId, x = 150): Obstacle {
  const def = OBSTACLE_CATALOG[typeId];
  return {
    id,
    typeId: def.typeId,
    kind: def.kind,
    x,
    y: DEFAULT_RUNNER_CONFIG.groundY - def.elevationAboveGround,
    width: def.width,
    height: def.height,
    destructible: def.destructible,
    speedOffset: def.speedOffset,
  };
}

void describe('Phase 6 Ability State Machine', () => {
  void it('separates Triceratops charge duration (1.2s) from cooldown (3.0s)', () => {
    const state = createAbilityState();
    assert.equal(canActivateSpeciesAbility('triceratops', state), true);

    const activated = tryActivateAbility(
      'triceratops',
      state,
      DEFAULT_RUNNER_CONFIG.abilities,
    );
    assert.equal(activated, 'charge');
    assert.equal(state.chargeActive, true);
    assert.equal(state.chargeRemainingSeconds, 1.2);
    assert.equal(state.chargeCooldownRemainingSeconds, 3.0);

    // Charge ends after 1.2s, but cooldown still remains
    stepAbilityTimers(state, 1.25);
    assert.equal(state.chargeActive, false);
    assert.equal(state.chargeRemainingSeconds, 0);
    assert.ok(state.chargeCooldownRemainingSeconds > 0);
    assert.equal(canActivateSpeciesAbility('triceratops', state), false);

    // After full cooldown elapses, can activate again
    stepAbilityTimers(state, 3.1);
    assert.equal(state.chargeCooldownRemainingSeconds, 0);
    assert.equal(canActivateSpeciesAbility('triceratops', state), true);
  });

  void it('consumes Ankylosaurus armour on first obstacle hit and grants 0.6s invulnerability', () => {
    const state = createAbilityState();
    const activated = tryActivateAbility(
      'ankylosaurus',
      state,
      DEFAULT_RUNNER_CONFIG.abilities,
    );
    assert.equal(activated, 'armour');
    assert.equal(state.armourActive, true);
    assert.equal(state.armourRemainingSeconds, 2.5);
    assert.equal(state.armourCooldownRemainingSeconds, 4.0);

    const cactus = makeObstacle(10, 'cactus_small');
    const firstHit = tryAbsorbCollision(
      'ankylosaurus',
      state,
      cactus,
      DEFAULT_RUNNER_CONFIG.abilities,
    );
    assert.equal(firstHit.absorbed, true);
    assert.equal(firstHit.armourConsumed, true);
    assert.equal(state.armourActive, false);
    assert.equal(state.invulnerabilityRemainingSeconds, 0.6);

    // Same obstacle during invulnerability is absorbed without re-consuming armour
    const repeatedHit = tryAbsorbCollision(
      'ankylosaurus',
      state,
      cactus,
      DEFAULT_RUNNER_CONFIG.abilities,
    );
    assert.equal(repeatedHit.absorbed, true);
    assert.equal(repeatedHit.armourConsumed, false);

    // After invulnerability expires, second obstacle is lethal
    stepAbilityTimers(state, 0.65);
    const secondCactus = makeObstacle(11, 'cactus_tall');
    const secondHit = tryAbsorbCollision(
      'ankylosaurus',
      state,
      secondCactus,
      DEFAULT_RUNNER_CONFIG.abilities,
    );
    assert.equal(secondHit.absorbed, false);
    assert.equal(secondHit.armourConsumed, false);
  });

  void it('never allows armour to protect against ground gaps', () => {
    const state = createAbilityState();
    tryActivateAbility('ankylosaurus', state, DEFAULT_RUNNER_CONFIG.abilities);
    const gap = makeObstacle(20, 'ground_gap_small');
    const res = tryAbsorbCollision(
      'ankylosaurus',
      state,
      gap,
      DEFAULT_RUNNER_CONFIG.abilities,
    );
    assert.equal(res.absorbed, false);
    assert.equal(res.armourConsumed, false);
  });

  void it('resets all active abilities and cooldowns cleanly', () => {
    const state = createAbilityState();
    tryActivateAbility('triceratops', state, DEFAULT_RUNNER_CONFIG.abilities);
    state.isGliding = true;
    state.invulnerabilityRemainingSeconds = 0.5;
    state.blockedObstacleIds = [1, 2];

    resetAbilityState(state);
    assert.equal(state.chargeActive, false);
    assert.equal(state.chargeCooldownRemainingSeconds, 0);
    assert.equal(state.armourActive, false);
    assert.equal(state.armourCooldownRemainingSeconds, 0);
    assert.equal(state.isGliding, false);
    assert.equal(state.invulnerabilityRemainingSeconds, 0);
    assert.equal(state.blockedObstacleIds.length, 0);
  });
});
