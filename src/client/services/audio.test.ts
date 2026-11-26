/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AudioService, type AudioContextLike } from './audio.ts';
import type { StorageBackend } from './storage.ts';

function createMemoryStorage(): StorageBackend {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

void describe('Phase 8 AudioService', () => {
  void it('handles audio initialization failure without crashing', () => {
    const storage = createMemoryStorage();
    const audio = new AudioService(storage, () => {
      throw new Error('AudioContext blocked');
    });

    assert.doesNotThrow(() => {
      audio.unlock();
      audio.playJump();
      audio.playLand();
      audio.playTransform();
      audio.playGameOver();
    });
  });

  void it('keeps BGM disabled by default, persists mute, and stops BGM on stopAll', () => {
    const storage = createMemoryStorage();
    const audio = new AudioService(storage, () => null);

    assert.equal(audio.isBgmEnabled(), false);
    assert.equal(audio.isMuted(), false);

    audio.setBgmEnabled(true);
    assert.equal(audio.isBgmEnabled(), true);
    audio.stopAll();

    audio.toggleMute();
    assert.equal(audio.isMuted(), true);
    assert.equal(storage.getItem('dino_evo_muted_v1'), 'true');
  });

  void it('resumes a suspended AudioContext before scheduling oscillators', async () => {
    const storage = createMemoryStorage();
    let startedCount = 0;
    let ctxState: AudioContextState = 'suspended';
    const mockCtx: AudioContextLike = {
      get state() {
        return ctxState;
      },
      currentTime: 0,
      destination: {},
      resume: async () => {
        ctxState = 'running';
      },
      createOscillator: () => ({
        type: 'square',
        frequency: {
          setValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: () => undefined,
        start: () => {
          startedCount += 1;
        },
        stop: () => undefined,
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: () => undefined,
      }),
    };

    const audio = new AudioService(storage, () => mockCtx);
    audio.playJump();
    assert.equal(startedCount, 0);

    await Promise.resolve();
    await Promise.resolve();
    assert.equal(startedCount, 1);
  });
});
