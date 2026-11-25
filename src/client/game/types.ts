export type CactusVariant = 'small' | 'tall' | 'cluster';

export type RunnerConfig = {
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly groundY: number;
  readonly trexX: number;
  readonly trexWidth: number;
  readonly trexHeight: number;
  readonly jumpVelocity: number;
  readonly gravity: number;
  readonly baseSpeed: number;
  readonly pixelsPerMeter: number;
  readonly scorePerMeter: number;
  readonly minSpawnInterval: number;
  readonly maxSpawnInterval: number;
  readonly maxDeltaSeconds: number;
  readonly hitboxPaddingX: number;
  readonly hitboxPaddingY: number;
};

export type TRexState = {
  readonly x: number;
  y: number;
  vy: number;
  readonly width: number;
  readonly height: number;
  isGrounded: boolean;
};

export type CactusObstacle = {
  readonly id: number;
  readonly variant: CactusVariant;
  x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type RunnerState = {
  status: 'running' | 'gameover';
  trex: TRexState;
  obstacles: CactusObstacle[];
  nextObstacleId: number;
  spawnTimer: number;
  speed: number;
  distance: number;
  score: number;
  groundOffset: number;
};

export type RunnerInput = {
  readonly jumpPressed: boolean;
};

export type RunnerStepEvents = {
  readonly jumped: boolean;
  readonly collided: boolean;
};

export type GameOverData = {
  readonly score: number;
  readonly distance: number;
};
