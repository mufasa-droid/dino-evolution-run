import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { ANIMATION_KEYS, TEXTURE_KEYS } from '../assets/proceduralTextures';
import { attachResponsiveResize } from './sceneResize';

export class MainMenu extends Scene {
  private titleText: Phaser.GameObjects.Text | null = null;
  private subtitleText: Phaser.GameObjects.Text | null = null;
  private promptText: Phaser.GameObjects.Text | null = null;
  private dinoPreview: Phaser.GameObjects.Sprite | null = null;
  private groundStrip: Phaser.GameObjects.TileSprite | null = null;
  private groundLine: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.titleText = null;
    this.subtitleText = null;
    this.promptText = null;
    this.dinoPreview = null;
    this.groundStrip = null;
    this.groundLine = null;
  }

  create(): void {
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
        fontSize: '40px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.subtitleText = this.add
      .text(0, 0, 'Jump over cacti & survive', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#534b3b',
        align: 'center',
      })
      .setOrigin(0.5);

    this.promptText = this.add
      .text(0, 0, 'Tap or Press Space to Start', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#2d4a3e',
        padding: { x: 20, y: 10 },
        align: 'center',
      })
      .setOrigin(0.5);

    this.refreshLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.refreshLayout(width, height);
    });

    const startGame = () => {
      this.scene.start('Game');
    };

    this.input.once('pointerdown', startGame);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'ArrowUp') {
        event.preventDefault();
        startGame();
      }
    };
    if (keyboard) {
      keyboard.on('keydown', handleKeyDown);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', startGame);
      if (keyboard) {
        keyboard.off('keydown', handleKeyDown);
      }
    });
  }

  private refreshLayout(width: number, height: number): void {
    this.cameras.resize(width, height);

    const minDim = Math.min(width, height);
    const scaleFactor = Math.max(0.6, Math.min(1.2, minDim / 540));
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
      this.titleText.setPosition(width / 2, height * 0.24);
      this.titleText.setScale(scaleFactor);
    }

    if (this.subtitleText) {
      this.subtitleText.setPosition(width / 2, height * 0.41);
      this.subtitleText.setScale(scaleFactor);
    }

    if (this.promptText) {
      this.promptText.setPosition(width / 2, Math.min(height - 36, groundY + 52));
      this.promptText.setScale(scaleFactor);
    }
  }
}
