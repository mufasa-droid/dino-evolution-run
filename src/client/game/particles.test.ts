/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clearParticlePool,
  createParticlePool,
  emitParticleBurst,
  stepParticlePool,
} from './particles.ts';

void describe('Phase 8 Particle Pool', () => {
  void it('reuses fixed-capacity slots and clears cleanly on reset', () => {
    const pool = createParticlePool(8);
    assert.equal(pool.slots.length, 8);

    emitParticleBurst(pool, 100, 400, 5, 0xb5a88d, 4, 0.2, () => 0.5);
    assert.equal(pool.slots.filter((s) => s.active).length, 5);

    // Step past lifetime to recycle slots
    for (let i = 0; i < 10; i += 1) {
      stepParticlePool(pool, 0.04);
    }
    assert.equal(pool.slots.filter((s) => s.active).length, 0);

    // Emit more than capacity -> caps at pool capacity without growing array
    emitParticleBurst(pool, 100, 400, 12, 0xf59e0b, 5, 0.3, () => 0.5);
    assert.equal(pool.slots.length, 8);
    assert.equal(pool.slots.filter((s) => s.active).length, 8);

    clearParticlePool(pool);
    assert.equal(pool.slots.filter((s) => s.active).length, 0);
  });
});
