/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RUNNER_CONFIG } from './constants.ts';
import { OBSTACLE_CATALOG } from './obstacles.ts';
import {
  applySpeciesToPlayer,
  createRunnerState,
  stepRunnerSimulation,
} from './simulation.ts';
import { ALTERNATIVE_SPECIES, DINOSAUR_SPECS } from './species.ts';
import type { ObstacleTypeId } from './types.ts';

function fixedRng(value: number): () => number {
  return () => value;
}

function createObstacleFromCatalog(
  id: number,
  typeId: ObstacleTypeId,
  x: number,
) {
  const def = OBSTACLE_CATALOG[typeId];
  return {
    id,
    typeId: def.typeId,
    kind: def.kind,
    x,
    y: DEFAULT_RUNNER_CONFIG.groundY - def.elevationAboveGround,
    width: def.width,
    height: def.height,
    destructible: def.destructible,
    speedOffset: def.speedOffset,
  };
}

void describe('Phase 4–5 Runner Simulation', () => {
  void it('starts with T-Rex grounded, zero score, and no obstacles', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    assert.equal(state.status, 'running');
    assert.equal(state.player.species, 'trex');
    assert.equal(state.player.isGrounded, true);
    assert.equal(state.player.isFallingInGap, false);
    assert.equal(state.player.y, DEFAULT_RUNNER_CONFIG.groundY);
    assert.equal(state.score, 0);
    assert.equal(state.distance, 0);
    assert.equal(state.obstacles.length, 0);
  });

  void it('jumps when grounded and prevents infinite mid-air jumping', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);

    const first = stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(first.jumped, true);
    assert.equal(state.player.isGrounded, false);

    const vyBefore = state.player.vy;
    const second = stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(second.jumped, false);
    assert.ok(state.player.vy > vyBefore);

    for (let i = 0; i < 60; i += 1) {
      stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.02,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      if (state.player.isGrounded) {
        break;
      }
    }
    assert.equal(state.player.isGrounded, true);
    assert.equal(state.player.y, DEFAULT_RUNNER_CONFIG.groundY);
  });

  void it('handles collision accurately using explicit hitboxes for all four species', () => {
    for (const species of ['trex', ...ALTERNATIVE_SPECIES] as const) {
      const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
      applySpeciesToPlayer(state.player, species);
      const spec = DINOSAUR_SPECS[species];

      assert.equal(state.player.hitboxWidth, spec.hitboxWidth);
      assert.equal(state.player.hitboxHeight, spec.hitboxHeight);

      state.obstacles.push(
        createObstacleFromCatalog(1, 'rock_solid', state.player.x + spec.hitboxOffsetX + 4),
      );
      const events = stepRunnerSimulation(
        state,
        { jumpPressed: false },
        0.016,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      assert.equal(events.collided, true);
      assert.equal(state.status, 'gameover');
    }
  });

  void it('allows grounded run under low_branch and bird_high, and collides on jump', () => {
    for (const overheadType of ['low_branch', 'bird_high'] as const) {
      const safeState = createRunnerState(DEFAULT_RUNNER_CONFIG);
      safeState.obstacles.push(
        createObstacleFromCatalog(1, overheadType, safeState.player.x + 4),
      );
      const safeEvents = stepRunnerSimulation(
        safeState,
        { jumpPressed: false },
        0.016,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      assert.equal(safeEvents.collided, false);

      const jumpState = createRunnerState(DEFAULT_RUNNER_CONFIG);
      jumpState.obstacles.push(
        createObstacleFromCatalog(2, overheadType, jumpState.player.x + 4),
      );
      let collided = false;
      for (let i = 0; i < 10; i += 1) {
        const res = stepRunnerSimulation(
          jumpState,
          { jumpPressed: i === 0 },
          0.02,
          DEFAULT_RUNNER_CONFIG,
          fixedRng(0.5),
        );
        if (res.collided) {
          collided = true;
          break;
        }
      }
      assert.equal(collided, true);
    }
  });

  void it('preserves feet Y, velocity, and grounding across grounded and airborne transformations', () => {
    // 1. Grounded transformation
    const groundedState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    groundedState.orbs.push({
      id: 1,
      x: groundedState.player.x + 8,
      y: DEFAULT_RUNNER_CONFIG.groundY - 10,
      width: 28,
      height: 28,
    });
    const groundedRes = stepRunnerSimulation(
      groundedState,
      { jumpPressed: false },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0),
    );
    assert.equal(groundedRes.orbCollected, true);
    assert.notEqual(groundedState.player.species, 'trex');
    assert.equal(groundedState.player.y, DEFAULT_RUNNER_CONFIG.groundY);
    assert.equal(groundedState.player.vy, 0);
    assert.equal(groundedState.player.isGrounded, true);

    // 2. Airborne transformation during a jump
    const airState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    stepRunnerSimulation(
      airState,
      { jumpPressed: true },
      0.05,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    const yBefore = airState.player.y;
    const vyBefore = airState.player.vy;
    assert.equal(airState.player.isGrounded, false);

    airState.orbs.push({
      id: 2,
      x: airState.player.x + 4,
      y: yBefore,
      width: 28,
      height: 28,
    });
    const airRes = stepRunnerSimulation(
      airState,
      { jumpPressed: false },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(airRes.orbCollected, true);
    assert.equal(airState.player.isGrounded, false);
    // Velocity only changed by normal gravity * dt (no jump reset or snap)
    assert.ok(
      Math.abs(airState.player.vy - (vyBefore + DEFAULT_RUNNER_CONFIG.gravity * 0.016)) < 1,
    );
  });

  void it('reverts cleanly to T-Rex hitbox when transformation expires while airborne', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    state.orbs.push({
      id: 1,
      x: state.player.x + 4,
      y: DEFAULT_RUNNER_CONFIG.groundY - 10,
      width: 28,
      height: 28,
    });
    stepRunnerSimulation(
      state,
      { jumpPressed: false },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0),
    );

    // Advance near expiration (remaining = 0.02s), then jump so expiration occurs mid-air
    state.transformation.remainingSeconds = 0.02;
    const jumpEvents = stepRunnerSimulation(
      state,
      { jumpPressed: true },
      0.03,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );

    assert.equal(jumpEvents.jumped, true);
    assert.equal(jumpEvents.transformationExpired, true);
    assert.equal(state.player.species, 'trex');
    assert.equal(state.player.hitboxWidth, DINOSAUR_SPECS.trex.hitboxWidth);
    assert.equal(state.player.isGrounded, false);
  });

  void it('causes player to fall into a ground gap if not jumped, and clears gap when jumped', () => {
    const fallState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    fallState.obstacles.push(
      createObstacleFromCatalog(1, 'ground_gap_wide', fallState.player.x - 10),
    );
    let fell = false;
    for (let i = 0; i < 40; i += 1) {
      const res = stepRunnerSimulation(
        fallState,
        { jumpPressed: false },
        0.02,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
      if (res.collided) {
        fell = true;
        break;
      }
    }
    assert.equal(fell, true);
    assert.equal(fallState.status, 'gameover');

    const clearState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    clearState.obstacles.push(
      createObstacleFromCatalog(2, 'ground_gap_wide', clearState.player.x + 40),
    );
    for (let i = 0; i < 50; i += 1) {
      stepRunnerSimulation(
        clearState,
        { jumpPressed: i === 0 },
        0.02,
        DEFAULT_RUNNER_CONFIG,
        fixedRng(0.5),
      );
    }
    assert.equal(clearState.status, 'running');
    assert.equal(clearState.player.isGrounded, true);
  });

  void it('does not spawn evolution orbs before orbUnlockDistanceMeters and spaces subsequent orbs', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    state.distance = DEFAULT_RUNNER_CONFIG.orbUnlockDistanceMeters - 5;
    state.distanceToNextOrb = 0;

    // Before 400m: orb must not spawn even when distanceToNextOrb <= 0
    stepRunnerSimulation(
      state,
      { jumpPressed: false },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0.5),
    );
    assert.equal(state.orbs.length, 0);

    // Past 400m with clear corridor: orb spawns and schedules >= minOrbSpawnDistance
    state.distance = DEFAULT_RUNNER_CONFIG.orbUnlockDistanceMeters + 1;
    state.obstacles = [];
    state.distanceToNextOrb = 0;
    stepRunnerSimulation(
      state,
      { jumpPressed: false },
      0.016,
      DEFAULT_RUNNER_CONFIG,
      fixedRng(0),
    );
    assert.equal(state.orbs.length, 1);
    assert.ok(state.distanceToNextOrb >= DEFAULT_RUNNER_CONFIG.minOrbSpawnDistance);
  });

  void it('activates Pterodactyl glide only while airborne and holding Jump, and restores falling on release', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    applySpeciesToPlayer(state.player, 'pterodactyl');

    // Jump up, then advance past apex into descent
    stepRunnerSimulation(state, { jumpPressed: true, jumpHeld: true }, 0.02);
    for (let i = 0; i < 20; i += 1) {
      stepRunnerSimulation(state, { jumpPressed: false, jumpHeld: false }, 0.02);
      if (state.player.vy > 0) {
        break;
      }
    }
    assert.ok(state.player.vy > 0);
    assert.equal(state.abilities.isGliding, false);

    // Holding Jump while descending activates glide and caps fall speed / holds glide altitude
    stepRunnerSimulation(state, { jumpPressed: false, jumpHeld: true }, 0.02);
    assert.equal(state.abilities.isGliding, true);
    assert.ok(
      state.player.vy <= DEFAULT_RUNNER_CONFIG.abilities.pterodactylGlideMaxFallSpeed,
    );

    // Releasing Jump restores normal falling gravity
    const vyGliding = state.player.vy;
    stepRunnerSimulation(state, { jumpPressed: false, jumpHeld: false }, 0.03);
    assert.equal(state.abilities.isGliding, false);
    assert.ok(state.player.vy > vyGliding);
  });

  void it('checks Pterodactyl glide collisions: clears low rocks/gaps, hits aerial birds/tall cacti/branches', () => {
    const glideY =
      DEFAULT_RUNNER_CONFIG.groundY -
      DEFAULT_RUNNER_CONFIG.abilities.pterodactylGlideElevation;

    // Clears small cactus / solid rock / gap at glide altitude
    for (const safeType of ['cactus_small', 'rock_solid', 'ground_gap_small'] as const) {
      const s = createRunnerState(DEFAULT_RUNNER_CONFIG);
      applySpeciesToPlayer(s.player, 'pterodactyl');
      s.player.isGrounded = false;
      s.player.y = glideY;
      s.player.vy = 0;
      s.obstacles.push(createObstacleFromCatalog(1, safeType, s.player.x + 8));

      const res = stepRunnerSimulation(s, { jumpPressed: false, jumpHeld: true }, 0.016);
      assert.equal(res.collided, false, `Expected Pterodactyl glide to clear ${safeType}`);
    }

    // Collides with aerial/tall hazards during glide
    for (const lethalType of ['bird_low', 'bird_high', 'low_branch', 'cactus_tall'] as const) {
      const s = createRunnerState(DEFAULT_RUNNER_CONFIG);
      applySpeciesToPlayer(s.player, 'pterodactyl');
      s.player.isGrounded = false;
      s.player.y = glideY;
      s.player.vy = 0;
      s.obstacles.push(createObstacleFromCatalog(2, lethalType, s.player.x + 12));

      const res = stepRunnerSimulation(s, { jumpPressed: false, jumpHeld: true }, 0.016);
      assert.equal(res.collided, true, `Expected Pterodactyl glide to hit ${lethalType}`);
    }
  });

  void it('allows Triceratops to jump while charging, caps charge speed, and destroys only destructible obstacles', () => {
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    applySpeciesToPlayer(state.player, 'triceratops');
    state.obstacles.push(
      createObstacleFromCatalog(10, 'rock_breakable', state.player.x + 12),
    );

    const res = stepRunnerSimulation(
      state,
      { jumpPressed: true, abilityPressed: true },
      0.016,
    );
    assert.equal(res.abilityActivated, 'charge');
    assert.equal(res.jumped, true);
    assert.equal(res.obstacleDestroyed, true);
    assert.equal(res.collided, false);
    assert.equal(state.obstacles.length, 0);
    assert.ok(state.speed <= DEFAULT_RUNNER_CONFIG.abilities.triceratopsChargeMaxSpeed);

    // Solid obstacles remain lethal even while charging
    for (const solidType of ['rock_solid', 'cactus_small', 'bird_low'] as const) {
      const s = createRunnerState(DEFAULT_RUNNER_CONFIG);
      applySpeciesToPlayer(s.player, 'triceratops');
      s.abilities.chargeActive = true;
      s.abilities.chargeRemainingSeconds = 1.0;
      s.obstacles.push(createObstacleFromCatalog(20, solidType, s.player.x + 12));
      const hit = stepRunnerSimulation(s, { jumpPressed: false }, 0.016);
      assert.equal(hit.collided, true, `Expected charge not to destroy ${solidType}`);
    }
  });

  void it('allows Ankylosaurus armour activation grounded and airborne, absorbs 1 hit, and clears abilities on expiration/gameover/restart', () => {
    // Grounded activation + 1-hit absorption + invulnerability
    const state = createRunnerState(DEFAULT_RUNNER_CONFIG);
    applySpeciesToPlayer(state.player, 'ankylosaurus');
    state.obstacles.push(
      createObstacleFromCatalog(30, 'cactus_small', state.player.x + 12),
    );

    const hitRes = stepRunnerSimulation(
      state,
      { jumpPressed: false, abilityPressed: true },
      0.016,
    );
    assert.equal(hitRes.abilityActivated, 'armour');
    assert.equal(hitRes.armourBlocked, true);
    assert.equal(hitRes.collided, false);
    assert.equal(state.abilities.armourActive, false);

    // Same obstacle during invulnerability does not cause collision
    const followRes = stepRunnerSimulation(state, { jumpPressed: false }, 0.016);
    assert.equal(followRes.collided, false);
    assert.equal(followRes.armourBlocked, false);

    // Airborne activation + transformation expiration cancels active abilities
    const airState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    applySpeciesToPlayer(airState.player, 'ankylosaurus');
    airState.transformation.activeSpecies = 'ankylosaurus';
    airState.transformation.remainingSeconds = 0.01;
    stepRunnerSimulation(airState, { jumpPressed: true }, 0.005);
    assert.equal(airState.player.isGrounded, false);

    const expireRes = stepRunnerSimulation(
      airState,
      { jumpPressed: false, abilityPressed: true },
      0.02,
    );
    assert.equal(expireRes.transformationExpired, true);
    assert.equal(airState.player.species, 'trex');
    assert.equal(airState.abilities.armourActive, false);
    assert.equal(airState.abilities.armourCooldownRemainingSeconds, 0);

    // Game over interrupts active abilities, and restart has clean state
    const goState = createRunnerState(DEFAULT_RUNNER_CONFIG);
    applySpeciesToPlayer(goState.player, 'triceratops');
    stepRunnerSimulation(goState, { jumpPressed: false, abilityPressed: true }, 0.016);
    goState.obstacles.push(
      createObstacleFromCatalog(40, 'cactus_tall', goState.player.x + 12),
    );
    const goRes = stepRunnerSimulation(goState, { jumpPressed: false }, 0.016);
    assert.equal(goRes.collided, true);
    assert.equal(goState.abilities.chargeActive, false);
    assert.equal(goState.abilities.chargeCooldownRemainingSeconds, 0);

    const restarted = createRunnerState(DEFAULT_RUNNER_CONFIG);
    assert.equal(restarted.abilities.chargeActive, false);
    assert.equal(restarted.abilities.armourActive, false);
    assert.equal(restarted.abilities.isGliding, false);
  });
});
