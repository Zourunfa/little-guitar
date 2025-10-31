/**
 * 音符类型
 */
export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

/**
 * Blues 类型
 */
export type BluesType = 'minor' | 'major' | 'mixolydian';

/**
 * 和弦进行类型
 */
export type ProgressionType = '12bar' | 'quick';

/**
 * 练习模式类型
 */
export type PracticeMode = 'scale' | 'chord' | 'rhythm' | 'improv';

/**
 * 和弦级数类型
 */
export type ChordDegree = 'I7' | 'IV7' | 'V7';

/**
 * 鼓声节奏型
 */
export type DrumPattern = 'shuffle' | 'standard' | 'slow';

/**
 * 和弦进行段落
 */
export interface ChordSection {
  chord: ChordDegree;
  bars: number;
  name: string;
}

/**
 * 展开的和弦信息
 */
export interface ExpandedChord {
  chord: string;
  degree: ChordDegree;
  name: string;
}

/**
 * 指板位置
 */
export interface FretboardPosition {
  string: number;  // 弦号 (0-5)
  fret: number;    // 品位 (0-20)
  note: string;    // 音符名称
  isRoot: boolean; // 是否为根音
}

/**
 * 节奏模式
 */
export interface RhythmPattern {
  id: string;
  name: string;
  description: string;
  pattern: number[];
}

/**
 * 和弦进行配置
 */
export interface ChordProgressions {
  [key: string]: ChordSection[];
}

/**
 * Blues 音阶配置 (半音间隔)
 */
export interface BluesScales {
  minor: number[];
  major: number[];
  mixolydian: number[];
}

/**
 * 音频上下文配置
 */
export interface AudioConfig {
  volume: number;
  enabled: boolean;
}

/**
 * Blues 乐句难度
 */
export type LickDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Blues 乐句风格
 */
export type LickStyle = 'chicago' | 'texas' | 'delta' | 'modern' | 'classic';

/**
 * 吉他 TAB 音符
 */
export interface TabNote {
  string: number;      // 弦号 (0-5, 0是高E弦)
  fret: number;        // 品位
  duration: number;    // 时值 (秒)
  technique?: 'bend' | 'slide' | 'hammer' | 'pull' | 'vibrato'; // 技巧
  bendAmount?: number; // 推弦量 (半音数)
}

/**
 * Blues 乐句数据
 */
export interface BluesLick {
  id: string;
  name: string;
  style: LickStyle;
  difficulty: LickDifficulty;
  key: Note;
  bpm: number;
  description: string;
  tabs: TabNote[];      // TAB 谱数据
  audioTips?: string;   // 演奏提示
}

// 音乐��关类型定义
export interface MusicNote {
  name: string;
  frequency: number;
  octave: number;
}

export interface Chord {
  name: string;
  notes: MusicNote[];
  type: string;
}

export interface Scale {
  name: string;
  notes: MusicNote[];
  type: string;
}

// 音频相关类型定义
export interface AudioFrequency {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
}

export interface TunerData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  isDetected: boolean;
}

// 乐器相关类型定义
export interface GuitarString {
  number: number;
  note: string;
  frequency: number;
  tuning: string;
}

export interface ChordDiagram {
  name: string;
  frets: number[];
  fingers: number[];
  barres?: number[];
}

// 练习相关类型定义
export interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'scale' | 'chord' | 'rhythm' | 'improvisation';
  data: any;
}

export interface PracticeSession {
  id: string;
  exerciseId: string;
  startTime: Date;
  endTime?: Date;
  score?: number;
  notes?: string;
}

// 云开发相关类型定义
export interface CloudBaseConfig {
  env: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  avatar?: string;
  level: number;
  experience: number;
  practiceTime: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

// UI 相关类型定义
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 通用工具类型定义
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
