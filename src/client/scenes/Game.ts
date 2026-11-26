import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import {
  ANIMATION_KEYS,
  TEXTURE_KEYS,
  getObstacleTextureKey,
  getSpeciesVisuals,
} from '../assets/proceduralTextures.ts';
import { canActivateSpeciesAbility } from '../game/abilities.ts';
import { DEFAULT_RUNNER_CONFIG, GROUND_Y } from '../game/constants.ts';
import {
  ENVIRONMENT_CONFIGS,
  lerpEnvironmentPalette,
} from '../game/environments.ts';
import { computeHudLayout } from '../game/hudLayout.ts';
import {
  clearParticlePool,
  createParticlePool,
  emitParticleBurst,
  stepParticlePool,
  type ParticlePool,
} from '../game/particles.ts';
import { createRunnerState, stepRunnerSimulation } from '../game/simulation.ts';
import { DINOSAUR_SPECS } from '../game/species.ts';
import type {
  EnvironmentPalette,
  EvolutionOrb,
  GameOverData,
  Obstacle,
  RunnerState,
} from '../game/types.ts';
import { computeWorldViewport } from '../game/viewport.ts';
import { audioService } from '../services/audio.ts';
import { attachResponsiveResize } from './sceneResize.ts';

function isJumpKeyCode(code: string): boolean {
  return code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
}

function isAbilityKeyCode(code: string): boolean {
  return (
    code === 'ShiftLeft' ||
    code === 'ShiftRight' ||
    code === 'KeyE' ||
    code === 'ArrowDown' ||
    code === 'KeyS'
  );
}

const PARTICLE_POOL_CAPACITY = 32;

export class Game extends Scene {
  private runnerState: RunnerState | null = null;
  private worldCamera: Phaser.Cameras.Scene2D.Camera | null = null;
  private hudCamera: Phaser.Cameras.Scene2D.Camera | null = null;

  private farParallaxTile: Phaser.GameObjects.TileSprite | null = null;
  private midParallaxTile: Phaser.GameObjects.TileSprite | null = null;
  private groundTile: Phaser.GameObjects.TileSprite | null = null;
  private groundLine: Phaser.GameObjects.Rectangle | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private armourShieldSprite: Phaser.GameObjects.Image | null = null;
  private chargeAuraSprite: Phaser.GameObjects.Image | null = null;
  private obstacleSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private obstaclePool: Phaser.GameObjects.Sprite[] = [];
  private orbSprites: Map<number, Phaser.GameObjects.Image> = new Map();
  private orbPool: Phaser.GameObjects.Image[] = [];

  private particlePool: ParticlePool = createParticlePool(PARTICLE_POOL_CAPACITY);
  private particleRects: Phaser.GameObjects.Rectangle[] = [];

  private scoreText: Phaser.GameObjects.Text | null = null;
  private distanceText: Phaser.GameObjects.Text | null = null;
  private muteButtonBg: Phaser.GameObjects.Rectangle | null = null;
  private muteButtonText: Phaser.GameObjects.Text | null = null;
  private speciesText: Phaser.GameObjects.Text | null = null;
  private timerBarBg: Phaser.GameObjects.Rectangle | null = null;
  private timerBarFill: Phaser.GameObjects.Rectangle | null = null;
  private abilityStatusText: Phaser.GameObjects.Text | null = null;
  private abilityButtonBg: Phaser.GameObjects.Rectangle | null = null;
  private abilityButtonText: Phaser.GameObjects.Text | null = null;
  private lastAbilityButtonLabel = '';
  private lastAbilityVisible = false;
  private envBannerText: Phaser.GameObjects.Text | null = null;
  private hintText: Phaser.GameObjects.Text | null = null;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private worldObjects: Phaser.GameObjects.GameObject[] = [];

  private fromPalette: EnvironmentPalette = ENVIRONMENT_CONFIGS.desert.palette;
  private targetPalette: EnvironmentPalette = ENVIRONMENT_CONFIGS.desert.palette;
  private activePalette: EnvironmentPalette = ENVIRONMENT_CONFIGS.desert.palette;
  private envTransitionProgress = 1;
  private envBannerTimer = 0;

  private jumpQueued = false;
  private jumpHeld = false;
  private abilityQueued = false;
  private hudPointerActive = false;
  private heldJumpKeys: Set<string> = new Set();
  private hasJumpedOnce = false;
  private wasAirborne = false;
  private transformFlashTimer = 0;

  constructor() {
    super('Game');
  }

  init(): void {
    this.runnerState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    this.worldCamera = null;
    this.hudCamera = null;
    this.farParallaxTile = null;
    this.midParallaxTile = null;
    this.groundTile = null;
    this.groundLine = null;
    this.playerSprite = null;
    this.armourShieldSprite = null;
    this.chargeAuraSprite = null;
    this.obstacleSprites.clear();
    this.obstaclePool = [];
    this.orbSprites.clear();
    this.orbPool = [];
    clearParticlePool(this.particlePool);
    this.particleRects = [];
    this.scoreText = null;
    this.distanceText = null;
    this.muteButtonBg = null;
    this.muteButtonText = null;
    this.speciesText = null;
    this.timerBarBg = null;
    this.timerBarFill = null;
    this.abilityStatusText = null;
    this.abilityButtonBg = null;
    this.abilityButtonText = null;
    this.lastAbilityButtonLabel = '';
    this.lastAbilityVisible = false;
    this.envBannerText = null;
    this.hintText = null;
    this.hudObjects = [];
    this.worldObjects = [];
    this.fromPalette = ENVIRONMENT_CONFIGS.desert.palette;
    this.targetPalette = ENVIRONMENT_CONFIGS.desert.palette;
    this.activePalette = ENVIRONMENT_CONFIGS.desert.palette;
    this.envTransitionProgress = 1;
    this.envBannerTimer = 0;
    this.jumpQueued = false;
    this.jumpHeld = false;
    this.abilityQueued = false;
    this.hudPointerActive = false;
    this.heldJumpKeys.clear();
    this.hasJumpedOnce = false;
    this.wasAirborne = false;
    this.transformFlashTimer = 0;
  }

  create(): void {
    const state = this.runnerState;
    if (!state) {
      return;
    }

    this.worldCamera = this.cameras.main;
    this.worldCamera.setBackgroundColor(this.activePalette.skyColor);

    this.hudCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);

    // World objects (rendered by worldCamera only)
    this.farParallaxTile = this.add
      .tileSprite(-400, GROUND_Y, 2400, 160, TEXTURE_KEYS.parallaxFar)
      .setOrigin(0, 1)
      .setDepth(-2)
      .setTint(this.activePalette.farParallaxColor);

    this.midParallaxTile = this.add
      .tileSprite(-400, GROUND_Y, 2400, 110, TEXTURE_KEYS.parallaxMid)
      .setOrigin(0, 1)
      .setDepth(-1)
      .setTint(this.activePalette.midParallaxColor);

    this.groundTile = this.add
      .tileSprite(-400, GROUND_Y, 2400, 600, TEXTURE_KEYS.groundTile)
      .setOrigin(0, 0)
      .setDepth(0)
      .setTint(this.activePalette.groundTintColor);

    this.groundLine = this.add
      .rectangle(-400, GROUND_Y, 2400, 4, this.activePalette.groundLineColor)
      .setOrigin(0, 0)
      .setDepth(1);

    this.playerSprite = this.add
      .sprite(state.player.x, state.player.y, TEXTURE_KEYS.trexRun0)
      .setOrigin(0, 1)
      .setDepth(4);
    this.playerSprite.play(ANIMATION_KEYS.trexRun);

    this.armourShieldSprite = this.add
      .image(state.player.x, state.player.y, TEXTURE_KEYS.armourShield)
      .setOrigin(0.5, 1)
      .setDepth(5)
      .setVisible(false);

    this.chargeAuraSprite = this.add
      .image(state.player.x, state.player.y, TEXTURE_KEYS.chargeAura)
      .setOrigin(0.5, 1)
      .setDepth(5)
      .setVisible(false);

    this.worldObjects = [
      this.farParallaxTile,
      this.midParallaxTile,
      this.groundTile,
      this.groundLine,
      this.playerSprite,
      this.armourShieldSprite,
      this.chargeAuraSprite,
    ];

    for (let i = 0; i < PARTICLE_POOL_CAPACITY; i += 1) {
      const rect = this.add
        .rectangle(0, 0, 4, 4, 0xffffff)
        .setDepth(5)
        .setVisible(false);
      this.particleRects.push(rect);
      this.worldObjects.push(rect);
    }

    // HUD objects (rendered by hudCamera only)
    this.scoreText = this.add
      .text(0, 0, 'SCORE 00000', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#2d4a3e',
        align: 'right',
      })
      .setOrigin(1, 0);

    this.distanceText = this.add
      .text(0, 0, '0 m', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#534b3b',
        align: 'right',
      })
      .setOrigin(1, 0);

    this.muteButtonBg = this.add
      .rectangle(0, 0, 76, 24, 0xe8dfc8)
      .setOrigin(1, 0)
      .setStrokeStyle(1.5, 0x534b3b)
      .setInteractive({ useHandCursor: true });

    this.muteButtonText = this.add
      .text(0, 0, audioService.isMuted() ? 'MUTED' : 'SOUND', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '11px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.speciesText = this.add
      .text(0, 0, 'T-REX', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '17px',
        color: '#2d4a3e',
        align: 'left',
      })
      .setOrigin(0, 0);

    this.timerBarBg = this.add
      .rectangle(0, 0, 120, 10, 0xd4cbb5)
      .setOrigin(0, 0)
      .setVisible(false);

    this.timerBarFill = this.add
      .rectangle(0, 0, 120, 10, 0x16a34a)
      .setOrigin(0, 0)
      .setVisible(false);

    this.abilityStatusText = this.add
      .text(0, 0, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#534b3b',
        align: 'left',
      })
      .setOrigin(0, 0)
      .setVisible(false);

    this.abilityButtonBg = this.add
      .rectangle(0, 0, 142, 42, 0x2d4a3e)
      .setOrigin(1, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.abilityButtonText = this.add
      .text(0, 0, 'ABILITY', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);

    this.envBannerText = this.add
      .text(0, 0, '', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#2d4a3e',
        padding: { x: 14, y: 6 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setVisible(false);

    this.hintText = this.add
      .text(0, 0, 'Tap or Press Space to Jump', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#534b3b',
        align: 'center',
      })
      .setOrigin(0.5, 1);

    this.hudObjects = [
      this.scoreText,
      this.distanceText,
      this.muteButtonBg,
      this.muteButtonText,
      this.speciesText,
      this.timerBarBg,
      this.timerBarFill,
      this.abilityStatusText,
      this.abilityButtonBg,
      this.abilityButtonText,
      this.envBannerText,
      this.hintText,
    ];

    this.worldCamera.ignore(this.hudObjects);
    this.hudCamera.ignore(this.worldObjects);

    this.updateLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.updateLayout(width, height);
    });

    const handleAbilityButtonDown = (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      audioService.unlock();
      this.hudPointerActive = true;
      this.abilityQueued = true;
    };

    const handleMuteButtonDown = (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      audioService.unlock();
      this.hudPointerActive = true;
      const muted = audioService.toggleMute();
      this.muteButtonText?.setText(muted ? 'MUTED' : 'SOUND');
    };

    const handleScenePointerDown = () => {
      if (this.hudPointerActive) {
        this.hudPointerActive = false;
        return;
      }
      audioService.unlock();
      this.jumpQueued = true;
      this.jumpHeld = true;
    };

    const handleScenePointerUp = () => {
      this.hudPointerActive = false;
      this.jumpHeld = this.heldJumpKeys.size > 0;
    };

    this.abilityButtonBg.on('pointerdown', handleAbilityButtonDown);
    this.muteButtonBg.on('pointerdown', handleMuteButtonDown);
    this.input.on('pointerdown', handleScenePointerDown);
    this.input.on('pointerup', handleScenePointerUp);
    this.input.on('pointerupoutside', handleScenePointerUp);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent) => {
      audioService.unlock();
      if (isJumpKeyCode(event.code)) {
        event.preventDefault();
        if (!this.heldJumpKeys.has(event.code)) {
          this.jumpQueued = true;
        }
        this.heldJumpKeys.add(event.code);
        this.jumpHeld = true;
      } else if (isAbilityKeyCode(event.code)) {
        event.preventDefault();
        if (!event.repeat) {
          this.abilityQueued = true;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isJumpKeyCode(event.code)) {
        this.heldJumpKeys.delete(event.code);
        this.jumpHeld = this.heldJumpKeys.size > 0;
      }
    };

    if (keyboard) {
      keyboard.on('keydown', handleKeyDown);
      keyboard.on('keyup', handleKeyUp);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      audioService.stopAll();
      clearParticlePool(this.particlePool);
      this.abilityButtonBg?.off('pointerdown', handleAbilityButtonDown);
      this.muteButtonBg?.off('pointerdown', handleMuteButtonDown);
      this.input.off('pointerdown', handleScenePointerDown);
      this.input.off('pointerup', handleScenePointerUp);
      this.input.off('pointerupoutside', handleScenePointerUp);
      if (keyboard) {
        keyboard.off('keydown', handleKeyDown);
        keyboard.off('keyup', handleKeyUp);
      }
      this.obstacleSprites.clear();
      this.obstaclePool = [];
      this.orbSprites.clear();
      this.orbPool = [];
      this.particleRects = [];
    });
  }

  override update(time: number, delta: number): void {
    const state = this.runnerState;
    if (!state || state.status !== 'running') {
      return;
    }

    const dtSeconds = delta / 1000;
    const jumpPressed = this.jumpQueued;
    const abilityPressed = this.abilityQueued;
    this.jumpQueued = false;
    this.abilityQueued = false;

    const events = stepRunnerSimulation(
      state,
      { jumpPressed, jumpHeld: this.jumpHeld, abilityPressed },
      dtSeconds,
      DEFAULT_RUNNER_CONFIG,
    );

    if (events.jumped) {
      audioService.playJump();
      if (!this.hasJumpedOnce) {
        this.hasJumpedOnce = true;
        this.hintText?.setVisible(false);
      }
    }

    const landedThisFrame =
      this.wasAirborne && state.player.isGrounded && !state.player.isFallingInGap;
    this.wasAirborne = !state.player.isGrounded;

    if (landedThisFrame) {
      audioService.playLand();
      emitParticleBurst(
        this.particlePool,
        state.player.x + state.player.visualWidth * 0.4,
        state.player.y,
        4,
        0xb5a88d,
        3,
        0.22,
      );
    }

    if (events.transformedTo !== null || events.transformationExpired) {
      this.transformFlashTimer = 0.25;
      audioService.playTransform();
      emitParticleBurst(
        this.particlePool,
        state.player.x + state.player.visualWidth * 0.5,
        state.player.y - state.player.visualHeight * 0.5,
        7,
        events.transformedTo !== null ? 0xf59e0b : 0x2d4a3e,
        5,
        0.3,
      );
    }

    if (events.transformationWarning) {
      audioService.playWarningTick();
    }

    if (events.abilityActivated !== null) {
      audioService.playAbility();
    }

    if (events.obstacleDestroyed) {
      audioService.playSmash();
      this.worldCamera?.shake(80, 0.004);
      emitParticleBurst(
        this.particlePool,
        state.player.x + state.player.visualWidth + 8,
        state.player.y - 18,
        6,
        0x9a7b56,
        5,
        0.28,
      );
    }

    if (events.armourBlocked) {
      audioService.playArmourBlock();
      this.worldCamera?.shake(90, 0.005);
      emitParticleBurst(
        this.particlePool,
        state.player.x + state.player.visualWidth * 0.6,
        state.player.y - state.player.visualHeight * 0.5,
        6,
        0x38bdf8,
        4,
        0.28,
      );
    }

    if (events.environmentChanged !== null) {
      this.fromPalette = this.activePalette;
      this.targetPalette = ENVIRONMENT_CONFIGS[events.environmentChanged].palette;
      this.envTransitionProgress = 0;
      if (this.envBannerText) {
        this.envBannerText.setText(
          ENVIRONMENT_CONFIGS[events.environmentChanged].displayName.toUpperCase(),
        );
        this.envBannerText.setVisible(true);
        this.envBannerTimer = 2.0;
      }
    }

    if (this.envTransitionProgress < 1) {
      this.envTransitionProgress = Math.min(
        1,
        this.envTransitionProgress + dtSeconds / 1.5,
      );
      this.activePalette = lerpEnvironmentPalette(
        this.fromPalette,
        this.targetPalette,
        this.envTransitionProgress,
      );
    }

    if (this.envBannerTimer > 0) {
      this.envBannerTimer = Math.max(0, this.envBannerTimer - dtSeconds);
      if (this.envBannerTimer <= 0 && this.envBannerText) {
        this.envBannerText.setVisible(false);
      }
    }

    if (this.transformFlashTimer > 0) {
      this.transformFlashTimer = Math.max(0, this.transformFlashTimer - dtSeconds);
    }

    stepParticlePool(this.particlePool, dtSeconds);
    this.syncVisuals(state, time);

    if (events.collided) {
      audioService.playGameOver();
      const payload: GameOverData = {
        score: state.score,
        distance: Math.floor(state.distance),
      };
      this.scene.start('GameOver', payload);
    }
  }

  private syncVisuals(state: RunnerState, timeMs: number): void {
    this.worldCamera?.setBackgroundColor(this.activePalette.skyColor);

    if (this.farParallaxTile) {
      this.farParallaxTile.tilePositionX = state.groundOffset * 0.12;
      this.farParallaxTile.setTint(this.activePalette.farParallaxColor);
    }

    if (this.midParallaxTile) {
      this.midParallaxTile.tilePositionX = state.groundOffset * 0.35;
      this.midParallaxTile.setTint(this.activePalette.midParallaxColor);
    }

    if (this.groundTile) {
      this.groundTile.tilePositionX = state.groundOffset;
      this.groundTile.setTint(this.activePalette.groundTintColor);
    }

    if (this.groundLine) {
      this.groundLine.setFillStyle(this.activePalette.groundLineColor);
    }

    if (this.playerSprite) {
      this.playerSprite.setPosition(state.player.x, state.player.y);
      this.syncPlayerAnimation(state);

      if (this.transformFlashTimer > 0) {
        const pulseScale = 1 + (this.transformFlashTimer / 0.25) * 0.16;
        this.playerSprite.setScale(pulseScale);
        this.playerSprite.setAlpha(1);
      } else {
        this.playerSprite.setScale(1);
        if (state.abilities.invulnerabilityRemainingSeconds > 0) {
          this.playerSprite.setAlpha(0.45 + 0.55 * Math.abs(Math.sin(timeMs * 0.03)));
        } else if (state.transformation.warningActive) {
          this.playerSprite.setAlpha(0.6 + 0.4 * Math.sin(timeMs * 0.02));
        } else {
          this.playerSprite.setAlpha(1);
        }
      }
    }

    if (this.armourShieldSprite) {
      const showArmour =
        state.player.species === 'ankylosaurus' && state.abilities.armourActive;
      this.armourShieldSprite.setVisible(showArmour);
      if (showArmour) {
        this.armourShieldSprite.setPosition(
          state.player.x + state.player.visualWidth * 0.5,
          state.player.y + 6,
        );
      }
    }

    if (this.chargeAuraSprite) {
      const showCharge =
        state.player.species === 'triceratops' && state.abilities.chargeActive;
      this.chargeAuraSprite.setVisible(showCharge);
      if (showCharge) {
        this.chargeAuraSprite.setPosition(
          state.player.x + state.player.visualWidth * 0.5 - 10,
          state.player.y + 2,
        );
      }
    }

    this.syncParticles();
    this.syncObstacles(state.obstacles);
    this.syncOrbs(state.orbs, timeMs);
    this.syncHud(state);
  }

  private syncParticles(): void {
    for (let i = 0; i < this.particlePool.slots.length; i += 1) {
      const slot = this.particlePool.slots[i];
      const rect = this.particleRects[i];
      if (!slot || !rect) {
        continue;
      }
      if (!slot.active) {
        rect.setVisible(false);
        continue;
      }
      rect.setVisible(true);
      rect.setPosition(slot.x, slot.y);
      rect.setSize(slot.size, slot.size);
      rect.setFillStyle(slot.color);
      rect.setAlpha(Math.max(0.15, slot.life / slot.maxLife));
    }
  }

  private syncPlayerAnimation(state: RunnerState): void {
    if (!this.playerSprite) {
      return;
    }

    const species = state.player.species;
    const visuals = getSpeciesVisuals(species);

    if (species === 'pterodactyl' && state.abilities.isGliding) {
      this.playerSprite.stop();
      this.playerSprite.setTexture(TEXTURE_KEYS.pteroGlide);
      return;
    }

    if (species === 'triceratops' && state.abilities.chargeActive) {
      if (
        !this.playerSprite.anims.isPlaying ||
        this.playerSprite.anims.currentAnim?.key !== ANIMATION_KEYS.triceraCharge
      ) {
        this.playerSprite.play(ANIMATION_KEYS.triceraCharge);
      }
      return;
    }

    if (state.player.isGrounded) {
      if (species === 'trex' && state.abilities.landingTimer > 0) {
        this.playerSprite.stop();
        this.playerSprite.setTexture(TEXTURE_KEYS.trexLand);
        return;
      }

      if (
        !this.playerSprite.anims.isPlaying ||
        this.playerSprite.anims.currentAnim?.key !== visuals.runAnimKey
      ) {
        this.playerSprite.play(visuals.runAnimKey);
      }
    } else {
      this.playerSprite.stop();
      this.playerSprite.setTexture(visuals.jumpTextureKey);
    }
  }

  private syncHud(state: RunnerState): void {
    if (this.scoreText) {
      const padded = String(state.score).padStart(5, '0');
      this.scoreText.setText(`SCORE ${padded}`);
    }

    if (this.distanceText) {
      this.distanceText.setText(`${Math.floor(state.distance)} m`);
    }

    const t = state.transformation;
    const spec = DINOSAUR_SPECS[t.activeSpecies];
    const isTransformed = t.activeSpecies !== 'trex';

    if (this.speciesText) {
      if (isTransformed) {
        this.speciesText.setText(
          `${spec.displayName.toUpperCase()} ${t.remainingSeconds.toFixed(1)}s`,
        );
        this.speciesText.setColor(t.warningActive ? '#d93900' : '#2d4a3e');
      } else {
        this.speciesText.setText(spec.displayName.toUpperCase());
        this.speciesText.setColor('#2d4a3e');
      }
    }

    if (this.timerBarBg && this.timerBarFill) {
      this.timerBarBg.setVisible(isTransformed);
      this.timerBarFill.setVisible(isTransformed);
      if (isTransformed) {
        const ratio = Math.max(0, Math.min(1, t.remainingSeconds / t.durationSeconds));
        this.timerBarFill.width = Math.max(2, 120 * ratio);
        this.timerBarFill.setFillStyle(t.warningActive ? 0xd93900 : 0x16a34a);
      }
    }

    this.syncAbilityHud(state);
  }

  private syncAbilityHud(state: RunnerState): void {
    const species = state.player.species;
    const abilities = state.abilities;
    const hasActiveButtonSpecies =
      species === 'triceratops' || species === 'ankylosaurus';

    if (hasActiveButtonSpecies !== this.lastAbilityVisible) {
      this.lastAbilityVisible = hasActiveButtonSpecies;
      this.updateLayout(this.scale.width, this.scale.height);
    }

    if (this.abilityButtonBg && this.abilityButtonText) {
      this.abilityButtonBg.setVisible(hasActiveButtonSpecies);
      this.abilityButtonText.setVisible(hasActiveButtonSpecies);

      if (hasActiveButtonSpecies) {
        const ready = canActivateSpeciesAbility(species, abilities);
        let label: string;
        let bgColor: number;

        if (species === 'triceratops') {
          if (abilities.chargeActive) {
            label = `CHARGING ${abilities.chargeRemainingSeconds.toFixed(1)}s`;
            bgColor = 0xd9480f;
          } else if (ready) {
            label = 'CHARGE';
            bgColor = 0xa84b2a;
          } else {
            label = `CD ${abilities.chargeCooldownRemainingSeconds.toFixed(1)}s`;
            bgColor = 0x6b655c;
          }
        } else {
          if (abilities.armourActive) {
            label = `ARMOUR ${abilities.armourRemainingSeconds.toFixed(1)}s`;
            bgColor = 0x0284c7;
          } else if (ready) {
            label = 'ARMOUR';
            bgColor = 0x3f5475;
          } else {
            label = `CD ${abilities.armourCooldownRemainingSeconds.toFixed(1)}s`;
            bgColor = 0x6b655c;
          }
        }

        this.abilityButtonBg.setFillStyle(bgColor);
        if (label !== this.lastAbilityButtonLabel) {
          this.lastAbilityButtonLabel = label;
          this.abilityButtonText.setText(label);
        }
      } else {
        this.lastAbilityButtonLabel = '';
      }
    }

    if (this.abilityStatusText) {
      if (species === 'pterodactyl') {
        this.abilityStatusText.setVisible(true);
        this.abilityStatusText.setText(
          abilities.isGliding ? 'GLIDING (Hold Jump)' : 'Hold Jump to Glide',
        );
      } else if (hasActiveButtonSpecies) {
        this.abilityStatusText.setVisible(true);
        this.abilityStatusText.setText(
          species === 'triceratops' ? 'Shift/E/Down: Charge' : 'Shift/E/Down: Armour',
        );
      } else {
        this.abilityStatusText.setVisible(false);
      }
    }
  }

  private configureObstacleSprite(
    sprite: Phaser.GameObjects.Sprite,
    obs: Obstacle,
  ): void {
    sprite.stop();
    sprite.setTexture(getObstacleTextureKey(obs.typeId));

    if (obs.kind === 'gap') {
      sprite.setOrigin(0, 0);
      sprite.setDisplaySize(obs.width, 600);
      sprite.setDepth(2);
      sprite.setTint(this.activePalette.skyColor);
    } else {
      sprite.setOrigin(0, 1);
      sprite.setScale(1, 1);
      sprite.clearTint();
      sprite.setDepth(3);
      if (obs.kind === 'bird') {
        sprite.play(ANIMATION_KEYS.birdFlap);
      }
    }
  }

  private syncObstacles(obstacles: readonly Obstacle[]): void {
    const activeIds = new Set<number>();
    for (const obs of obstacles) {
      activeIds.add(obs.id);
    }

    for (const [id, sprite] of this.obstacleSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.stop();
        sprite.setVisible(false);
        this.obstaclePool.push(sprite);
        this.obstacleSprites.delete(id);
      }
    }

    for (const obs of obstacles) {
      let sprite = this.obstacleSprites.get(obs.id);
      if (!sprite) {
        const pooled = this.obstaclePool.pop();
        if (pooled) {
          sprite = pooled;
          sprite.setVisible(true);
        } else {
          sprite = this.add.sprite(obs.x, obs.y, getObstacleTextureKey(obs.typeId));
          this.hudCamera?.ignore(sprite);
        }
        this.configureObstacleSprite(sprite, obs);
        this.obstacleSprites.set(obs.id, sprite);
      }
      sprite.setPosition(obs.x, obs.y);
      if (obs.kind === 'gap') {
        sprite.setTint(this.activePalette.skyColor);
      }
    }
  }

  private syncOrbs(orbs: readonly EvolutionOrb[], timeMs: number): void {
    const activeIds = new Set<number>();
    for (const orb of orbs) {
      activeIds.add(orb.id);
    }

    for (const [id, sprite] of this.orbSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.setVisible(false);
        this.orbPool.push(sprite);
        this.orbSprites.delete(id);
      }
    }

    const bobY = Math.sin(timeMs * 0.008) * 3;
    for (const orb of orbs) {
      let sprite = this.orbSprites.get(orb.id);
      if (!sprite) {
        const pooled = this.orbPool.pop();
        if (pooled) {
          sprite = pooled;
          sprite.setVisible(true);
        } else {
          sprite = this.add
            .image(orb.x, orb.y, TEXTURE_KEYS.evolutionOrb)
            .setOrigin(0, 1)
            .setDepth(3);
          this.hudCamera?.ignore(sprite);
        }
        this.orbSprites.set(orb.id, sprite);
      }
      sprite.setPosition(orb.x, orb.y + bobY);
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

    const layout = computeHudLayout(width, height, this.lastAbilityVisible);

    if (this.scoreText) {
      this.scoreText.setPosition(layout.score.x, layout.score.y);
      this.scoreText.setScale(layout.score.scale);
    }

    if (this.distanceText) {
      this.distanceText.setPosition(layout.distance.x, layout.distance.y);
      this.distanceText.setScale(layout.distance.scale);
    }

    if (this.muteButtonBg && this.muteButtonText) {
      const m = layout.muteButton;
      const btnW = Math.round(m.width * m.scale);
      const btnH = Math.round(m.height * m.scale);
      this.muteButtonBg.setPosition(m.rightX, m.topY);
      this.muteButtonBg.setScale(m.scale);
      this.muteButtonText.setPosition(m.rightX - btnW * 0.5, m.topY + btnH * 0.5);
      this.muteButtonText.setScale(m.scale);
    }

    if (this.speciesText) {
      this.speciesText.setPosition(layout.species.x, layout.species.y);
      this.speciesText.setScale(layout.species.scale);
    }

    if (this.timerBarBg && this.timerBarFill) {
      this.timerBarBg.setPosition(layout.timerBar.x, layout.timerBar.y);
      this.timerBarBg.setScale(layout.timerBar.scale);
      this.timerBarFill.setPosition(layout.timerBar.x, layout.timerBar.y);
      this.timerBarFill.setScale(layout.timerBar.scale);
    }

    if (this.abilityStatusText) {
      this.abilityStatusText.setPosition(
        layout.abilityStatus.x,
        layout.abilityStatus.y,
      );
      this.abilityStatusText.setScale(layout.abilityStatus.scale);
    }

    if (this.abilityButtonBg && this.abilityButtonText) {
      const a = layout.abilityButton;
      const btnW = Math.round(a.width * a.scale);
      const btnH = Math.round(a.height * a.scale);
      this.abilityButtonBg.setPosition(a.rightX, a.bottomY);
      this.abilityButtonBg.setScale(a.scale);
      this.abilityButtonText.setPosition(
        a.rightX - btnW * 0.5,
        a.bottomY - btnH * 0.5,
      );
      this.abilityButtonText.setScale(a.scale);
    }

    if (this.envBannerText) {
      this.envBannerText.setPosition(layout.envBanner.x, layout.envBanner.y);
      this.envBannerText.setScale(layout.envBanner.scale);
    }

    if (this.hintText) {
      this.hintText.setPosition(layout.hint.x, layout.hint.y);
      this.hintText.setScale(layout.hint.scale);
    }
  }
}
