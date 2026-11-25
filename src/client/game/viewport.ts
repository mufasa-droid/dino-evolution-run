import { MIN_VISIBLE_WORLD_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from './constants.ts';

export type WorldViewport = {
  readonly zoom: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly visibleWorldWidth: number;
  readonly visibleWorldHeight: number;
};

/**
 * Computes camera zoom and center for a 960x540 logical world inside any
 * Phaser.Scale.RESIZE canvas. On narrow portrait screens, zooms to keep at
 * least MIN_VISIBLE_WORLD_WIDTH visible and anchors left-ward so T-Rex and
 * upcoming obstacles remain readable without clipping.
 */
export function computeWorldViewport(
  canvasWidth: number,
  canvasHeight: number,
): WorldViewport {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return {
      zoom: 1,
      centerX: WORLD_WIDTH / 2,
      centerY: WORLD_HEIGHT / 2,
      visibleWorldWidth: WORLD_WIDTH,
      visibleWorldHeight: WORLD_HEIGHT,
    };
  }

  const worldAspect = WORLD_WIDTH / WORLD_HEIGHT;
  const canvasAspect = canvasWidth / canvasHeight;

  let zoom: number;
  if (canvasAspect >= worldAspect) {
    zoom = canvasHeight / WORLD_HEIGHT;
  } else {
    const fitWidthZoom = canvasWidth / WORLD_WIDTH;
    const fitHeightZoom = canvasHeight / WORLD_HEIGHT;
    const maxPortraitZoom = canvasWidth / MIN_VISIBLE_WORLD_WIDTH;
    zoom = Math.max(fitWidthZoom, Math.min(fitHeightZoom, maxPortraitZoom));
  }

  const visibleWorldWidth = canvasWidth / zoom;
  const visibleWorldHeight = canvasHeight / zoom;

  const centerX =
    visibleWorldWidth < WORLD_WIDTH ? visibleWorldWidth / 2 : WORLD_WIDTH / 2;
  const centerY = WORLD_HEIGHT / 2;

  return {
    zoom,
    centerX,
    centerY,
    visibleWorldWidth,
    visibleWorldHeight,
  };
}
