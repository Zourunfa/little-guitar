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
export type ProgressionType = '12bar' | 'quick' | '12bar-12beats' | 'custom';

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
 * 和弦进行配置（支持自定义拍号）
 */
export interface ProgressionConfig {
  beatsPerBar: number; // 每小节拍数
  beatSubdivision: number; // 每拍细分数（4=四分音符，8=八分音符，12=三连音）
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
  [key: string]: {
    sections: ChordSection[];
    config?: ProgressionConfig; // 可选的节拍配置
  };
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
