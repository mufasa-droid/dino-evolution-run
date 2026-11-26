export type StorageBackend = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type PersonalBestRecord = {
  readonly bestScore: number;
  readonly bestDistance: number;
  readonly updatedAt: number;
};

export type PersonalBestUpdateResult = {
  readonly record: PersonalBestRecord;
  readonly isNewBest: boolean;
};

const PERSONAL_BEST_KEY = 'dino_evo_personal_best_v1';
const MUTE_KEY = 'dino_evo_muted_v1';

function getBrowserLocalStorage(): StorageBackend | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function isPersonalBestRecord(value: unknown): value is PersonalBestRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const bestScore = Reflect.get(value, 'bestScore');
  const bestDistance = Reflect.get(value, 'bestDistance');
  const updatedAt = Reflect.get(value, 'updatedAt');
  return (
    typeof bestScore === 'number' &&
    Number.isFinite(bestScore) &&
    bestScore >= 0 &&
    typeof bestDistance === 'number' &&
    Number.isFinite(bestDistance) &&
    bestDistance >= 0 &&
    typeof updatedAt === 'number' &&
    Number.isFinite(updatedAt)
  );
}

export function getLocalBest(
  storage: StorageBackend | null = getBrowserLocalStorage(),
): PersonalBestRecord {
  const fallback: PersonalBestRecord = {
    bestScore: 0,
    bestDistance: 0,
    updatedAt: 0,
  };
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(PERSONAL_BEST_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed: unknown = JSON.parse(raw);
    return isPersonalBestRecord(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Updates local personal best only when the new score beats the stored bestScore.
 * Never overwrites a higher score with a lower score and never throws on storage errors.
 */
export function updateLocalBest(
  score: number,
  distance: number,
  storage: StorageBackend | null = getBrowserLocalStorage(),
  now: number = Date.now(),
): PersonalBestUpdateResult {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const safeDistance = Number.isFinite(distance)
    ? Math.max(0, Math.floor(distance))
    : 0;
  const current = getLocalBest(storage);

  if (safeScore <= current.bestScore) {
    return { record: current, isNewBest: false };
  }

  const next: PersonalBestRecord = {
    bestScore: safeScore,
    bestDistance: Math.max(current.bestDistance, safeDistance),
    updatedAt: now,
  };

  if (storage) {
    try {
      storage.setItem(PERSONAL_BEST_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota / sandboxed storage errors
    }
  }

  return { record: next, isNewBest: true };
}

export function getStoredMutePreference(
  storage: StorageBackend | null = getBrowserLocalStorage(),
): boolean {
  if (!storage) {
    return false;
  }
  try {
    return storage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredMutePreference(
  muted: boolean,
  storage: StorageBackend | null = getBrowserLocalStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(MUTE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}
