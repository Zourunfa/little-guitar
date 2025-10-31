/**
 * DrumKit 类的类型定义
 */
export interface IDrumKit {
  audioContext: AudioContext | null;
  isInitialized: boolean;
  
  init(): void;
  playKick(time?: number, volume?: number): void;
  playSnare(time?: number, volume?: number): void;
  playHiHat(time?: number, volume?: number): void;
  playBluesShuffle(beatNumber: number, volume?: number): void;
  playStandardBeat(beatNumber: number, volume?: number): void;
  playSlowBlues(beatNumber: number, volume?: number): void;
  dispose(): void;
}

/**
 * Accompaniment 类的类型定义
 */
export interface IAccompaniment {
  audioContext: AudioContext | null;
  isInitialized: boolean;
  
  init(): void;
  getNoteFrequency(note: string, octave?: number): number;
  playHarmonica(note: string, octave?: number, duration?: number, volume?: number): void;
  playGuitar(note: string, octave?: number, duration?: number, volume?: number, isMuted?: boolean): void;
  playHarmonicaBluesRiff(rootNote: string, volume?: number): void;
  playGuitarBluesRhythm(rootNote: string, beatNumber: number, volume?: number, customPattern?: string): void;
  playBassWalkingPattern(chord: string, beatNumber: number, volume?: number, pattern?: string): void;
  dispose(): void;
}

/**
 * CloudBase 配置类型
 */
export interface ICloudBase {
  app: any;
  auth: any;
  db: any;
  storage: any;
  
  init(): void;
  ensureLogin(): Promise<void>;
  getLoginState(): Promise<any>;
  signInAnonymously(): Promise<any>;
}
