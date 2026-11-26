/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { OBSTACLE_CATALOG } from './obstacles.ts';
import { tryCreateSafeOrb } from './spawner.ts';
import { ALTERNATIVE_SPECIES, DINOSAUR_SPECS } from './species.ts';
import {
  applyEvolutionOrb,
  createTransformationState,
  stepTransformationTimer,
} from './transformations.ts';
import type { Obstacle, ObstacleTypeId } from './types.ts';

function fixedRng(value: number): () => number {
  return () => value;
}

function makeObstacle(id: number, typeId: ObstacleTypeId, x: number): Obstacle {
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

void describe('Phase 5 Species & Transformation System', () => {
  void it('defines independent visual and collision dimensions for all four species', () => {
    for (const species of ['trex', ...ALTERNATIVE_SPECIES] as const) {
      const spec = DINOSAUR_SPECS[species];
      assert.ok(spec.visualWidth > 0 && spec.visualHeight > 0);
      assert.ok(spec.hitboxWidth > 0 && spec.hitboxHeight > 0);
      assert.ok(spec.hitboxWidth < spec.visualWidth);
      assert.ok(spec.hitboxHeight < spec.visualHeight);
      assert.ok(spec.hitboxOffsetX >= 0 && spec.hitboxOffsetY >= 0);
    }
  });

  void it('avoids immediate repetition on consecutive orb collections and resets timer', () => {
    const tState = createTransformationState(DEFAULT_RUNNER_CONFIG);
    const first = applyEvolutionOrb(tState, fixedRng(0));
    assert.notEqual(first, 'trex');
    assert.equal(tState.remainingSeconds, 10);
    assert.equal(tState.warningActive, false);

    // Collect during transformation flash window (e.g. 0.2s elapsed)
    stepTransformationTimer(tState, 0.2);
    const second = applyEvolutionOrb(tState, fixedRng(0));
    assert.notEqual(second, first);
    assert.equal(tState.remainingSeconds, 10);
    assert.equal(tState.warningActive, false);
    assert.equal(tState.warningEmitted, false);

    // Advance into final 3-second warning window, then collect again
    stepTransformationTimer(tState, 7.5);
    assert.equal(tState.warningActive, true);
    const third = applyEvolutionOrb(tState, fixedRng(0));
    assert.notEqual(third, second);
    assert.equal(tState.remainingSeconds, 10);
    assert.equal(tState.warningActive, false);
    assert.equal(tState.warningEmitted, false);
  });

  void it('emits warning and expiration events exactly once per transformation', () => {
    const tState = createTransformationState(DEFAULT_RUNNER_CONFIG);
    applyEvolutionOrb(tState, fixedRng(0.4));

    let warningCount = 0;
    let expiredCount = 0;

    // Step in 0.25s increments for 12 seconds
    for (let i = 0; i < 48; i += 1) {
      const res = stepTransformationTimer(tState, 0.25);
      if (res.warningTriggered) {
        warningCount += 1;
      }
      if (res.expired) {
        expiredCount += 1;
      }
    }

    assert.equal(warningCount, 1);
    assert.equal(expiredCount, 1);
    assert.equal(tState.activeSpecies, 'trex');
    assert.equal(tState.remainingSeconds, 0);
    assert.equal(tState.warningActive, false);
  });

  void it('handles large delta-time updates cleanly without duplicate events or invalid state', () => {
    const tState = createTransformationState(DEFAULT_RUNNER_CONFIG);
    applyEvolutionOrb(tState, fixedRng(0.5));

    // Jump straight past 10s duration in one large step
    const first = stepTransformationTimer(tState, 15.0);
    assert.equal(first.expired, true);
    assert.equal(first.warningTriggered, false);
    assert.equal(tState.activeSpecies, 'trex');
    assert.equal(tState.remainingSeconds, 0);

    // Subsequent step must not re-emit expiration
    const second = stepTransformationTimer(tState, 5.0);
    assert.equal(second.expired, false);
    assert.equal(second.warningTriggered, false);
  });

  void it('places orbs fairly around every obstacle category and skips when no safe path exists', () => {
    const spawnX = DEFAULT_RUNNER_CONFIG.worldWidth + 40;

    // 1. Over a ground gap at spawnX -> must shift to safe ground (+110) or skip if blocked
    const gapObs = [makeObstacle(1, 'ground_gap_wide', spawnX - 10)];
    const orbNearGap = tryCreateSafeOrb(spawnX, 1, DEFAULT_RUNNER_CONFIG, gapObs);
    if (orbNearGap) {
      assert.ok(orbNearGap.x >= gapObs[0]!.x + gapObs[0]!.width + 40);
    }

    // 2. Around cactus / rock -> picks jump-arc orb or shifted ground orb
    for (const typeId of [
      'cactus_small',
      'rock_solid',
      'bird_low',
      'bird_high',
      'low_branch',
    ] as const) {
      const obs = [makeObstacle(1, typeId, spawnX)];
      const orb = tryCreateSafeOrb(spawnX, 1, DEFAULT_RUNNER_CONFIG, obs);
      assert.ok(orb !== null, `Expected safe orb candidate around ${typeId}`);
    }

    // 3. Completely saturated hazard corridor -> must skip (return null) rather than force
    const saturated: Obstacle[] = [
      makeObstacle(1, 'ground_gap_wide', spawnX - 60),
      makeObstacle(2, 'cactus_tall', spawnX + 90),
      makeObstacle(3, 'bird_low', spawnX + 200),
    ];
    const skipped = tryCreateSafeOrb(spawnX, 1, DEFAULT_RUNNER_CONFIG, saturated);
    assert.equal(skipped, null);
  });
});
