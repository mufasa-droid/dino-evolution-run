import * as Phaser from 'phaser';

/**
 * Registers a Phaser scale 'resize' listener and automatically removes it
 * when the scene shuts down to prevent listener leaks across restarts.
 */
export function attachResponsiveResize(
  scene: Phaser.Scene,
  onResize: (width: number, height: number) => void,
): void {
  const handleResize = (gameSize: Phaser.Structs.Size) => {
    onResize(gameSize.width, gameSize.height);
  };

  scene.scale.on('resize', handleResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off('resize', handleResize);
  });
}
