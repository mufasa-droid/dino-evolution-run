import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { ensureProceduralTextures } from '../assets/proceduralTextures.ts';
import { attachResponsiveResize } from './sceneResize.ts';

export class Preloader extends Scene {
  private barOutline: Phaser.GameObjects.Rectangle | null = null;
  private barFill: Phaser.GameObjects.Rectangle | null = null;
  private labelText: Phaser.GameObjects.Text | null = null;
  private currentProgress = 0;

  constructor() {
    super('Preloader');
  }

  init(): void {
    this.barOutline = null;
    this.barFill = null;
    this.labelText = null;
    this.currentProgress = 0;

    this.cameras.main.setBackgroundColor(0xf5efe0);

    this.labelText = this.add
      .text(0, 0, 'LOADING...', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.barOutline = this.add
      .rectangle(0, 0, 320, 26)
      .setStrokeStyle(2, 0x2d4a3e)
      .setOrigin(0.5);
    this.barFill = this.add
      .rectangle(0, 0, 4, 20, 0x2d4a3e)
      .setOrigin(0, 0.5);

    this.updateLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.updateLayout(width, height);
    });

    const handleProgress = (progress: number) => {
      this.currentProgress = progress;
      this.updateBarFillWidth();
    };

    this.load.on('progress', handleProgress);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.load.off('progress', handleProgress);
    });
  }

  preload(): void {
    this.load.setPath('../assets');
    this.load.image('logo', 'logo.png');
  }

  create(): void {
    ensureProceduralTextures(this);
    this.scene.start('MainMenu');
  }

  private updateBarFillWidth(): void {
    if (!this.barFill || !this.barOutline) {
      return;
    }
    const maxFillWidth = Math.max(4, this.barOutline.width - 8);
    this.barFill.width = 4 + (maxFillWidth - 4) * this.currentProgress;
  }

  private updateLayout(width: number, height: number): void {
    this.cameras.resize(width, height);

    if (this.labelText) {
      this.labelText.setPosition(width / 2, height / 2 - 34);
    }

    const barWidth = Math.min(420, Math.max(200, width * 0.68));
    if (this.barOutline) {
      this.barOutline.setPosition(width / 2, height / 2);
      this.barOutline.setSize(barWidth, 26);
    }
    if (this.barFill) {
      this.barFill.setPosition(width / 2 - barWidth / 2 + 4, height / 2);
      this.updateBarFillWidth();
    }
  }
}
