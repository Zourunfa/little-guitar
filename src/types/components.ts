import type { 
  Note, 
  BluesType, 
  ProgressionType, 
  ChordProgressions,
  FretboardPosition,
  RhythmPattern
} from './index';
import type { Dispatch, SetStateAction } from 'react';

/**
 * ScalePractice 组件 Props
 */
export interface ScalePracticeProps {
  selectedKey: Note;
  bluesType: BluesType;
  scaleNotes: string[];
  scaleDegrees: string[];
  fretboardPositions: FretboardPosition[];
}

/**
 * ChordPractice 组件 Props
 */
export interface ChordPracticeProps {
  selectedKey: Note;
  bluesType: BluesType;
  progression: ProgressionType;
  setProgression: (progression: ProgressionType) => void;
  chordProgressions: ChordProgressions;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentChordIndex: number;
  setCurrentChordIndex: Dispatch<SetStateAction<number>>;
  bpm: number;
  setBpm: (bpm: number) => void;
}

/**
 * RhythmPractice 组件 Props
 */
export interface RhythmPracticeProps {
  rhythmPatterns: RhythmPattern[];
  bpm: number;
  setBpm: (bpm: number) => void;
  isMetronomeActive: boolean;
  setIsMetronomeActive: (active: boolean) => void;
}

/**
 * Improvisation 组件 Props
 */
export interface ImprovisationProps {
  selectedKey: Note;
  bluesType: BluesType;
  scaleNotes: string[];
  scaleDegrees: string[];
  progression: ProgressionType;
  bpm: number;
}
