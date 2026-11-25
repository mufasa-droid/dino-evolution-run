/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { createRunnerState, stepRunnerSimulation } from './simulation.ts';

function fixedRng(value: number): () => number {
  return () => value;
}

void describe('Phase 3 Runner Simulation', () => {
  void it('starts with T-Rex grounded, zero score, and no obstacles', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG, fixedRng(0.5));
    assert.equal(state.status, 'running');
    assert.equal(state.trex.isGrounded, true);
    assert.equal(state.trex.y, DEFAULT_RUNNER_CONFIG.groundY);
    assert.equal(state.score, 0);
    assert.equal(state.distance, 0);
    assert.equal(state.obstacles.length, 0);
  });

  void it('jumps when grounded and prevents infinite mid-air jumping', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG, fixedRng(0.5));

    const first = stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(first.jumped, true);
    assert.equal(state.trex.isGrounded, false);
    assert.ok(state.trex.y < DEFAULT_RUNNER_CONFIG.groundY);

    // Pressing jump again while airborne must not trigger another jump
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

    // Advance until T-Rex lands back on the ground
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
    assert.equal(state.trex.vy, 0);
  });

  void it('spawns cacti at valid intervals and moves/despawns them via delta time', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG, fixedRng(0));
    // With rng=0, initial spawnTimer === minSpawnInterval (0.95s)
    // Advance in 0.05s steps for 1.0s (20 steps)
    for (let i = 0; i < 20; i += 1) {
      stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.05,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0),
      );
    }

    assert.equal(state.obstacles.length, 1);
    const spawned = state.obstacles[0];
    if (!spawned) {
      assert.fail('Expected spawned cactus obstacle');
    }
    assert.ok(spawned.x > DEFAULT_RUNNER_CONFIG.worldWidth);

    // Advance far enough to clear the obstacle off-screen without colliding (jump over it)
    for (let i = 0; i < 120; i += 1) {
      stepRunnerSimulation(
        state,
        { jumpPressed: state.trex.isGrounded },
        0.03,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0),
      );
      if (state.status === 'gameover') {
        break;
      }
    }

    assert.ok(state.obstacles.every((obs) => obs.x + obs.width > -60));
  });

  void it('detects collision with a cactus and transitions to gameover', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG, fixedRng(0.5));
    state.obstacles.push({
      id: 99,
      variant: 'small',
      x: state.trex.x + 10,
      y: DEFAULT_RUNNER_CONFIG.groundY,
      width: 24,
      height: 42,
    });

    const events = stepRunnerSimulation(
      state,
      { jumpPressed: false },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(events.collided, true);
    assert.equal(state.status, 'gameover');

    // Subsequent steps while gameover do not advance score
    const scoreAtDeath = state.score;
    stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.05,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(state.score, scoreAtDeath);
  });

  void it('increases distance and score monotonically and resets cleanly', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG, fixedRng(0.5));
    for (let i = 0; i < 10; i += 1) {
      stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.05,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
    }

    assert.ok(state.distance > 0);
    assert.ok(state.score > 0);
    assert.ok(state.groundOffset > 0);

    const reset = createRunnerState(DEFAULT_RUNNER_CONFIG, fixedRng(0.5));
    assert.equal(reset.distance, 0);
    assert.equal(reset.score, 0);
    assert.equal(reset.obstacles.length, 0);
    assert.equal(reset.status, 'running');
  });
});
