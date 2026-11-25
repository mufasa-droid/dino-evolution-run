import * as Phaser from 'phaser';
import { OBSTACLE_CATALOG } from '../game/obstacles.ts';
import type { ObstacleTypeId } from '../game/types.ts';

export const TEXTURE_KEYS = {
  trexRun0: 'trex-run-0',
  trexRun1: 'trex-run-1',
  trexJump: 'trex-jump',
  cactusSmall: 'cactus-small',
  cactusTall: 'cactus-tall',
  cactusCluster: 'cactus-cluster',
  rockSolid: 'rock-solid',
  rockBreakable: 'rock-breakable',
  bird0: 'bird-0',
  bird1: 'bird-1',
  lowBranch: 'low-branch',
  groundGap: 'ground-gap',
  groundTile: 'ground-tile',
} as const;

export const ANIMATION_KEYS = {
  trexRun: 'trex-run-anim',
  birdFlap: 'bird-flap-anim',
} as const;

export function getObstacleTextureKey(typeId: ObstacleTypeId): string {
  switch (typeId) {
    case 'cactus_small':
      return TEXTURE_KEYS.cactusSmall;
    case 'cactus_tall':
      return TEXTURE_KEYS.cactusTall;
    case 'cactus_cluster':
      return TEXTURE_KEYS.cactusCluster;
    case 'rock_solid':
      return TEXTURE_KEYS.rockSolid;
    case 'rock_breakable':
      return TEXTURE_KEYS.rockBreakable;
    case 'bird_low':
    case 'bird_high':
      return TEXTURE_KEYS.bird0;
    case 'low_branch':
      return TEXTURE_KEYS.lowBranch;
    case 'ground_gap_small':
    case 'ground_gap_wide':
      return TEXTURE_KEYS.groundGap;
  }
}

function drawTRexBody(
  graphics: Phaser.GameObjects.Graphics,
  leftLegOffsetY: number,
  rightLegOffsetY: number,
): void {
  graphics.clear();

  graphics.fillStyle(0x2d4a3e, 1);
  graphics.fillRect(0, 22, 10, 10);
  graphics.fillRect(4, 18, 8, 8);
  graphics.fillRect(10, 16, 20, 22);
  graphics.fillRect(22, 4, 20, 16);
  graphics.fillRect(28, 16, 14, 4);
  graphics.fillRect(30, 24, 7, 4);
  graphics.fillRect(12, 38 + leftLegOffsetY, 6, 14 - leftLegOffsetY);
  graphics.fillRect(22, 38 + rightLegOffsetY, 6, 14 - rightLegOffsetY);

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
  graphics.fillRect(trunkX, 2, trunkW, height - 2);
  graphics.fillRect(xOffset + 1, Math.floor(height * 0.28), trunkX - xOffset, 6);
  graphics.fillRect(xOffset + 1, Math.floor(height * 0.16), 5, Math.floor(height * 0.16));
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

function drawBird(
  graphics: Phaser.GameObjects.Graphics,
  wingUp: boolean,
): void {
  graphics.clear();
  graphics.fillStyle(0x4a3b5c, 1);
  // Beak & Head
  graphics.fillRect(0, 10, 10, 4);
  graphics.fillRect(8, 7, 12, 9);
  // Body & Tail
  graphics.fillRect(18, 10, 18, 8);
  graphics.fillRect(34, 8, 8, 4);
  // Wing
  if (wingUp) {
    graphics.fillRect(16, 0, 12, 10);
  } else {
    graphics.fillRect(16, 16, 12, 8);
  }
  // Eye
  graphics.fillStyle(0xf5efe0, 1);
  graphics.fillRect(11, 9, 3, 3);
}

/**
 * Generates temporary minimalist procedural textures for Phase 3–4 so gameplay
 * runs independently of external sprite sheets.
 */
export function ensureProceduralTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE_KEYS.rockSolid)) {
    return;
  }

  const gfx = scene.add.graphics();
  gfx.setVisible(false);

  // T-Rex frames (44x52)
  if (!scene.textures.exists(TEXTURE_KEYS.trexRun0)) {
    drawTRexBody(gfx, 0, 4);
    gfx.generateTexture(TEXTURE_KEYS.trexRun0, 44, 52);

    drawTRexBody(gfx, 4, 0);
    gfx.generateTexture(TEXTURE_KEYS.trexRun1, 44, 52);

    drawTRexBody(gfx, 2, 2);
    gfx.generateTexture(TEXTURE_KEYS.trexJump, 44, 52);
  }

  // Cacti
  if (!scene.textures.exists(TEXTURE_KEYS.cactusSmall)) {
    gfx.clear();
    drawCactus(
      gfx,
      OBSTACLE_CATALOG.cactus_small.width,
      OBSTACLE_CATALOG.cactus_small.height,
      0,
    );
    gfx.generateTexture(
      TEXTURE_KEYS.cactusSmall,
      OBSTACLE_CATALOG.cactus_small.width,
      OBSTACLE_CATALOG.cactus_small.height,
    );

    gfx.clear();
    drawCactus(
      gfx,
      OBSTACLE_CATALOG.cactus_tall.width,
      OBSTACLE_CATALOG.cactus_tall.height,
      0,
    );
    gfx.generateTexture(
      TEXTURE_KEYS.cactusTall,
      OBSTACLE_CATALOG.cactus_tall.width,
      OBSTACLE_CATALOG.cactus_tall.height,
    );

    gfx.clear();
    drawCactus(gfx, 26, 46, 0);
    drawCactus(gfx, 24, 36, 28);
    gfx.generateTexture(
      TEXTURE_KEYS.cactusCluster,
      OBSTACLE_CATALOG.cactus_cluster.width,
      OBSTACLE_CATALOG.cactus_cluster.height,
    );
  }

  // Solid Rock (38x34)
  gfx.clear();
  gfx.fillStyle(0x6b655c, 1);
  gfx.fillRect(4, 10, 30, 24);
  gfx.fillRect(10, 2, 18, 10);
  gfx.fillRect(0, 18, 38, 16);
  gfx.fillStyle(0x878075, 1);
  gfx.fillRect(10, 4, 10, 6);
  gfx.generateTexture(
    TEXTURE_KEYS.rockSolid,
    OBSTACLE_CATALOG.rock_solid.width,
    OBSTACLE_CATALOG.rock_solid.height,
  );

  // Breakable Rock (40x38, lighter cracked boulder)
  gfx.clear();
  gfx.fillStyle(0x9a7b56, 1);
  gfx.fillRect(4, 10, 32, 28);
  gfx.fillRect(10, 2, 20, 10);
  gfx.fillRect(0, 18, 40, 20);
  // Crack lines
  gfx.fillStyle(0x4a3824, 1);
  gfx.fillRect(18, 6, 3, 14);
  gfx.fillRect(14, 18, 6, 3);
  gfx.fillRect(20, 20, 3, 12);
  gfx.generateTexture(
    TEXTURE_KEYS.rockBreakable,
    OBSTACLE_CATALOG.rock_breakable.width,
    OBSTACLE_CATALOG.rock_breakable.height,
  );

  // Flying Bird frames (42x24)
  drawBird(gfx, true);
  gfx.generateTexture(TEXTURE_KEYS.bird0, 42, 24);
  drawBird(gfx, false);
  gfx.generateTexture(TEXTURE_KEYS.bird1, 42, 24);

  // Low Branch (68x28)
  gfx.clear();
  gfx.fillStyle(0x5c4028, 1);
  gfx.fillRect(0, 10, 68, 8);
  gfx.fillStyle(0x3a6b35, 1);
  gfx.fillRect(6, 2, 24, 12);
  gfx.fillRect(36, 4, 26, 12);
  gfx.fillRect(16, 16, 20, 10);
  gfx.generateTexture(
    TEXTURE_KEYS.lowBranch,
    OBSTACLE_CATALOG.low_branch.width,
    OBSTACLE_CATALOG.low_branch.height,
  );

  // Ground Gap cutout (120x600)
  gfx.clear();
  gfx.fillStyle(0xf5efe0, 1);
  gfx.fillRect(0, 0, 120, 600);
  gfx.fillStyle(0x534b3b, 1);
  gfx.fillRect(0, 0, 4, 600);
  gfx.fillRect(116, 0, 4, 600);
  gfx.generateTexture(TEXTURE_KEYS.groundGap, 120, 600);

  // Seamless Ground tile (128x100)
  if (!scene.textures.exists(TEXTURE_KEYS.groundTile)) {
    gfx.clear();
    gfx.fillStyle(0xe8dfc8, 1);
    gfx.fillRect(0, 0, 128, 100);
    gfx.fillStyle(0xb5a88d, 1);
    gfx.fillRect(14, 16, 10, 3);
    gfx.fillRect(52, 28, 6, 3);
    gfx.fillRect(88, 14, 14, 3);
    gfx.fillRect(110, 36, 8, 3);
    gfx.generateTexture(TEXTURE_KEYS.groundTile, 128, 100);
  }

  gfx.destroy();

  if (!scene.anims.exists(ANIMATION_KEYS.trexRun)) {
    scene.anims.create({
      key: ANIMATION_KEYS.trexRun,
      frames: [{ key: TEXTURE_KEYS.trexRun0 }, { key: TEXTURE_KEYS.trexRun1 }],
      frameRate: 10,
      repeat: -1,
    });
  }

  if (!scene.anims.exists(ANIMATION_KEYS.birdFlap)) {
    scene.anims.create({
      key: ANIMATION_KEYS.birdFlap,
      frames: [{ key: TEXTURE_KEYS.bird0 }, { key: TEXTURE_KEYS.bird1 }],
      frameRate: 7,
      repeat: -1,
    });
  }
}
