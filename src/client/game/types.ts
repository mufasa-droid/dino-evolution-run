export type ObstacleKind = 'cactus' | 'rock' | 'bird' | 'branch' | 'gap';

export type ObstacleTypeId =
  | 'cactus_small'
  | 'cactus_tall'
  | 'cactus_cluster'
  | 'rock_solid'
  | 'rock_breakable'
  | 'bird_low'
  | 'bird_high'
  | 'low_branch'
  | 'ground_gap_small'
  | 'ground_gap_wide';

export type ObstacleConfig = {
  readonly typeId: ObstacleTypeId;
  readonly kind: ObstacleKind;
  readonly width: number;
  readonly height: number;
  /** Distance from GROUND_Y upward to the bottom of the obstacle (0 = resting on ground). */
  readonly elevationAboveGround: number;
  readonly destructible: boolean;
  /** Additional leftward speed in logical units/sec (e.g. for flying birds). */
  readonly speedOffset: number;
};

export type Obstacle = {
  readonly id: number;
  readonly typeId: ObstacleTypeId;
  readonly kind: ObstacleKind;
  x: number;
  /** Bottom Y coordinate in logical world space (GROUND_Y - elevationAboveGround). */
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly destructible: boolean;
  readonly speedOffset: number;
};

export type PatternItem = {
  readonly typeId: ObstacleTypeId;
  /** Horizontal offset from the pattern's start X. */
  readonly offsetX: number;
};

export type SpawnPattern = {
  readonly id: string;
  readonly minDifficulty: number;
  readonly weight: number;
  readonly items: readonly PatternItem[];
};

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
  readonly maxSpeed: number;
  readonly difficultyDistanceForMax: number;
  readonly pixelsPerMeter: number;
  readonly scorePerMeter: number;
  readonly minSpawnGapMultiplier: number;
  readonly maxSpawnGapMultiplier: number;
  readonly gapFallThreshold: number;
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
  isFallingInGap: boolean;
};

export type RunnerState = {
  status: 'running' | 'gameover';
  trex: TRexState;
  obstacles: Obstacle[];
  nextObstacleId: number;
  distanceToNextSpawn: number;
  speed: number;
  difficulty: number;
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
