import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { GameOverData } from '../game/types';
import { attachResponsiveResize } from './sceneResize';

function isGameOverData(value: unknown): value is GameOverData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const score = Reflect.get(value, 'score');
  const distance = Reflect.get(value, 'distance');
  return (
    typeof score === 'number' &&
    Number.isFinite(score) &&
    typeof distance === 'number' &&
    Number.isFinite(distance)
  );
}

export class GameOver extends Scene {
  private result: GameOverData = { score: 0, distance: 0 };
  private headingText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;
  private restartButton: Phaser.GameObjects.Text | null = null;
  private canRestart = false;

  constructor() {
    super('GameOver');
  }

  init(data: unknown): void {
    this.result = isGameOverData(data) ? data : { score: 0, distance: 0 };
    this.headingText = null;
    this.statsText = null;
    this.restartButton = null;
    this.canRestart = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0xf5efe0);

    this.headingText = this.add
      .text(0, 0, 'GAME OVER', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '48px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.statsText = this.add
      .text(
        0,
        0,
        `Score: ${this.result.score}\nDistance: ${this.result.distance} m`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          color: '#534b3b',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.restartButton = this.add
      .text(0, 0, 'Play Again', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#2d4a3e',
        padding: { x: 24, y: 12 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.updateLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.updateLayout(width, height);
    });

    // Brief input lock prevents accidental instant-restart when jumping at collision
    const unlockTimer = this.time.delayedCall(250, () => {
      this.canRestart = true;
    });

    const restartRun = () => {
      if (!this.canRestart) {
        return;
      }
      this.scene.start('Game');
    };

    this.restartButton.on('pointerdown', restartRun);
    this.input.on('pointerdown', restartRun);

    const keyboard = this.input.keyboard;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        restartRun();
      }
    };
    if (keyboard) {
      keyboard.on('keydown', handleKeyDown);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unlockTimer.remove(false);
      this.restartButton?.off('pointerdown', restartRun);
      this.input.off('pointerdown', restartRun);
      if (keyboard) {
        keyboard.off('keydown', handleKeyDown);
      }
    });
  }

  private updateLayout(width: number, height: number): void {
    this.cameras.resize(width, height);

    const scaleFactor = Math.max(0.65, Math.min(1.2, Math.min(width, height) / 540));

    if (this.headingText) {
      this.headingText.setPosition(width / 2, height * 0.3);
      this.headingText.setScale(scaleFactor);
    }

    if (this.statsText) {
      this.statsText.setPosition(width / 2, height * 0.48);
      this.statsText.setScale(scaleFactor);
    }

    if (this.restartButton) {
      this.restartButton.setPosition(width / 2, height * 0.68);
      this.restartButton.setScale(scaleFactor);
    }
  }
}
