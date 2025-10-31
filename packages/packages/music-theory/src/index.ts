// 音乐理论工具函数
import * as teoria from 'teoria';
import type { Scale, Chord, FretboardPosition } from '@little-guitar/types';

export class MusicTheory {
  // 获取音阶
  static getScale(root: string, type: string): Scale {
    const scaleObj = teoria.note(root).scale(type);
    const notes = scaleObj.notes().map(note => ({
      name: note.name(),
      frequency: note.fq(),
      octave: note.octave()
    }));

    return {
      name: `${root} ${type}`,
      notes,
      type
    };
  }

  // 获取和弦
  static getChord(root: string, type: string): Chord {
    const chordObj = teoria.note(root).chord(type);
    const notes = chordObj.notes().map(note => ({
      name: note.name(),
      frequency: note.fq(),
      octave: note.octave()
    }));

    return {
      name: `${root}${type}`,
      notes,
      type
    };
  }

  // 计算吉他指板位置
  static getFretboardPositions(tuning: string[], scaleNotes: string[]): FretboardPosition[] {
    const positions: FretboardPosition[] = [];
    const stringCount = tuning.length;
    const fretCount = 24;

    for (let string = 0; string < stringCount; string++) {
      for (let fret = 0; fret <= fretCount; fret++) {
        const openNote = teoria.note(tuning[string]);
        const note = openNote.transpose(fret);
        const noteName = note.name();

        if (scaleNotes.includes(noteName)) {
          positions.push({
            string,
            fret,
            note: noteName,
            isRoot: noteName === scaleNotes[0]
          });
        }
      }
    }

    return positions;
  }

  // 获取 Blues 音阶
  static getBluesScales(): Record<string, Scale> {
    return {
      minor: this.getScale('C', 'blues'),
      major: this.getScale('C', 'major blues'),
      mixolydian: this.getScale('C', 'mixolydian blues')
    };
  }

  // 生成和弦进行
  static generateProgression(key: string, type: string): string[] {
    const scale = teoria.note(key).scale('major');
    const chords = scale.simple().map((degree, index) => {
      const chordTypes = ['', 'm', 'm', '', '', 'm', 'dim'];
      return teoria.note(degree).chord(chordTypes[index]);
    });

    switch (type) {
      case '12bar':
        return [
          chords[0].name,  // I
          chords[0].name,  // I
          chords[0].name,  // I
          chords[0].name,  // I
          chords[3].name,  // IV
          chords[3].name,  // IV
          chords[0].name,  // I
          chords[0].name,  // I
          chords[4].name,  // V
          chords[4].name,  // V
          chords[0].name,  // I
          chords[0].name   // I
        ];
      case 'jazz':
        return [
          chords[0].name + '7',  // I7
          chords[0].name + '7',  // I7
          chords[3].name + '7',  // IV7
          chords[3].name + '7',  // IV7
          chords[0].name + '7',  // I7
          chords[0].name + '7',  // I7
          chords[4].name + '7',  // V7
          chords[3].name + '7',  // IV7
          chords[0].name + '7',  // I7
          chords[4].name + '7',  // V7
        ];
      default:
        return chords.map(chord => chord.name);
    }
  }

  // 音符频率计算
  static getNoteFrequency(note: string, octave: number = 4): number {
    return teoria.note(note + octave).fq();
  }

  // 音程计算
  static getInterval(note1: string, note2: string): string {
    const n1 = teoria.note(note1);
    const n2 = teoria.note(note2);
    return n1.intervalTo(n2).name();
  }

  // 转调
  static transposeNote(note: string, semitones: number): string {
    const n = teoria.note(note);
    return n.transpose(semitones).name();
  }

  // 获取可用的音阶类型
  static getAvailableScales(): string[] {
    return [
      'major', 'minor', 'harmonic minor', 'melodic minor',
      'blues', 'major blues', 'minor blues',
      'pentatonic', 'minor pentatonic', 'major pentatonic',
      'mixolydian', 'dorian', 'phrygian', 'lydian', 'locrian'
    ];
  }

  // 获取可用的和弦类型
  static getAvailableChords(): string[] {
    return [
      '', 'm', '7', 'm7', 'maj7', 'dim', 'dim7', 'aug',
      'sus2', 'sus4', '7sus2', '7sus4',
      '6', 'm6', '9', 'm9', 'maj9', '11', 'm11', '13', 'm13'
    ];
  }
}

// 吉他调弦标准
export const GUITAR_TUNINGS = {
  standard: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  dropD: ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'],
  openG: ['D4', 'B3', 'G3', 'D3', 'G2', 'D2'],
  openD: ['A4', 'F#3', 'D3', 'A2', 'F#2', 'D2'],
  openC: ['E4', 'G4', 'C4', 'G3', 'C3', 'E2']
};

export default MusicTheory;