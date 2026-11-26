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
import { createRunnerState, stepRunnerSimulation } from '../game/simulation.ts';
import { DINOSAUR_SPECS } from '../game/species.ts';
import type {
  EvolutionOrb,
  GameOverData,
  Obstacle,
  RunnerState,
} from '../game/types.ts';
import { computeWorldViewport } from '../game/viewport.ts';
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

export class Game extends Scene {
  private runnerState: RunnerState | null = null;
  private worldCamera: Phaser.Cameras.Scene2D.Camera | null = null;
  private hudCamera: Phaser.Cameras.Scene2D.Camera | null = null;

  private groundTile: Phaser.GameObjects.TileSprite | null = null;
  private groundLine: Phaser.GameObjects.Rectangle | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private armourShieldSprite: Phaser.GameObjects.Image | null = null;
  private chargeAuraSprite: Phaser.GameObjects.Image | null = null;
  private obstacleSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private obstaclePool: Phaser.GameObjects.Sprite[] = [];
  private orbSprites: Map<number, Phaser.GameObjects.Image> = new Map();
  private orbPool: Phaser.GameObjects.Image[] = [];

  private scoreText: Phaser.GameObjects.Text | null = null;
  private distanceText: Phaser.GameObjects.Text | null = null;
  private speciesText: Phaser.GameObjects.Text | null = null;
  private timerBarBg: Phaser.GameObjects.Rectangle | null = null;
  private timerBarFill: Phaser.GameObjects.Rectangle | null = null;
  private abilityStatusText: Phaser.GameObjects.Text | null = null;
  private abilityButtonBg: Phaser.GameObjects.Rectangle | null = null;
  private abilityButtonText: Phaser.GameObjects.Text | null = null;
  private lastAbilityButtonLabel = '';
  private hintText: Phaser.GameObjects.Text | null = null;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private worldObjects: Phaser.GameObjects.GameObject[] = [];

  private jumpQueued = false;
  private jumpHeld = false;
  private abilityQueued = false;
  private abilityPointerActive = false;
  private heldJumpKeys: Set<string> = new Set();
  private hasJumpedOnce = false;
  private transformFlashTimer = 0;

  constructor() {
    super('Game');
  }

  init(): void {
    this.runnerState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    this.worldCamera = null;
    this.hudCamera = null;
    this.groundTile = null;
    this.groundLine = null;
    this.playerSprite = null;
    this.armourShieldSprite = null;
    this.chargeAuraSprite = null;
    this.obstacleSprites.clear();
    this.obstaclePool = [];
    this.orbSprites.clear();
    this.orbPool = [];
    this.scoreText = null;
    this.distanceText = null;
    this.speciesText = null;
    this.timerBarBg = null;
    this.timerBarFill = null;
    this.abilityStatusText = null;
    this.abilityButtonBg = null;
    this.abilityButtonText = null;
    this.lastAbilityButtonLabel = '';
    this.hintText = null;
    this.hudObjects = [];
    this.worldObjects = [];
    this.jumpQueued = false;
    this.jumpHeld = false;
    this.abilityQueued = false;
    this.abilityPointerActive = false;
    this.heldJumpKeys.clear();
    this.hasJumpedOnce = false;
    this.transformFlashTimer = 0;
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
      .setOrigin(0, 0)
      .setDepth(0);

    this.groundLine = this.add
      .rectangle(-400, GROUND_Y, 2400, 4, 0x534b3b)
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
      this.groundTile,
      this.groundLine,
      this.playerSprite,
      this.armourShieldSprite,
      this.chargeAuraSprite,
    ];

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

    this.speciesText = this.add
      .text(0, 0, 'T-REX', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
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
        fontSize: '13px',
        color: '#534b3b',
        align: 'left',
      })
      .setOrigin(0, 0)
      .setVisible(false);

    this.abilityButtonBg = this.add
      .rectangle(0, 0, 148, 44, 0x2d4a3e)
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

    this.hintText = this.add
      .text(0, 0, 'Tap or Press Space to Jump', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#534b3b',
        align: 'center',
      })
      .setOrigin(0.5, 1);

    this.hudObjects = [
      this.scoreText,
      this.distanceText,
      this.speciesText,
      this.timerBarBg,
      this.timerBarFill,
      this.abilityStatusText,
      this.abilityButtonBg,
      this.abilityButtonText,
      this.hintText,
    ];

    this.worldCamera.ignore(this.hudObjects);
    this.hudCamera.ignore(this.worldObjects);

    this.updateLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.updateLayout(width, height);
    });

    // Dedicated mobile/touch Ability button (never triggers Jump)
    const handleAbilityButtonDown = (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      this.abilityPointerActive = true;
      this.abilityQueued = true;
    };

    const handleScenePointerDown = () => {
      if (this.abilityPointerActive) {
        this.abilityPointerActive = false;
        return;
      }
      this.jumpQueued = true;
      this.jumpHeld = true;
    };

    const handleScenePointerUp = () => {
      this.abilityPointerActive = false;
      this.jumpHeld = this.heldJumpKeys.size > 0;
    };

    this.abilityButtonBg.on('pointerdown', handleAbilityButtonDown);
    this.input.on('pointerdown', handleScenePointerDown);
    this.input.on('pointerup', handleScenePointerUp);
    this.input.on('pointerupoutside', handleScenePointerUp);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent) => {
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
      this.abilityButtonBg?.off('pointerdown', handleAbilityButtonDown);
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

    if (events.jumped && !this.hasJumpedOnce) {
      this.hasJumpedOnce = true;
      if (this.hintText) {
        this.hintText.setVisible(false);
      }
    }

    if (events.transformedTo !== null || events.transformationExpired) {
      this.transformFlashTimer = 0.25;
    }

    if (events.obstacleDestroyed) {
      this.worldCamera?.shake(90, 0.005);
    }

    if (events.armourBlocked) {
      this.worldCamera?.shake(110, 0.006);
    }

    if (this.transformFlashTimer > 0) {
      this.transformFlashTimer = Math.max(0, this.transformFlashTimer - dtSeconds);
    }

    this.syncVisuals(state, time);

    if (events.collided) {
      const payload: GameOverData = {
        score: state.score,
        distance: Math.floor(state.distance),
      };
      this.scene.start('GameOver', payload);
    }
  }

  private syncVisuals(state: RunnerState, timeMs: number): void {
    if (this.groundTile) {
      this.groundTile.tilePositionX = state.groundOffset;
    }

    if (this.playerSprite) {
      this.playerSprite.setPosition(state.player.x, state.player.y);
      this.syncPlayerAnimation(state);

      if (this.transformFlashTimer > 0) {
        const pulseScale = 1 + (this.transformFlashTimer / 0.25) * 0.18;
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

    this.syncObstacles(state.obstacles);
    this.syncOrbs(state.orbs, timeMs);
    this.syncHud(state);
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
          abilities.isGliding ? 'GLIDING (Hold Jump)' : 'Hold Jump in air to Glide',
        );
      } else if (hasActiveButtonSpecies) {
        this.abilityStatusText.setVisible(true);
        if (species === 'triceratops') {
          this.abilityStatusText.setText('Shift / E / Down: Charge');
        } else {
          this.abilityStatusText.setText('Shift / E / Down: Armour');
        }
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
    } else {
      sprite.setOrigin(0, 1);
      sprite.setScale(1, 1);
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

    const hudScale = Math.max(0.8, Math.min(1.2, Math.min(width, height) / 540));

    if (this.scoreText) {
      this.scoreText.setPosition(width - 18, 16);
      this.scoreText.setScale(hudScale);
    }

    if (this.distanceText) {
      this.distanceText.setPosition(width - 18, 16 + Math.round(28 * hudScale));
      this.distanceText.setScale(hudScale);
    }

    if (this.speciesText) {
      this.speciesText.setPosition(18, 16);
      this.speciesText.setScale(hudScale);
    }

    if (this.timerBarBg && this.timerBarFill) {
      const barY = 16 + Math.round(26 * hudScale);
      this.timerBarBg.setPosition(18, barY);
      this.timerBarBg.setScale(hudScale);
      this.timerBarFill.setPosition(18, barY);
      this.timerBarFill.setScale(hudScale);
    }

    if (this.abilityStatusText) {
      this.abilityStatusText.setPosition(18, 16 + Math.round(42 * hudScale));
      this.abilityStatusText.setScale(hudScale);
    }

    if (this.abilityButtonBg && this.abilityButtonText) {
      const btnW = Math.round(148 * hudScale);
      const btnH = Math.round(44 * hudScale);
      const btnRight = width - 18;
      const btnBottom = height - 20;
      this.abilityButtonBg.setPosition(btnRight, btnBottom);
      this.abilityButtonBg.setScale(hudScale);
      this.abilityButtonText.setPosition(
        btnRight - btnW * 0.5,
        btnBottom - btnH * 0.5,
      );
      this.abilityButtonText.setScale(hudScale);
    }

    if (this.hintText) {
      this.hintText.setPosition(width / 2, height - 18);
      this.hintText.setScale(hudScale);
    }
  }
}
