/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeHudLayout } from './hudLayout.ts';

void describe('Phase 8 Responsive HUD Layout', () => {
  void it('prevents HUD overlaps on 375x667 mobile portrait, wider mobile, desktop, and fullscreen', () => {
    const viewports: ReadonlyArray<{ readonly w: number; readonly h: number }> = [
      { w: 375, h: 667 },
      { w: 430, h: 932 },
      { w: 1024, h: 768 },
      { w: 1280, h: 720 },
    ];

    for (const vp of viewports) {
      const layout = computeHudLayout(vp.w, vp.h, true);

      // Left-side species/ability HUD stays well left of right-side score/mute HUD
      const leftHudMaxX = layout.species.x + 165 * layout.hudScale;
      const rightHudMinX = layout.score.x - 140 * layout.hudScale;
      assert.ok(
        leftHudMaxX < rightHudMinX,
        `Top HUD overlap at ${vp.w}x${vp.h}: ${leftHudMaxX} >= ${rightHudMinX}`,
      );

      // Mute button sits cleanly below distance text
      assert.ok(layout.muteButton.topY > layout.distance.y);

      // Hint on narrow portrait lifts above bottom-right Ability button
      if (vp.w < 520) {
        const abilityTopY =
          layout.abilityButton.bottomY -
          layout.abilityButton.height * layout.abilityButton.scale;
        assert.ok(layout.hint.y <= abilityTopY);
      }
    }
  });
});
