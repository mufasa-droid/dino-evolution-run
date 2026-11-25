/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { OBSTACLE_CATALOG, SPAWN_PATTERNS } from './obstacles.ts';
import {
  computeCurrentSpeed,
  computeDifficultyFactor,
  computeJumpAirTime,
  computeMaxSafeGapWidth,
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

void describe('Phase 4 Obstacle & Pattern Spawner', () => {
  void it('scales difficulty gradually and respects maxSpeed', () => {
    const d0 = computeDifficultyFactor(0, DEFAULT_RUNNER_CONFIG);
    const dMid = computeDifficultyFactor(1200, DEFAULT_RUNNER_CONFIG);
    const dMax = computeDifficultyFactor(5000, DEFAULT_RUNNER_CONFIG);

    assert.equal(d0, 0);
    assert.ok(dMid > d0 && dMid < 1);
    assert.equal(dMax, 1);

    assert.equal(computeCurrentSpeed(0, DEFAULT_RUNNER_CONFIG), DEFAULT_RUNNER_CONFIG.baseSpeed);
    assert.equal(computeCurrentSpeed(1, DEFAULT_RUNNER_CONFIG), DEFAULT_RUNNER_CONFIG.maxSpeed);
    assert.equal(computeCurrentSpeed(2, DEFAULT_RUNNER_CONFIG), DEFAULT_RUNNER_CONFIG.maxSpeed);
  });

  void it('unlocks patterns progressively based on difficulty', () => {
    const rng = createSeededRng(42);
    for (let i = 0; i < 100; i += 1) {
      const early = selectSpawnPattern(0, rng, SPAWN_PATTERNS);
      assert.equal(early.minDifficulty, 0);
    }
  });

  void it('validates ground-gap widths against actual T-Rex jump physics', () => {
    const airTime = computeJumpAirTime(DEFAULT_RUNNER_CONFIG);
    const baseJumpSpan = DEFAULT_RUNNER_CONFIG.baseSpeed * airTime;
    const maxSafeGap = computeMaxSafeGapWidth(
      DEFAULT_RUNNER_CONFIG.baseSpeed,
      DEFAULT_RUNNER_CONFIG,
    );

    assert.ok(OBSTACLE_CATALOG.ground_gap_small.width <= maxSafeGap);
    assert.ok(OBSTACLE_CATALOG.ground_gap_wide.width <= maxSafeGap);
    assert.ok(maxSafeGap < baseJumpSpan);
  });

  void it('guarantees fair spacing, non-overlapping obstacles, and viable survival paths across 1,000+ spawns', () => {
    const rng = createSeededRng(1337);
    let nextId = 1;
    let totalPatterns = 0;

    for (let step = 0; step < 1100; step += 1) {
      const difficulty = (step % 100) / 100;
      const speed = computeCurrentSpeed(difficulty, DEFAULT_RUNNER_CONFIG);
      const pattern = selectSpawnPattern(difficulty, rng, SPAWN_PATTERNS);
      const spawnX = DEFAULT_RUNNER_CONFIG.worldWidth + 40;

      const batch = spawnPatternObstacles(
        pattern,
        spawnX,
        nextId,
        speed,
        difficulty,
        DEFAULT_RUNNER_CONFIG,
        rng,
      );
      nextId = batch.nextObstacleId;
      totalPatterns += 1;

      // Verify obstacles inside a pattern do not overlap horizontally
      const sorted = [...batch.obstacles].sort((a, b) => a.x - b.x);
      let patternRight = spawnX;
      for (let i = 0; i < sorted.length; i += 1) {
        const current = sorted[i];
        if (!current) {
          assert.fail('Expected obstacle in sorted batch');
        }
        patternRight = Math.max(patternRight, current.x + current.width);

        // Gap width must never exceed safe jump clearance
        if (current.kind === 'gap') {
          assert.ok(current.width <= computeMaxSafeGapWidth(speed, DEFAULT_RUNNER_CONFIG));
        }

        // Overhead obstacles (low_branch, bird_high) must leave T-Rex clearance underneath
        if (current.kind === 'branch' || current.typeId === 'bird_high') {
          const clearanceUnder = DEFAULT_RUNNER_CONFIG.groundY - current.y;
          assert.ok(clearanceUnder > DEFAULT_RUNNER_CONFIG.trexHeight);
        }

        const next = sorted[i + 1];
        if (next) {
          assert.ok(current.x + current.width < next.x);
        }
      }

      // Verify inter-pattern spacing always exceeds minimum safe reaction gap
      const patternSpan = patternRight - spawnX;
      const minGap = computeSafeReactionGap(speed, difficulty, DEFAULT_RUNNER_CONFIG);
      assert.ok(batch.distanceToNextSpawn >= patternSpan + minGap);
    }

    assert.ok(totalPatterns >= 1000);
  });
});
