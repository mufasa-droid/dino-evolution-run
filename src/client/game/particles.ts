export type ParticleSlot = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
};

export type ParticlePool = {
  readonly slots: ParticleSlot[];
};

export function createParticlePool(capacity = 32): ParticlePool {
  const slots: ParticleSlot[] = [];
  for (let i = 0; i < capacity; i += 1) {
    slots.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.3,
      size: 4,
      color: 0xffffff,
    });
  }
  return { slots };
}

export function emitParticleBurst(
  pool: ParticlePool,
  x: number,
  y: number,
  count: number,
  color: number,
  size = 4,
  life = 0.28,
  rng: () => number = Math.random,
): void {
  let spawned = 0;
  for (const slot of pool.slots) {
    if (spawned >= count) {
      break;
    }
    if (slot.active) {
      continue;
    }
    const angle = -Math.PI * rng();
    const speed = 45 + rng() * 115;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = Math.cos(angle) * speed;
    slot.vy = Math.sin(angle) * speed - 25;
    slot.life = life;
    slot.maxLife = life;
    slot.size = size;
    slot.color = color;
    spawned += 1;
  }
}

export function stepParticlePool(pool: ParticlePool, dtSeconds: number): void {
  if (dtSeconds <= 0) {
    return;
  }
  const dt = Math.min(dtSeconds, 0.05);
  for (const slot of pool.slots) {
    if (!slot.active) {
      continue;
    }
    slot.vy += 420 * dt;
    slot.x += slot.vx * dt;
    slot.y += slot.vy * dt;
    slot.life -= dt;
    if (slot.life <= 0) {
      slot.active = false;
      slot.life = 0;
    }
  }
}

export function clearParticlePool(pool: ParticlePool): void {
  for (const slot of pool.slots) {
    slot.active = false;
    slot.life = 0;
  }
}
