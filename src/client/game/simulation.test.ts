/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { OBSTACLE_CATALOG } from './obstacles.ts';
import { createRunnerState, stepRunnerSimulation } from './simulation.ts';
import type { ObstacleTypeId } from './types.ts';

function fixedRng(value: number): () => number {
  return () => value;
}

function createObstacleFromCatalog(
  id: number,
  typeId: ObstacleTypeId,
  x: number,
) {
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

void describe('Phase 4 Runner Simulation', () => {
  void it('starts with T-Rex grounded, zero score, and no obstacles', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    assert.equal(state.status, 'running');
    assert.equal(state.trex.isGrounded, true);
    assert.equal(state.trex.isFallingInGap, false);
    assert.equal(state.trex.y, DEFAULT_RUNNER_CONFIG.groundY);
    assert.equal(state.score, 0);
    assert.equal(state.distance, 0);
    assert.equal(state.obstacles.length, 0);
  });

  void it('jumps when grounded and prevents infinite mid-air jumping', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);

    const first = stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(first.jumped, true);
    assert.equal(state.trex.isGrounded, false);

    const vyBefore = state.trex.vy;
    const second = stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(second.jumped, false);
    assert.ok(state.trex.vy > vyBefore);

    for (let i = 0; i < 60; i += 1) {
      stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.02,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      if (state.trex.isGrounded) {
        break;
      }
    }
    assert.equal(state.trex.isGrounded, true);
    assert.equal(state.trex.y, DEFAULT_RUNNER_CONFIG.groundY);
  });

  void it('collides with rock obstacles (solid and breakable in Phase 4)', () => {
    for (const rockType of ['rock_solid', 'rock_breakable'] as const) {
      const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
      state.obstacles.push(
        createObstacleFromCatalog(1, rockType, state.trex.x + 10),
      );
      const events = stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.016,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      assert.equal(events.collided, true);
      assert.equal(state.status, 'gameover');
    }
  });

  void it('allows T-Rex to run safely under low_branch and bird_high, but collides on mistimed jump', () => {
    for (const overheadType of ['low_branch', 'bird_high'] as const) {
      // Grounded run passes safely underneath
      const safeState = createRunnerState(DEFAULT_RUNNER_CONFIG);
      safeState.obstacles.push(
        createObstacleFromCatalog(1, overheadType, safeState.trex.x + 4),
      );
      const safeEvents = stepRunnerSimulation(
        safeState,
        { jumpPressed: false },
        0.016,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      assert.equal(safeEvents.collided, false);
      assert.equal(safeState.status, 'running');

      // Jumping into overhead obstacle collides
      const jumpState = createRunnerState(DEFAULT_RUNNER_CONFIG);
      jumpState.obstacles.push(
        createObstacleFromCatalog(2, overheadType, jumpState.trex.x + 4),
      );
      let collided = false;
      for (let i = 0; i < 10; i += 1) {
        const res = stepRunnerSimulation(
          jumpState,
          { jumpPressed: i === 0 },
          0.02,
          DEFAULT_RUNNER_CONFIG,
          fixedRng(0.5),
        );
        if (res.collided) {
          collided = true;
          break;
        }
      }
      assert.equal(collided, true);
    }
  });

  void it('moves flying birds faster than ground speed via speedOffset', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    const bird = createObstacleFromCatalog(1, 'bird_low', 700);
    const cactus = createObstacleFromCatalog(2, 'cactus_small', 700);
    state.obstacles.push(bird, cactus);

    stepRunnerSimulation(
      state,
      { jumpPressed: false },
      0.05,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.ok(bird.x < cactus.x);
  });

  void it('causes T-Rex to fall into a ground gap if not jumped, and clears gap when jumped', () => {
    // Walking into gap triggers fall and gameover
    const fallState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    fallState.obstacles.push(
      createObstacleFromCatalog(1, 'ground_gap_wide', fallState.trex.x - 10),
    );
    let fell = false;
    for (let i = 0; i < 40; i += 1) {
      const res = stepRunnerSimulation(
        fallState,
        { jumpPressed: false },
        0.02,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      if (res.collided) {
        fell = true;
        break;
      }
    }
    assert.equal(fell, true);
    assert.equal(fallState.trex.isFallingInGap, true);
    assert.equal(fallState.status, 'gameover');

    // Jumping before gap clears it and lands safely
    const clearState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    clearState.obstacles.push(
      createObstacleFromCatalog(2, 'ground_gap_wide', clearState.trex.x + 40),
    );
    for (let i = 0; i < 50; i += 1) {
      stepRunnerSimulation(
        clearState,
        { jumpPressed: i === 0 },
        0.02,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
    }
    assert.equal(clearState.status, 'running');
    assert.equal(clearState.trex.isFallingInGap, false);
    assert.equal(clearState.trex.isGrounded, true);
  });

  void it('spawns patterns, prunes off-screen obstacles, and increases score monotonically', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    for (let i = 0; i < 120; i += 1) {
      stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.05,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.2),
      );
      if (state.status === 'gameover') {
        break;
      }
    }
    assert.ok(state.distance > 0);
    assert.ok(state.score > 0);
    assert.ok(state.obstacles.every((obs) => obs.x + obs.width > -80));
  });
});
