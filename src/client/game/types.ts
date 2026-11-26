export type EnvironmentId = 'desert' | 'grasslands' | 'jungle' | 'volcanic';

export type EnvironmentPalette = {
  readonly skyColor: number;
  readonly farParallaxColor: number;
  readonly midParallaxColor: number;
  readonly groundTintColor: number;
  readonly groundLineColor: number;
};

export type EnvironmentConfig = {
  readonly id: EnvironmentId;
  readonly displayName: string;
  readonly minDistanceMeters: number;
  readonly palette: EnvironmentPalette;
  readonly patternWeightMultipliers: Readonly<Record<string, number>>;
};

export type DinosaurSpecies =
  | 'trex'
  | 'pterodactyl'
  | 'triceratops'
  | 'ankylosaurus';

export type AlternativeSpecies = Exclude<DinosaurSpecies, 'trex'>;

export type SpeciesMovementConfig = {
  readonly jumpVelocityMultiplier: number;
  readonly gravityMultiplier: number;
  readonly speedMultiplier: number;
};

export type DinosaurSpec = {
  readonly species: DinosaurSpecies;
  readonly displayName: string;
  readonly visualWidth: number;
  readonly visualHeight: number;
  /** Collision box dimensions, independent of sprite visual size. */
  readonly hitboxWidth: number;
  readonly hitboxHeight: number;
  /** Horizontal offset from player x to collision box left edge. */
  readonly hitboxOffsetX: number;
  /** Upward offset from feet Y (GROUND_Y / player.y) to collision box bottom edge. */
  readonly hitboxOffsetY: number;
  readonly movement: SpeciesMovementConfig;
};

export type AbilityKind = 'charge' | 'armour';

export type AbilityConfig = {
  readonly trexLandingDurationSeconds: number;
  readonly pterodactylGlideMaxFallSpeed: number;
  readonly pterodactylGlideElevation: number;
  readonly triceratopsChargeDurationSeconds: number;
  readonly triceratopsChargeCooldownSeconds: number;
  readonly triceratopsChargeSpeedMultiplier: number;
  readonly triceratopsChargeMaxSpeed: number;
  readonly ankylosaurusArmourDurationSeconds: number;
  readonly ankylosaurusArmourCooldownSeconds: number;
  readonly ankylosaurusInvulnerabilitySeconds: number;
};

export type AbilityState = {
  landingTimer: number;
  isGliding: boolean;
  chargeActive: boolean;
  chargeRemainingSeconds: number;
  chargeCooldownRemainingSeconds: number;
  armourActive: boolean;
  armourRemainingSeconds: number;
  armourCooldownRemainingSeconds: number;
  invulnerabilityRemainingSeconds: number;
  blockedObstacleIds: number[];
};

export type EvolutionOrb = {
  readonly id: number;
  x: number;
  /** Bottom Y coordinate in logical world space. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type TransformationState = {
  activeSpecies: DinosaurSpecies;
  lastAlternativeSpecies: AlternativeSpecies | null;
  remainingSeconds: number;
  durationSeconds: number;
  warningSeconds: number;
  warningActive: boolean;
  warningEmitted: boolean;
  expiredEmitted: boolean;
  elapsedSinceTransform: number;
};

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
  readonly orbWidth: number;
  readonly orbHeight: number;
  readonly orbUnlockDistanceMeters: number;
  readonly minOrbSpawnDistance: number;
  readonly maxOrbSpawnDistance: number;
  readonly orbRetryDistance: number;
  readonly transformationDurationSeconds: number;
  readonly transformationWarningSeconds: number;
  readonly abilities: AbilityConfig;
};

export type PlayerState = {
  readonly x: number;
  /** Bottom (feet) Y coordinate in logical world space. Preserved across transformations. */
  y: number;
  vy: number;
  species: DinosaurSpecies;
  visualWidth: number;
  visualHeight: number;
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxOffsetX: number;
  hitboxOffsetY: number;
  isGrounded: boolean;
  isFallingInGap: boolean;
};

export type RunnerState = {
  status: 'running' | 'gameover';
  player: PlayerState;
  abilities: AbilityState;
  obstacles: Obstacle[];
  orbs: EvolutionOrb[];
  transformation: TransformationState;
  currentEnvironment: EnvironmentId;
  nextObstacleId: number;
  nextOrbId: number;
  distanceToNextSpawn: number;
  distanceToNextOrb: number;
  speed: number;
  difficulty: number;
  distance: number;
  score: number;
  groundOffset: number;
};

export type RunnerInput = {
  readonly jumpPressed: boolean;
  readonly jumpHeld?: boolean;
  readonly abilityPressed?: boolean;
};

export type RunnerStepEvents = {
  readonly jumped: boolean;
  readonly collided: boolean;
  readonly orbCollected: boolean;
  readonly transformedTo: DinosaurSpecies | null;
  readonly transformationWarning: boolean;
  readonly transformationExpired: boolean;
  readonly abilityActivated: AbilityKind | null;
  readonly obstacleDestroyed: boolean;
  readonly armourBlocked: boolean;
  readonly environmentChanged: EnvironmentId | null;
};

export type GameOverData = {
  readonly score: number;
  readonly distance: number;
};
