/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getLocalBest,
  getStoredMutePreference,
  setStoredMutePreference,
  updateLocalBest,
  type StorageBackend,
} from './storage.ts';

function createMemoryStorage(): StorageBackend {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function createThrowingStorage(): StorageBackend {
  return {
    getItem: () => {
      throw new Error('storage read blocked');
    },
    setItem: () => {
      throw new Error('storage write blocked');
    },
  };
}

void describe('Phase 8 Personal Best & Mute Storage', () => {
  void it('updates personal best monotonically and never overwrites with a lower score', () => {
    const storage = createMemoryStorage();

    const first = updateLocalBest(250, 25, storage, 1000);
    assert.equal(first.isNewBest, true);
    assert.equal(first.record.bestScore, 250);
    assert.equal(first.record.bestDistance, 25);

    const lower = updateLocalBest(120, 12, storage, 2000);
    assert.equal(lower.isNewBest, false);
    assert.equal(lower.record.bestScore, 250);
    assert.equal(lower.record.bestDistance, 25);
    assert.equal(lower.record.updatedAt, 1000);

    const higher = updateLocalBest(600, 60, storage, 3000);
    assert.equal(higher.isNewBest, true);
    assert.equal(higher.record.bestScore, 600);
    assert.equal(higher.record.bestDistance, 60);
  });

  void it('handles malformed JSON and unavailable/throwing storage safely', () => {
    const malformed = createMemoryStorage();
    malformed.setItem('dino_evo_personal_best_v1', '{not-valid-json');
    const fallback = getLocalBest(malformed);
    assert.equal(fallback.bestScore, 0);
    assert.equal(fallback.bestDistance, 0);

    const throwing = createThrowingStorage();
    const res = updateLocalBest(300, 30, throwing, 5000);
    assert.equal(res.isNewBest, true);
    assert.equal(res.record.bestScore, 300);

    setStoredMutePreference(true, throwing);
    assert.equal(getStoredMutePreference(throwing), false);
  });

  void it('persists mute preference safely', () => {
    const storage = createMemoryStorage();
    assert.equal(getStoredMutePreference(storage), false);
    setStoredMutePreference(true, storage);
    assert.equal(getStoredMutePreference(storage), true);
    setStoredMutePreference(false, storage);
    assert.equal(getStoredMutePreference(storage), false);
  });
});
