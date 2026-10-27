import { PitchDetector } from 'pitchy';

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const TUNINGS = {
  standard: { label: '标准调弦', midi: [40, 45, 50, 55, 59, 64] },
  dropD: { label: 'Drop D', midi: [38, 45, 50, 55, 59, 64] },
  halfDown: { label: '降半音', midi: [39, 44, 49, 54, 58, 63] },
};
export type Tuning = keyof typeof TUNINGS;
export const midiFrequency = (midi: number, a4 = 440) => a4 * 2 ** ((midi - 69) / 12);
export const frequencyMidi = (frequency: number, a4 = 440) => 69 + 12 * Math.log2(frequency / a4);
export const noteName = (midi: number) => `${NOTE_NAMES[((Math.round(midi) % 12) + 12) % 12]}${Math.floor(Math.round(midi) / 12) - 1}`;
export const centsBetween = (frequency: number, target: number) => 1200 * Math.log2(frequency / target);
export function closestString(frequency: number, tuning: Tuning, a4: number) {
  const notes = TUNINGS[tuning].midi;
  return notes.reduce((best, midi, index) => Math.abs(centsBetween(frequency, midiFrequency(midi, a4))) < Math.abs(centsBetween(frequency, midiFrequency(notes[best], a4))) ? index : best, 0);
}

/** Time-domain MPM avoids choosing the loudest FFT bin (often a guitar harmonic). */
export class GuitarPitchDetector {
  private detector: PitchDetector<Float32Array>;
  private recent: number[] = [];
  constructor(size = 4096) {
    this.detector = PitchDetector.forFloat32Array(size);
    this.detector.clarityThreshold = 0.9;
    this.detector.minVolumeAbsolute = 0.003;
  }
  reset() { this.recent = []; }
  detect(samples: Float32Array, sampleRate: number) {
    // Remove DC offset, which can otherwise make a quiet microphone look loud.
    let mean = 0;
    for (const value of samples) mean += value;
    mean /= samples.length;
    let power = 0;
    for (let i = 0; i < samples.length; i++) {
      samples[i] -= mean;
      power += samples[i] ** 2;
    }
    const rms = Math.sqrt(power / samples.length);
    const [pitch, clarity] = this.detector.findPitch(samples, sampleRate);
    if (rms < 0.003 || clarity < 0.9 || !Number.isFinite(pitch) || pitch < 60 || pitch > 1100) {
      this.reset();
      return { frequency: null, rms, clarity };
    }
    if (this.recent.length && Math.abs(centsBetween(pitch, this.recent[this.recent.length - 1])) > 70) this.reset();
    this.recent.push(pitch);
    if (this.recent.length > 5) this.recent.shift();
    const sorted = [...this.recent].sort((a, b) => a - b);
    return { frequency: this.recent.length >= 3 ? sorted[Math.floor(sorted.length / 2)] : null, rms, clarity };
  }
}
