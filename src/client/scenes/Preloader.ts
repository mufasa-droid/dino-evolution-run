import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { ensureProceduralTextures } from '../assets/proceduralTextures';
import { attachResponsiveResize } from './sceneResize';

export class Preloader extends Scene {
  private background: Phaser.GameObjects.Image | null = null;
  private barOutline: Phaser.GameObjects.Rectangle | null = null;
  private barFill: Phaser.GameObjects.Rectangle | null = null;
  private currentProgress = 0;

  constructor() {
    super('Preloader');
  }

  init(): void {
    this.background = null;
    this.barOutline = null;
    this.barFill = null;
    this.currentProgress = 0;

    this.background = this.add.image(0, 0, 'background').setOrigin(0);
    this.barOutline = this.add
      .rectangle(0, 0, 320, 28)
      .setStrokeStyle(2, 0x2d4a3e)
      .setOrigin(0.5);
    this.barFill = this.add
      .rectangle(0, 0, 4, 22, 0x2d4a3e)
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

    if (this.background) {
      this.background.setDisplaySize(width, height);
    }

    const barWidth = Math.min(468, Math.max(220, width * 0.7));
    if (this.barOutline) {
      this.barOutline.setPosition(width / 2, height / 2);
      this.barOutline.setSize(barWidth, 28);
    }
    if (this.barFill) {
      this.barFill.setPosition(width / 2 - barWidth / 2 + 4, height / 2);
      this.updateBarFillWidth();
    }
  }
}
