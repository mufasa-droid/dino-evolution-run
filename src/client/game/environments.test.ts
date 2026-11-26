/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import {
  ENVIRONMENT_CONFIGS,
  ENVIRONMENT_ORDER,
  getEnvironmentForDistance,
  lerpEnvironmentPalette,
  lerpRgbColor,
} from './environments.ts';
import { SPAWN_PATTERNS } from './obstacles.ts';
import {
  computeCurrentSpeed,
  computeSafeReactionGap,
  selectSpawnPattern,
  spawnPatternObstacles,
} from './spawner.ts';

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

void describe('Phase 7 Environment & Difficulty System', () => {
  void it('maps exact distance thresholds to Desert, Grasslands, Jungle, and Volcanic Lands', () => {
    assert.equal(getEnvironmentForDistance(0), 'desert');
    assert.equal(getEnvironmentForDistance(499.9), 'desert');
    assert.equal(getEnvironmentForDistance(500), 'grasslands');
    assert.equal(getEnvironmentForDistance(1199.9), 'grasslands');
    assert.equal(getEnvironmentForDistance(1200), 'jungle');
    assert.equal(getEnvironmentForDistance(1999.9), 'jungle');
    assert.equal(getEnvironmentForDistance(2000), 'volcanic');
    assert.equal(getEnvironmentForDistance(5000), 'volcanic');
  });

  void it('interpolates environment palettes smoothly for sky, parallax, and ground-gap tinting', () => {
    const desert = ENVIRONMENT_CONFIGS.desert.palette;
    const grasslands = ENVIRONMENT_CONFIGS.grasslands.palette;

    const atStart = lerpEnvironmentPalette(desert, grasslands, 0);
    assert.equal(atStart.skyColor, desert.skyColor);

    const atEnd = lerpEnvironmentPalette(desert, grasslands, 1);
    assert.equal(atEnd.skyColor, grasslands.skyColor);

    const midSky = lerpRgbColor(desert.skyColor, grasslands.skyColor, 0.5);
    const atMid = lerpEnvironmentPalette(desert, grasslands, 0.5);
    assert.equal(atMid.skyColor, midSky);
    assert.notEqual(atMid.skyColor, desert.skyColor);
    assert.notEqual(atMid.skyColor, grasslands.skyColor);
  });

  void it('generates fair, T-Rex-survivable obstacle patterns across all four environments', () => {
    const rng = createSeededRng(2026);
    let nextId = 1;

    for (const envId of ENVIRONMENT_ORDER) {
      const difficulty =
        envId === 'desert'
          ? 0.1
          : envId === 'grasslands'
            ? 0.35
            : envId === 'jungle'
              ? 0.65
              : 1.0;
      const speed = computeCurrentSpeed(difficulty, DEFAULT_RUNNER_CONFIG);
      assert.ok(speed <= DEFAULT_RUNNER_CONFIG.maxSpeed);

      for (let i = 0; i < 300; i += 1) {
        const pattern = selectSpawnPattern(difficulty, rng, SPAWN_PATTERNS, envId);
        assert.ok(pattern.minDifficulty <= difficulty);

        const batch = spawnPatternObstacles(
          pattern,
          DEFAULT_RUNNER_CONFIG.worldWidth + 40,
          nextId,
          speed,
          difficulty,
          DEFAULT_RUNNER_CONFIG,
          rng,
        );
        nextId = batch.nextObstacleId;

        const minGap = computeSafeReactionGap(speed, difficulty, DEFAULT_RUNNER_CONFIG);
        assert.ok(batch.distanceToNextSpawn >= minGap);
      }
    }
  });
});
