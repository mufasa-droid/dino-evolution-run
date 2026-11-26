export type HudElementBounds = {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
};

export type HudLayout = {
  readonly hudScale: number;
  readonly score: HudElementBounds;
  readonly distance: HudElementBounds;
  readonly muteButton: {
    readonly rightX: number;
    readonly topY: number;
    readonly width: number;
    readonly height: number;
    readonly scale: number;
  };
  readonly species: HudElementBounds;
  readonly timerBar: HudElementBounds;
  readonly abilityStatus: HudElementBounds;
  readonly envBanner: HudElementBounds;
  readonly abilityButton: {
    readonly rightX: number;
    readonly bottomY: number;
    readonly width: number;
    readonly height: number;
    readonly scale: number;
  };
  readonly hint: HudElementBounds;
};

/**
 * Computes non-overlapping screen-space HUD positions across narrow mobile
 * portrait (e.g. 375x667), wider mobile, desktop landscape, and fullscreen.
 */
export function computeHudLayout(
  width: number,
  height: number,
  abilityButtonVisible: boolean,
): HudLayout {
  const safeW = Math.max(320, width);
  const safeH = Math.max(320, height);
  const hudScale = Math.max(0.76, Math.min(1.18, Math.min(safeW, safeH) / 540));

  const marginX = 14;
  const topY = 12;

  const scoreY = topY;
  const distanceY = topY + Math.round(26 * hudScale);
  const muteWidth = 76;
  const muteHeight = 24;
  const muteTopY = distanceY + Math.round(22 * hudScale);

  const speciesY = topY;
  const timerBarY = topY + Math.round(24 * hudScale);
  const abilityStatusY = topY + Math.round(39 * hudScale);

  const abilityWidth = 142;
  const abilityHeight = 42;
  const abilityBottomY = safeH - 18;

  // On narrow screens, lift hint above the bottom-right Ability button when visible
  const isNarrow = safeW < 520;
  const hintY =
    abilityButtonVisible && isNarrow ? safeH - Math.round(68 * hudScale) : safeH - 16;

  return {
    hudScale,
    score: { x: safeW - marginX, y: scoreY, scale: hudScale },
    distance: { x: safeW - marginX, y: distanceY, scale: hudScale },
    muteButton: {
      rightX: safeW - marginX,
      topY: muteTopY,
      width: muteWidth,
      height: muteHeight,
      scale: hudScale,
    },
    species: { x: marginX, y: speciesY, scale: hudScale },
    timerBar: { x: marginX, y: timerBarY, scale: hudScale },
    abilityStatus: { x: marginX, y: abilityStatusY, scale: hudScale },
    envBanner: { x: safeW / 2, y: Math.round(safeH * 0.18), scale: hudScale },
    abilityButton: {
      rightX: safeW - marginX,
      bottomY: abilityBottomY,
      width: abilityWidth,
      height: abilityHeight,
      scale: hudScale,
    },
    hint: { x: safeW / 2, y: hintY, scale: hudScale },
  };
}
