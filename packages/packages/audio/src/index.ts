// 音频处理工具函数
import * as Pitchy from 'pitchy';

export interface TunerResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  isDetected: boolean;
}

export class AudioTuner {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 32768;
      source.connect(this.analyser);
    } catch (error) {
      console.error('Failed to initialize audio tuner:', error);
      throw error;
    }
  }

  detectPitch(): TunerResult | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(buffer);

    try {
      const [frequency, clarity] = Pitchy.findPitch(buffer, this.audioContext!.sampleRate);

      if (frequency === 0 || clarity < 0.5) {
        return null;
      }

      return this.frequencyToNote(frequency);
    } catch (error) {
      console.error('Pitch detection error:', error);
      return null;
    }
  }

  private frequencyToNote(frequency: number): TunerResult {
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const halfStepsFromA4 = 12 * Math.log2(frequency / A4);
    const halfStepsFromC0 = halfStepsFromA4 + 57;

    const octave = Math.floor(halfStepsFromC0 / 12);
    const noteIndex = Math.round(halfStepsFromC0 % 12);

    const noteFrequency = A4 * Math.pow(2, (noteIndex - 9 + (octave - 4) * 12) / 12);
    const cents = Math.round(1200 * Math.log2(frequency / noteFrequency));

    return {
      frequency,
      note: noteNames[noteIndex],
      octave,
      cents,
      isDetected: true
    };
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

// 鼓音生成器
export class DrumKit {
  private audioContext: AudioContext | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  playKick(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  playSnare(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const noiseBuffer = this.createNoiseBuffer();
    const noiseSource = this.audioContext.createBufferSource();

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    noiseSource.buffer = noiseBuffer;

    oscillator.connect(gainNode);
    noiseSource.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    noiseSource.start(this.audioContext.currentTime);

    oscillator.stop(this.audioContext.currentTime + 0.2);
    noiseSource.stop(this.audioContext.currentTime + 0.2);
  }

  playHiHat(): void {
    if (!this.audioContext) return;

    const noiseBuffer = this.createNoiseBuffer();
    const noiseSource = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    noiseSource.buffer = noiseBuffer;
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    noiseSource.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    noiseSource.start(this.audioContext.currentTime);
    noiseSource.stop(this.audioContext.currentTime + 0.05);
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.audioContext!.sampleRate * 0.1;
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate);

    for (let i = 0; i < bufferSize; i++) {
      buffer.getChannelData(0)[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }
}

// 导出类和类型
export { AudioTuner, DrumKit };
export type { TunerResult };