// teoria 类型声明
declare module 'teoria' {
  export interface Note {
    name(): string;
    octave(): number;
    fq(): number;
    transpose(semitones: number): Note;
    intervalTo(note: Note): Interval;
    chord(type?: string): Chord;
    scale(type?: string): Scale;
  }

  export interface Chord {
    name(): string;
    notes(): Note[];
  }

  export interface Scale {
    notes(): Note[];
    simple(): string[];
  }

  export interface Interval {
    name(): string;
  }

  export function note(note: string): Note;
}