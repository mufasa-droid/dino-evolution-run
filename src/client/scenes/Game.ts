import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import {
  ANIMATION_KEYS,
  TEXTURE_KEYS,
  getCactusTextureKey,
} from '../assets/proceduralTextures';
import { DEFAULT_RUNNER_CONFIG, GROUND_Y } from '../game/constants';
import { createRunnerState, stepRunnerSimulation } from '../game/simulation';
import type { CactusObstacle, GameOverData, RunnerState } from '../game/types';
import { computeWorldViewport } from '../game/viewport';
import { attachResponsiveResize } from './sceneResize';

export class Game extends Scene {
  private runnerState: RunnerState | null = null;
  private worldCamera: Phaser.Cameras.Scene2D.Camera | null = null;
  private hudCamera: Phaser.Cameras.Scene2D.Camera | null = null;

  private groundTile: Phaser.GameObjects.TileSprite | null = null;
  private groundLine: Phaser.GameObjects.Rectangle | null = null;
  private trexSprite: Phaser.GameObjects.Sprite | null = null;
  private obstacleSprites: Map<number, Phaser.GameObjects.Image> = new Map();
  private obstaclePool: Phaser.GameObjects.Image[] = [];

  private scoreText: Phaser.GameObjects.Text | null = null;
  private distanceText: Phaser.GameObjects.Text | null = null;
  private hintText: Phaser.GameObjects.Text | null = null;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private worldObjects: Phaser.GameObjects.GameObject[] = [];

  private jumpQueued = false;
  private hasJumpedOnce = false;

  constructor() {
    super('Game');
  }

  init(): void {
    this.runnerState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    this.worldCamera = null;
    this.hudCamera = null;
    this.groundTile = null;
    this.groundLine = null;
    this.trexSprite = null;
    this.obstacleSprites.clear();
    this.obstaclePool = [];
    this.scoreText = null;
    this.distanceText = null;
    this.hintText = null;
    this.hudObjects = [];
    this.worldObjects = [];
    this.jumpQueued = false;
    this.hasJumpedOnce = false;
  }

  create(): void {
    const state = this.runnerState;
    if (!state) {
      return;
    }

    this.worldCamera = this.cameras.main;
    this.worldCamera.setBackgroundColor(0xf5efe0);

    this.hudCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);

    // World objects (rendered by worldCamera only)
    this.groundTile = this.add
      .tileSprite(-400, GROUND_Y, 2400, 600, TEXTURE_KEYS.groundTile)
      .setOrigin(0, 0);

    this.groundLine = this.add
      .rectangle(-400, GROUND_Y, 2400, 4, 0x534b3b)
      .setOrigin(0, 0);

    this.trexSprite = this.add
      .sprite(state.trex.x, state.trex.y, TEXTURE_KEYS.trexRun0)
      .setOrigin(0, 1);
    this.trexSprite.play(ANIMATION_KEYS.trexRun);

    this.worldObjects = [this.groundTile, this.groundLine, this.trexSprite];

    // HUD objects (rendered by hudCamera only)
    this.scoreText = this.add
      .text(0, 0, 'SCORE 00000', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '22px',
        color: '#2d4a3e',
        align: 'right',
      })
      .setOrigin(1, 0);

    this.distanceText = this.add
      .text(0, 0, '0 m', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#534b3b',
        align: 'right',
      })
      .setOrigin(1, 0);

    this.hintText = this.add
      .text(0, 0, 'Tap or Press Space to Jump', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#534b3b',
        align: 'center',
      })
      .setOrigin(0.5, 1);

    this.hudObjects = [this.scoreText, this.distanceText, this.hintText];

    this.worldCamera.ignore(this.hudObjects);
    this.hudCamera.ignore(this.worldObjects);

    this.updateLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.updateLayout(width, height);
    });

    // Desktop & Mobile inputs
    const queueJump = () => {
      this.jumpQueued = true;
    };

    this.input.on('pointerdown', queueJump);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === 'Space' ||
        event.code === 'ArrowUp' ||
        event.code === 'KeyW'
      ) {
        event.preventDefault();
        queueJump();
      }
    };
    if (keyboard) {
      keyboard.on('keydown', handleKeyDown);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', queueJump);
      if (keyboard) {
        keyboard.off('keydown', handleKeyDown);
      }
      this.obstacleSprites.clear();
      this.obstaclePool = [];
    });
  }

  override update(_time: number, delta: number): void {
    const state = this.runnerState;
    if (!state || state.status !== 'running') {
      return;
    }

    const dtSeconds = delta / 1000;
    const jumpPressed = this.jumpQueued;
    this.jumpQueued = false;

    const events = stepRunnerSimulation(
      state,
      { jumpPressed },
      dtSeconds,
      DEFAULT_RUNNER_CONFIG,
    );

    if (events.jumped && !this.hasJumpedOnce) {
      this.hasJumpedOnce = true;
      if (this.hintText) {
        this.hintText.setVisible(false);
      }
    }

    this.syncVisuals(state);

    if (events.collided) {
      const payload: GameOverData = {
        score: state.score,
        distance: Math.floor(state.distance),
      };
      this.scene.start('GameOver', payload);
    }
  }

  private syncVisuals(state: RunnerState): void {
    if (this.groundTile) {
      this.groundTile.tilePositionX = state.groundOffset;
    }

    if (this.trexSprite) {
      this.trexSprite.setPosition(state.trex.x, state.trex.y);
      if (state.trex.isGrounded) {
        if (
          !this.trexSprite.anims.isPlaying ||
          this.trexSprite.anims.currentAnim?.key !== ANIMATION_KEYS.trexRun
        ) {
          this.trexSprite.play(ANIMATION_KEYS.trexRun);
        }
      } else {
        this.trexSprite.stop();
        this.trexSprite.setTexture(TEXTURE_KEYS.trexJump);
      }
    }

    this.syncObstacles(state.obstacles);

    if (this.scoreText) {
      const padded = String(state.score).padStart(5, '0');
      this.scoreText.setText(`SCORE ${padded}`);
    }

    if (this.distanceText) {
      this.distanceText.setText(`${Math.floor(state.distance)} m`);
    }
  }

  private syncObstacles(obstacles: readonly CactusObstacle[]): void {
    const activeIds = new Set<number>();
    for (const obs of obstacles) {
      activeIds.add(obs.id);
    }

    // Recycle sprites for obstacles that left the screen
    for (const [id, sprite] of this.obstacleSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.setVisible(false);
        this.obstaclePool.push(sprite);
        this.obstacleSprites.delete(id);
      }
    }

    // Position or acquire sprites for active obstacles
    for (const obs of obstacles) {
      let sprite = this.obstacleSprites.get(obs.id);
      if (!sprite) {
        const pooled = this.obstaclePool.pop();
        if (pooled) {
          sprite = pooled;
          sprite.setTexture(getCactusTextureKey(obs.variant));
          sprite.setVisible(true);
        } else {
          sprite = this.add
            .image(obs.x, obs.y, getCactusTextureKey(obs.variant))
            .setOrigin(0, 1);
          this.hudCamera?.ignore(sprite);
        }
        this.obstacleSprites.set(obs.id, sprite);
      }
      sprite.setPosition(obs.x, obs.y);
    }
  }

  private updateLayout(width: number, height: number): void {
    const viewport = computeWorldViewport(width, height);

    if (this.worldCamera) {
      this.worldCamera.setSize(width, height);
      this.worldCamera.setZoom(viewport.zoom);
      this.worldCamera.centerOn(viewport.centerX, viewport.centerY);
    }

    if (this.hudCamera) {
      this.hudCamera.setSize(width, height);
      this.hudCamera.setZoom(1);
    }

    const hudScale = Math.max(0.8, Math.min(1.2, Math.min(width, height) / 540));

    if (this.scoreText) {
      this.scoreText.setPosition(width - 18, 16);
      this.scoreText.setScale(hudScale);
    }

    if (this.distanceText) {
      this.distanceText.setPosition(width - 18, 16 + Math.round(28 * hudScale));
      this.distanceText.setScale(hudScale);
    }

    if (this.hintText) {
      this.hintText.setPosition(width / 2, height - 18);
      this.hintText.setScale(hudScale);
    }
  }
}
