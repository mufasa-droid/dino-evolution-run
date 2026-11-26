import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { GameOverData } from '../game/types.ts';
import { audioService } from '../services/audio.ts';
import { updateLocalBest } from '../services/storage.ts';
import { attachResponsiveResize } from './sceneResize.ts';

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
  private bestScore = 0;
  private isNewBest = false;
  private headingText: Phaser.GameObjects.Text | null = null;
  private newBestText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;
  private restartButton: Phaser.GameObjects.Text | null = null;
  private menuButton: Phaser.GameObjects.Text | null = null;
  private canRestart = false;

  constructor() {
    super('GameOver');
  }

  init(data: unknown): void {
    this.result = isGameOverData(data) ? data : { score: 0, distance: 0 };
    const bestResult = updateLocalBest(this.result.score, this.result.distance);
    this.bestScore = bestResult.record.bestScore;
    this.isNewBest = bestResult.isNewBest;

    this.headingText = null;
    this.newBestText = null;
    this.statsText = null;
    this.restartButton = null;
    this.menuButton = null;
    this.canRestart = false;
  }

  create(): void {
    audioService.stopAll();
    this.cameras.main.setBackgroundColor(0xf5efe0);

    this.headingText = this.add
      .text(0, 0, 'GAME OVER', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '44px',
        color: '#2d4a3e',
        align: 'center',
      })
      .setOrigin(0.5);

    this.newBestText = this.add
      .text(0, 0, 'NEW BEST!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#d9480f',
        padding: { x: 14, y: 4 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(this.isNewBest);

    this.statsText = this.add
      .text(
        0,
        0,
        `Score: ${this.result.score}\nDistance: ${this.result.distance} m\nPersonal Best: ${this.bestScore}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          color: '#534b3b',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.restartButton = this.add
      .text(0, 0, 'Play Again', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#2d4a3e',
        padding: { x: 24, y: 11 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.menuButton = this.add
      .text(0, 0, 'Main Menu', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '16px',
        color: '#2d4a3e',
        backgroundColor: '#e8dfc8',
        padding: { x: 18, y: 8 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.updateLayout(this.scale.width, this.scale.height);
    attachResponsiveResize(this, (width, height) => {
      this.updateLayout(width, height);
    });

    const unlockTimer = this.time.delayedCall(250, () => {
      this.canRestart = true;
    });

    const restartRun = () => {
      if (!this.canRestart) {
        return;
      }
      audioService.unlock();
      this.scene.start('Game');
    };

    const goToMenu = (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (!this.canRestart) {
        return;
      }
      this.scene.start('MainMenu');
    };

    this.restartButton.on('pointerdown', restartRun);
    this.menuButton.on('pointerdown', goToMenu);

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
      this.menuButton?.off('pointerdown', goToMenu);
      if (keyboard) {
        keyboard.off('keydown', handleKeyDown);
      }
    });
  }

  private updateLayout(width: number, height: number): void {
    this.cameras.resize(width, height);

    const scaleFactor = Math.max(0.65, Math.min(1.18, Math.min(width, height) / 540));

    if (this.headingText) {
      this.headingText.setPosition(width / 2, height * 0.22);
      this.headingText.setScale(scaleFactor);
    }

    if (this.newBestText) {
      this.newBestText.setPosition(width / 2, height * 0.33);
      this.newBestText.setScale(scaleFactor);
    }

    if (this.statsText) {
      this.statsText.setPosition(width / 2, height * 0.48);
      this.statsText.setScale(scaleFactor);
    }

    if (this.restartButton) {
      this.restartButton.setPosition(width / 2, height * 0.67);
      this.restartButton.setScale(scaleFactor);
    }

    if (this.menuButton) {
      this.menuButton.setPosition(width / 2, height * 0.78);
      this.menuButton.setScale(scaleFactor);
    }
  }
}
