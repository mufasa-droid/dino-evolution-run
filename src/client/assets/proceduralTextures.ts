import * as Phaser from 'phaser';
import { CACTUS_DIMENSIONS } from '../game/constants';
import type { CactusVariant } from '../game/types';

export const TEXTURE_KEYS = {
  trexRun0: 'trex-run-0',
  trexRun1: 'trex-run-1',
  trexJump: 'trex-jump',
  cactusSmall: 'cactus-small',
  cactusTall: 'cactus-tall',
  cactusCluster: 'cactus-cluster',
  groundTile: 'ground-tile',
} as const;

export const ANIMATION_KEYS = {
  trexRun: 'trex-run-anim',
} as const;

export function getCactusTextureKey(variant: CactusVariant): string {
  switch (variant) {
    case 'small':
      return TEXTURE_KEYS.cactusSmall;
    case 'tall':
      return TEXTURE_KEYS.cactusTall;
    case 'cluster':
      return TEXTURE_KEYS.cactusCluster;
  }
}

function drawTRexBody(
  graphics: Phaser.GameObjects.Graphics,
  leftLegOffsetY: number,
  rightLegOffsetY: number,
): void {
  graphics.clear();

  // Silhouette fill
  graphics.fillStyle(0x2d4a3e, 1);
  // Tail
  graphics.fillRect(0, 22, 10, 10);
  graphics.fillRect(4, 18, 8, 8);
  // Torso
  graphics.fillRect(10, 16, 20, 22);
  // Neck & Head
  graphics.fillRect(22, 4, 20, 16);
  // Snout highlight / jaw
  graphics.fillRect(28, 16, 14, 4);
  // Small arm
  graphics.fillRect(30, 24, 7, 4);
  // Legs
  graphics.fillRect(12, 38 + leftLegOffsetY, 6, 14 - leftLegOffsetY);
  graphics.fillRect(22, 38 + rightLegOffsetY, 6, 14 - rightLegOffsetY);

  // Eye
  graphics.fillStyle(0xf7f4e9, 1);
  graphics.fillRect(34, 8, 4, 4);
}

function drawCactus(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  xOffset: number,
): void {
  const trunkW = Math.max(8, Math.floor(width * 0.36));
  const trunkX = xOffset + Math.floor((width - trunkW) / 2);

  graphics.fillStyle(0x2f6b3c, 1);
  // Main trunk
  graphics.fillRect(trunkX, 2, trunkW, height - 2);
  // Left arm
  graphics.fillRect(xOffset + 1, Math.floor(height * 0.28), trunkX - xOffset, 6);
  graphics.fillRect(xOffset + 1, Math.floor(height * 0.16), 5, Math.floor(height * 0.16));
  // Right arm
  graphics.fillRect(
    trunkX + trunkW - 1,
    Math.floor(height * 0.4),
    width - (trunkX - xOffset + trunkW),
    6,
  );
  graphics.fillRect(
    xOffset + width - 6,
    Math.floor(height * 0.24),
    5,
    Math.floor(height * 0.2),
  );
}

/**
 * Generates temporary minimalist procedural textures for Phase 3 so gameplay
 * can run independently of external sprite sheets.
 */
export function ensureProceduralTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE_KEYS.trexRun0)) {
    return;
  }

  const gfx = scene.add.graphics();
  gfx.setVisible(false);

  // T-Rex frames (44x52)
  drawTRexBody(gfx, 0, 4);
  gfx.generateTexture(TEXTURE_KEYS.trexRun0, 44, 52);

  drawTRexBody(gfx, 4, 0);
  gfx.generateTexture(TEXTURE_KEYS.trexRun1, 44, 52);

  drawTRexBody(gfx, 2, 2);
  gfx.generateTexture(TEXTURE_KEYS.trexJump, 44, 52);

  // Small cactus (24x42)
  gfx.clear();
  drawCactus(gfx, CACTUS_DIMENSIONS.small.width, CACTUS_DIMENSIONS.small.height, 0);
  gfx.generateTexture(
    TEXTURE_KEYS.cactusSmall,
    CACTUS_DIMENSIONS.small.width,
    CACTUS_DIMENSIONS.small.height,
  );

  // Tall cactus (32x62)
  gfx.clear();
  drawCactus(gfx, CACTUS_DIMENSIONS.tall.width, CACTUS_DIMENSIONS.tall.height, 0);
  gfx.generateTexture(
    TEXTURE_KEYS.cactusTall,
    CACTUS_DIMENSIONS.tall.width,
    CACTUS_DIMENSIONS.tall.height,
  );

  // Cluster cactus (54x46)
  gfx.clear();
  drawCactus(gfx, 26, 46, 0);
  drawCactus(gfx, 24, 36, 28);
  gfx.generateTexture(
    TEXTURE_KEYS.cactusCluster,
    CACTUS_DIMENSIONS.cluster.width,
    CACTUS_DIMENSIONS.cluster.height,
  );

  // Ground tile (128x100, seamless fill + pebbles without top border line)
  gfx.clear();
  gfx.fillStyle(0xe8dfc8, 1);
  gfx.fillRect(0, 0, 128, 100);
  // Subtle desert pebbles/ticks for motion readability
  gfx.fillStyle(0xb5a88d, 1);
  gfx.fillRect(14, 16, 10, 3);
  gfx.fillRect(52, 28, 6, 3);
  gfx.fillRect(88, 14, 14, 3);
  gfx.fillRect(110, 36, 8, 3);
  gfx.generateTexture(TEXTURE_KEYS.groundTile, 128, 100);

  gfx.destroy();

  if (!scene.anims.exists(ANIMATION_KEYS.trexRun)) {
    scene.anims.create({
      key: ANIMATION_KEYS.trexRun,
      frames: [{ key: TEXTURE_KEYS.trexRun0 }, { key: TEXTURE_KEYS.trexRun1 }],
      frameRate: 10,
      repeat: -1,
    });
  }
}
