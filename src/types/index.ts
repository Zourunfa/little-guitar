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
