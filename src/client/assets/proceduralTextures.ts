import * as Phaser from 'phaser';
import { OBSTACLE_CATALOG } from '../game/obstacles.ts';
import { DINOSAUR_SPECS } from '../game/species.ts';
import type { DinosaurSpecies, ObstacleTypeId } from '../game/types.ts';

export const TEXTURE_KEYS = {
  trexRun0: 'trex-run-0',
  trexRun1: 'trex-run-1',
  trexJump: 'trex-jump',
  trexLand: 'trex-land',
  ptero0: 'ptero-0',
  ptero1: 'ptero-1',
  pteroGlide: 'ptero-glide',
  tricera0: 'tricera-0',
  tricera1: 'tricera-1',
  triceraCharge0: 'tricera-charge-0',
  triceraCharge1: 'tricera-charge-1',
  anky0: 'anky-0',
  anky1: 'anky-1',
  armourShield: 'armour-shield',
  chargeAura: 'charge-aura',
  evolutionOrb: 'evolution-orb',
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
  pteroFly: 'ptero-fly-anim',
  triceraRun: 'tricera-run-anim',
  triceraCharge: 'tricera-charge-anim',
  ankyRun: 'anky-run-anim',
  birdFlap: 'bird-flap-anim',
} as const;

export function getSpeciesVisuals(species: DinosaurSpecies): {
  readonly runAnimKey: string;
  readonly jumpTextureKey: string;
} {
  switch (species) {
    case 'trex':
      return {
        runAnimKey: ANIMATION_KEYS.trexRun,
        jumpTextureKey: TEXTURE_KEYS.trexJump,
      };
    case 'pterodactyl':
      return {
        runAnimKey: ANIMATION_KEYS.pteroFly,
        jumpTextureKey: TEXTURE_KEYS.ptero0,
      };
    case 'triceratops':
      return {
        runAnimKey: ANIMATION_KEYS.triceraRun,
        jumpTextureKey: TEXTURE_KEYS.tricera0,
      };
    case 'ankylosaurus':
      return {
        runAnimKey: ANIMATION_KEYS.ankyRun,
        jumpTextureKey: TEXTURE_KEYS.anky0,
      };
  }
}

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
  bodyDropY = 0,
): void {
  graphics.clear();
  graphics.fillStyle(0x2d4a3e, 1);
  graphics.fillRect(0, 22 + bodyDropY, 10, 10);
  graphics.fillRect(4, 18 + bodyDropY, 8, 8);
  graphics.fillRect(10, 16 + bodyDropY, 20, 22 - bodyDropY);
  graphics.fillRect(22, 4 + bodyDropY, 20, 16);
  graphics.fillRect(28, 16 + bodyDropY, 14, 4);
  graphics.fillRect(30, 24 + bodyDropY, 7, 4);
  graphics.fillRect(12, 38 + leftLegOffsetY, 6, 14 - leftLegOffsetY);
  graphics.fillRect(22, 38 + rightLegOffsetY, 6, 14 - rightLegOffsetY);
  graphics.fillStyle(0xf7f4e9, 1);
  graphics.fillRect(34, 8 + bodyDropY, 4, 4);
}

function drawPterodactyl(
  graphics: Phaser.GameObjects.Graphics,
  mode: 'up' | 'down' | 'glide',
): void {
  graphics.clear();
  graphics.fillStyle(0x1f6e78, 1);
  graphics.fillRect(24, 12, 14, 10);
  graphics.fillRect(38, 15, 14, 4);
  graphics.fillRect(18, 8, 10, 6);
  graphics.fillRect(8, 16, 20, 10);
  graphics.fillRect(0, 19, 10, 4);
  if (mode === 'up') {
    graphics.fillRect(12, 0, 16, 16);
  } else if (mode === 'down') {
    graphics.fillRect(12, 24, 16, 12);
  } else {
    // Outstretched level glide wings
    graphics.fillRect(8, 10, 24, 7);
  }
  graphics.fillStyle(0xf5efe0, 1);
  graphics.fillRect(32, 14, 3, 3);
}

function drawTriceratops(
  graphics: Phaser.GameObjects.Graphics,
  stepOffset: number,
  charging: boolean,
): void {
  graphics.clear();
  graphics.fillStyle(charging ? 0xd9480f : 0xa84b2a, 1);
  graphics.fillRect(0, 22, 10, 8);
  graphics.fillRect(8, 14, 26, 20);
  graphics.fillRect(30, charging ? 8 : 6, 8, 22);
  graphics.fillRect(36, charging ? 14 : 12, 14, 14);
  graphics.fillStyle(0xf2e4c9, 1);
  graphics.fillRect(46, charging ? 13 : 10, 10, 4);
  graphics.fillRect(48, charging ? 21 : 19, 6, 3);
  graphics.fillStyle(charging ? 0xd9480f : 0xa84b2a, 1);
  graphics.fillRect(10, 34 + stepOffset, 7, 12 - stepOffset);
  graphics.fillRect(26, 34 + (4 - stepOffset), 7, 12 - (4 - stepOffset));
  graphics.fillStyle(0x1e1e1e, 1);
  graphics.fillRect(40, charging ? 17 : 15, 3, 3);
}

function drawAnkylosaurus(
  graphics: Phaser.GameObjects.Graphics,
  stepOffset: number,
): void {
  graphics.clear();
  graphics.fillStyle(0x3f5475, 1);
  graphics.fillRect(0, 22, 12, 5);
  graphics.fillRect(0, 19, 6, 10);
  graphics.fillRect(10, 14, 30, 16);
  graphics.fillStyle(0x7087ab, 1);
  graphics.fillRect(14, 9, 6, 5);
  graphics.fillRect(23, 8, 6, 6);
  graphics.fillRect(32, 9, 6, 5);
  graphics.fillStyle(0x3f5475, 1);
  graphics.fillRect(40, 16, 14, 12);
  graphics.fillRect(14, 30 + stepOffset, 7, 10 - stepOffset);
  graphics.fillRect(30, 30 + (3 - stepOffset), 7, 10 - (3 - stepOffset));
  graphics.fillStyle(0xf5efe0, 1);
  graphics.fillRect(46, 19, 3, 3);
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
  graphics.fillRect(0, 10, 10, 4);
  graphics.fillRect(8, 7, 12, 9);
  graphics.fillRect(18, 10, 18, 8);
  graphics.fillRect(34, 8, 8, 4);
  if (wingUp) {
    graphics.fillRect(16, 0, 12, 10);
  } else {
    graphics.fillRect(16, 16, 12, 8);
  }
  graphics.fillStyle(0xf5efe0, 1);
  graphics.fillRect(11, 9, 3, 3);
}

/**
 * Generates temporary minimalist procedural textures for Phases 3–6.
 */
export function ensureProceduralTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE_KEYS.armourShield)) {
    return;
  }

  const gfx = scene.add.graphics();
  gfx.setVisible(false);

  // T-Rex frames (44x52)
  if (!scene.textures.exists(TEXTURE_KEYS.trexRun0)) {
    drawTRexBody(gfx, 0, 4);
    gfx.generateTexture(
      TEXTURE_KEYS.trexRun0,
      DINOSAUR_SPECS.trex.visualWidth,
      DINOSAUR_SPECS.trex.visualHeight,
    );
    drawTRexBody(gfx, 4, 0);
    gfx.generateTexture(
      TEXTURE_KEYS.trexRun1,
      DINOSAUR_SPECS.trex.visualWidth,
      DINOSAUR_SPECS.trex.visualHeight,
    );
    drawTRexBody(gfx, 2, 2);
    gfx.generateTexture(
      TEXTURE_KEYS.trexJump,
      DINOSAUR_SPECS.trex.visualWidth,
      DINOSAUR_SPECS.trex.visualHeight,
    );
  }

  drawTRexBody(gfx, 3, 3, 4);
  gfx.generateTexture(
    TEXTURE_KEYS.trexLand,
    DINOSAUR_SPECS.trex.visualWidth,
    DINOSAUR_SPECS.trex.visualHeight,
  );

  // Pterodactyl frames (52x38)
  if (!scene.textures.exists(TEXTURE_KEYS.ptero0)) {
    drawPterodactyl(gfx, 'up');
    gfx.generateTexture(
      TEXTURE_KEYS.ptero0,
      DINOSAUR_SPECS.pterodactyl.visualWidth,
      DINOSAUR_SPECS.pterodactyl.visualHeight,
    );
    drawPterodactyl(gfx, 'down');
    gfx.generateTexture(
      TEXTURE_KEYS.ptero1,
      DINOSAUR_SPECS.pterodactyl.visualWidth,
      DINOSAUR_SPECS.pterodactyl.visualHeight,
    );
  }
  drawPterodactyl(gfx, 'glide');
  gfx.generateTexture(
    TEXTURE_KEYS.pteroGlide,
    DINOSAUR_SPECS.pterodactyl.visualWidth,
    DINOSAUR_SPECS.pterodactyl.visualHeight,
  );

  // Triceratops frames (56x46)
  if (!scene.textures.exists(TEXTURE_KEYS.tricera0)) {
    drawTriceratops(gfx, 0, false);
    gfx.generateTexture(
      TEXTURE_KEYS.tricera0,
      DINOSAUR_SPECS.triceratops.visualWidth,
      DINOSAUR_SPECS.triceratops.visualHeight,
    );
    drawTriceratops(gfx, 4, false);
    gfx.generateTexture(
      TEXTURE_KEYS.tricera1,
      DINOSAUR_SPECS.triceratops.visualWidth,
      DINOSAUR_SPECS.triceratops.visualHeight,
    );
  }
  drawTriceratops(gfx, 0, true);
  gfx.generateTexture(
    TEXTURE_KEYS.triceraCharge0,
    DINOSAUR_SPECS.triceratops.visualWidth,
    DINOSAUR_SPECS.triceratops.visualHeight,
  );
  drawTriceratops(gfx, 4, true);
  gfx.generateTexture(
    TEXTURE_KEYS.triceraCharge1,
    DINOSAUR_SPECS.triceratops.visualWidth,
    DINOSAUR_SPECS.triceratops.visualHeight,
  );

  // Ankylosaurus frames (54x40)
  if (!scene.textures.exists(TEXTURE_KEYS.anky0)) {
    drawAnkylosaurus(gfx, 0);
    gfx.generateTexture(
      TEXTURE_KEYS.anky0,
      DINOSAUR_SPECS.ankylosaurus.visualWidth,
      DINOSAUR_SPECS.ankylosaurus.visualHeight,
    );
    drawAnkylosaurus(gfx, 3);
    gfx.generateTexture(
      TEXTURE_KEYS.anky1,
      DINOSAUR_SPECS.ankylosaurus.visualWidth,
      DINOSAUR_SPECS.ankylosaurus.visualHeight,
    );
  }

  // Ankylosaurus Armour Shield Aura (68x54)
  gfx.clear();
  gfx.lineStyle(3, 0x0284c7, 0.9);
  gfx.fillStyle(0x38bdf8, 0.22);
  gfx.fillRoundedRect(2, 2, 64, 50, 14);
  gfx.strokeRoundedRect(2, 2, 64, 50, 14);
  gfx.generateTexture(TEXTURE_KEYS.armourShield, 68, 54);

  // Triceratops Charge Speed-Streak Aura (78x48)
  gfx.clear();
  gfx.fillStyle(0xf97316, 0.85);
  gfx.fillRect(0, 10, 22, 4);
  gfx.fillRect(4, 22, 28, 4);
  gfx.fillRect(2, 34, 20, 4);
  gfx.lineStyle(3, 0xea580c, 0.9);
  gfx.strokeRoundedRect(22, 2, 54, 44, 10);
  gfx.generateTexture(TEXTURE_KEYS.chargeAura, 78, 48);

  // Evolution Orb (28x28)
  if (!scene.textures.exists(TEXTURE_KEYS.evolutionOrb)) {
    gfx.clear();
    gfx.fillStyle(0x16a34a, 0.3);
    gfx.fillCircle(14, 14, 14);
    gfx.fillStyle(0xf59e0b, 1);
    gfx.fillCircle(14, 14, 10);
    gfx.fillStyle(0xfef3c7, 1);
    gfx.fillCircle(11, 11, 4);
    gfx.generateTexture(TEXTURE_KEYS.evolutionOrb, 28, 28);
  }

  // Obstacles
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

  if (!scene.textures.exists(TEXTURE_KEYS.rockSolid)) {
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

    gfx.clear();
    gfx.fillStyle(0x9a7b56, 1);
    gfx.fillRect(4, 10, 32, 28);
    gfx.fillRect(10, 2, 20, 10);
    gfx.fillRect(0, 18, 40, 20);
    gfx.fillStyle(0x4a3824, 1);
    gfx.fillRect(18, 6, 3, 14);
    gfx.fillRect(14, 18, 6, 3);
    gfx.fillRect(20, 20, 3, 12);
    gfx.generateTexture(
      TEXTURE_KEYS.rockBreakable,
      OBSTACLE_CATALOG.rock_breakable.width,
      OBSTACLE_CATALOG.rock_breakable.height,
    );

    drawBird(gfx, true);
    gfx.generateTexture(TEXTURE_KEYS.bird0, 42, 24);
    drawBird(gfx, false);
    gfx.generateTexture(TEXTURE_KEYS.bird1, 42, 24);

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

    gfx.clear();
    gfx.fillStyle(0xf5efe0, 1);
    gfx.fillRect(0, 0, 120, 600);
    gfx.fillStyle(0x534b3b, 1);
    gfx.fillRect(0, 0, 4, 600);
    gfx.fillRect(116, 0, 4, 600);
    gfx.generateTexture(TEXTURE_KEYS.groundGap, 120, 600);
  }

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

  const animDefs: ReadonlyArray<{
    readonly key: string;
    readonly f0: string;
    readonly f1: string;
    readonly rate: number;
  }> = [
    { key: ANIMATION_KEYS.trexRun, f0: TEXTURE_KEYS.trexRun0, f1: TEXTURE_KEYS.trexRun1, rate: 10 },
    { key: ANIMATION_KEYS.pteroFly, f0: TEXTURE_KEYS.ptero0, f1: TEXTURE_KEYS.ptero1, rate: 9 },
    { key: ANIMATION_KEYS.triceraRun, f0: TEXTURE_KEYS.tricera0, f1: TEXTURE_KEYS.tricera1, rate: 10 },
    { key: ANIMATION_KEYS.triceraCharge, f0: TEXTURE_KEYS.triceraCharge0, f1: TEXTURE_KEYS.triceraCharge1, rate: 16 },
    { key: ANIMATION_KEYS.ankyRun, f0: TEXTURE_KEYS.anky0, f1: TEXTURE_KEYS.anky1, rate: 8 },
    { key: ANIMATION_KEYS.birdFlap, f0: TEXTURE_KEYS.bird0, f1: TEXTURE_KEYS.bird1, rate: 7 },
  ];

  for (const def of animDefs) {
    if (!scene.anims.exists(def.key)) {
      scene.anims.create({
        key: def.key,
        frames: [{ key: def.f0 }, { key: def.f1 }],
        frameRate: def.rate,
        repeat: -1,
      });
    }
  }
}
