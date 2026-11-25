/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIN_VISIBLE_WORLD_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from './constants.ts';
import { computeWorldViewport } from './viewport.ts';

void describe('Responsive World Viewport', () => {
  void it('fits full 960x540 world on 16:9 desktop landscape', () => {
    const vp = computeWorldViewport(1280, 720);
    assert.ok(Math.abs(vp.zoom - 720 / 540) < 0.001);
    assert.equal(vp.centerX, WORLD_WIDTH / 2);
    assert.equal(vp.centerY, WORLD_HEIGHT / 2);
    assert.ok(vp.visibleWorldWidth >= WORLD_WIDTH);
  });

  void it('keeps dinosaur and lookahead readable on narrow portrait mobile screens', () => {
    const vp = computeWorldViewport(375, 667);
    // Must not shrink down to 375/960 (~0.39)
    assert.ok(vp.zoom > 0.65);
    assert.ok(vp.visibleWorldWidth >= MIN_VISIBLE_WORLD_WIDTH - 0.01);
    // Left-aligned camera center ensures T-Rex at x=140 has maximum right lookahead
    assert.equal(vp.centerX, vp.visibleWorldWidth / 2);
  });
});
