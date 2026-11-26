import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { ANIMATION_KEYS, TEXTURE_KEYS } from '../assets/proceduralTextures.ts';
import { audioService } from '../services/audio.ts';
import { getLocalBest } from '../services/storage.ts';
import { attachResponsiveResize } from './sceneResize.ts';

export class MainMenu extends Scene {
  private titleText: Phaser.GameObjects.Text | null = null;
  private subtitleText: Phaser.GameObjects.Text | null = null;
  private bestText: Phaser.GameObjects.Text | null = null;
  private promptText: Phaser.GameObjects.Text | null = null;
  private muteButtonBg: Phaser.GameObjects.Rectangle | null = null;
  private muteButtonText: Phaser.GameObjects.Text | null = null;
  private dinoPreview: Phaser.GameObjects.Sprite | null = null;
  private groundStrip: Phaser.GameObjects.TileSprite | null = null;
  private groundLine: Phaser.GameObjects.Rectangle | null = null;
  private mutePointerActive = false;

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.titleText = null;
    this.subtitleText = null;
    this.bestText = null;
    this.promptText = null;
    this.muteButtonBg = null;
    this.muteButtonText = null;
    this.dinoPreview = null;
    this.groundStrip = null;
    this.groundLine = null;
    this.mutePointerActive = false;
  }

  create(): void {
    audioService.stopAll();
    this.cameras.main.setBackgroundColor(0xf5efe0);

    this.groundStrip = this.add
      .tileSprite(0, 0, this.scale.width, 100, TEXTURE_KEYS.groundTile)
      .setOrigin(0, 0)
      .setTint(0xe8dfc8);

    this.groundLine = this.add
      .rectangle(0, 0, this.scale.width, 4, 0x534b3b)
      .setOrigin(0, 0);

    this.dinoPreview = this.add
      .sprite(0, 0, TEXTURE_KEYS.trexRun0)
      .setOrigin(0.5, 1);
    this.dinoPreview.play(ANIMATION_KEYS.trexRun);

    this.titleText = this.add
      .text(0, 0, 'DINOSAUR\nEVOLUTION RUNNER', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '38px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.subtitleText = this.add
      .text(0, 0, 'Jump, evolve & survive across prehistoric eras', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#534b3b',
        align: 'center',
      })
      .setOrigin(0.5);

    const localBest = getLocalBest();
    this.bestText = this.add
      .text(
        0,
        0,
        localBest.bestScore > 0
          ? `BEST: ${localBest.bestScore} (${localBest.bestDistance} m)`
          : '',
        {
          fontFamily: 'Arial Black, sans-serif',
          fontSize: '16px',
          color: '#a84b2a',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setVisible(localBest.bestScore > 0);

    this.promptText = this.add
      .text(0, 0, 'Tap or Press Space to Start', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#2d4a3e',
        padding: { x: 22, y: 11 },
        align: 'center',
      })
      .setOrigin(0.5);

    this.muteButtonBg = this.add
      .rectangle(0, 0, 88, 28, 0xe8dfc8)
      .setOrigin(1, 0)
      .setStrokeStyle(2, 0x534b3b)
      .setInteractive({ useHandCursor: true });

    this.muteButtonText = this.add
      .text(0, 0, audioService.isMuted() ? 'SOUND: OFF' : 'SOUND: ON', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '11px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.refreshLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.refreshLayout(width, height);
    });

    const handleMuteDown = (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      this.mutePointerActive = true;
      audioService.unlock();
      const muted = audioService.toggleMute();
      this.muteButtonText?.setText(muted ? 'SOUND: OFF' : 'SOUND: ON');
    };

    const startGame = () => {
      if (this.mutePointerActive) {
        this.mutePointerActive = false;
        return;
      }
      audioService.unlock();
      this.scene.start('Game');
    };

    this.muteButtonBg.on('pointerdown', handleMuteDown);
    this.input.on('pointerdown', startGame);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'ArrowUp') {
        event.preventDefault();
        audioService.unlock();
        this.scene.start('Game');
      }
    };
    if (keyboard) {
      keyboard.on('keydown', handleKeyDown);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.muteButtonBg?.off('pointerdown', handleMuteDown);
      this.input.off('pointerdown', startGame);
      if (keyboard) {
        keyboard.off('keydown', handleKeyDown);
      }
    });
  }

  private refreshLayout(width: number, height: number): void {
    this.cameras.resize(width, height);

    const minDim = Math.min(width, height);
    const scaleFactor = Math.max(0.62, Math.min(1.18, minDim / 540));
    const groundY = Math.round(height * 0.72);

    if (this.groundStrip) {
      this.groundStrip.setPosition(0, groundY);
      this.groundStrip.setSize(width, Math.max(100, height - groundY));
    }

    if (this.groundLine) {
      this.groundLine.setPosition(0, groundY);
      this.groundLine.setSize(width, 4);
    }

    if (this.dinoPreview) {
      this.dinoPreview.setPosition(width / 2, groundY);
      this.dinoPreview.setScale(scaleFactor * 1.4);
    }

    if (this.titleText) {
      this.titleText.setPosition(width / 2, height * 0.22);
      this.titleText.setScale(scaleFactor);
    }

    if (this.subtitleText) {
      this.subtitleText.setPosition(width / 2, height * 0.37);
      this.subtitleText.setScale(scaleFactor);
    }

    if (this.bestText) {
      this.bestText.setPosition(width / 2, height * 0.45);
      this.bestText.setScale(scaleFactor);
    }

    if (this.promptText) {
      this.promptText.setPosition(width / 2, Math.min(height - 34, groundY + 52));
      this.promptText.setScale(scaleFactor);
    }

    if (this.muteButtonBg && this.muteButtonText) {
      const btnW = Math.round(88 * scaleFactor);
      const btnH = Math.round(28 * scaleFactor);
      const rightX = width - 14;
      const topY = 14;
      this.muteButtonBg.setPosition(rightX, topY);
      this.muteButtonBg.setScale(scaleFactor);
      this.muteButtonText.setPosition(rightX - btnW * 0.5, topY + btnH * 0.5);
      this.muteButtonText.setScale(scaleFactor);
    }
  }
}
