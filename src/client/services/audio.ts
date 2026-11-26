import {
  getStoredMutePreference,
  setStoredMutePreference,
  type StorageBackend,
} from './storage.ts';

export type AudioParamLike = {
  setValueAtTime(value: number, startTime: number): unknown;
  exponentialRampToValueAtTime(value: number, endTime: number): unknown;
};

export type OscillatorLike = {
  type: OscillatorType;
  readonly frequency: AudioParamLike;
  connect(destination: unknown): unknown;
  start(when?: number): void;
  stop(when?: number): void;
};

export type GainLike = {
  readonly gain: AudioParamLike;
  connect(destination: unknown): unknown;
};

export type AudioContextLike = {
  readonly state: AudioContextState;
  readonly currentTime: number;
  readonly destination: unknown;
  resume(): Promise<void>;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
};

export type AudioContextFactory = () => AudioContextLike | null;

function defaultAudioContextFactory(): AudioContextLike | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const ctor = window.AudioContext;
  if (typeof ctor !== 'function') {
    return null;
  }
  try {
    return new ctor();
  } catch {
    return null;
  }
}

export class AudioService {
  private ctx: AudioContextLike | null = null;
  private muted: boolean;
  private bgmEnabled = false;
  private bgmIntervalId: ReturnType<typeof setInterval> | null = null;
  private bgmStep = 0;
  private readonly storage: StorageBackend | null | undefined;
  private readonly contextFactory: AudioContextFactory;

  constructor(
    storage?: StorageBackend | null,
    contextFactory: AudioContextFactory = defaultAudioContextFactory,
  ) {
    this.storage = storage;
    this.muted = getStoredMutePreference(this.storage);
    this.contextFactory = contextFactory;
  }

  private ensureContext(): AudioContextLike | null {
    if (!this.ctx) {
      this.ctx = this.contextFactory();
    }
    return this.ctx;
  }

  /**
   * Unlocks/resumes the shared AudioContext on user gesture. Never throws.
   */
  unlock(): void {
    try {
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume().catch(() => undefined);
      }
    } catch {
      // Audio failure must never interrupt gameplay
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    setStoredMutePreference(muted, this.storage);
    if (muted) {
      this.stopBgm();
    } else if (this.bgmEnabled) {
      this.startBgm();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  isBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  setBgmEnabled(enabled: boolean): void {
    this.bgmEnabled = enabled;
    if (enabled && !this.muted) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  startBgm(): void {
    if (this.muted || !this.bgmEnabled || this.bgmIntervalId !== null) {
      return;
    }
    this.unlock();
    this.bgmStep = 0;
    this.bgmIntervalId = setInterval(() => {
      if (this.muted || !this.bgmEnabled) {
        return;
      }
      const notes = [196, 220, 261.6, 220];
      const freq = notes[this.bgmStep % notes.length] ?? 196;
      this.bgmStep += 1;
      this.playTone(freq, freq, 0.08, 0.025, 'triangle');
    }, 320);
  }

  stopBgm(): void {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  stopAll(): void {
    this.stopBgm();
  }

  playJump(): void {
    this.playTone(260, 520, 0.1, 0.18, 'square');
  }

  playLand(): void {
    this.playTone(130, 75, 0.06, 0.14, 'triangle');
  }

  playTransform(): void {
    this.playTone(330, 660, 0.16, 0.2, 'triangle');
  }

  playWarningTick(): void {
    this.playTone(580, 440, 0.07, 0.14, 'sine');
  }

  playAbility(): void {
    this.playTone(220, 440, 0.12, 0.18, 'sawtooth');
  }

  playSmash(): void {
    this.playTone(180, 65, 0.14, 0.22, 'square');
  }

  playArmourBlock(): void {
    this.playTone(520, 320, 0.14, 0.2, 'triangle');
  }

  playGameOver(): void {
    this.stopAll();
    this.playTone(240, 90, 0.26, 0.22, 'sawtooth');
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    durationSeconds: number,
    volume: number,
    type: OscillatorType,
  ): void {
    if (this.muted) {
      return;
    }
    try {
      const ctx = this.ensureContext();
      if (!ctx || ctx.state === 'closed') {
        return;
      }
      if (ctx.state === 'suspended') {
        void ctx
          .resume()
          .then(() => {
            if (!this.muted && ctx.state === 'running') {
              this.scheduleOscillator(
                ctx,
                startFreq,
                endFreq,
                durationSeconds,
                volume,
                type,
              );
            }
          })
          .catch(() => undefined);
        return;
      }

      this.scheduleOscillator(
        ctx,
        startFreq,
        endFreq,
        durationSeconds,
        volume,
        type,
      );
    } catch {
      // Never allow audio failures to interrupt gameplay
    }
  }

  private scheduleOscillator(
    ctx: AudioContextLike,
    startFreq: number,
    endFreq: number,
    durationSeconds: number,
    volume: number,
    type: OscillatorType,
  ): void {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      if (endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, endFreq),
          now + durationSeconds,
        );
      }

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSeconds + 0.01);
    } catch {
      // Never allow audio failures to interrupt gameplay
    }
  }
}

export const audioService = new AudioService();
