import type { BluesLick } from '../types';

/**
 * 经典 Blues 乐句库
 * 这些是基于通用 Blues 理论的典型乐句模式，而非特定艺术家的原版作品
 */
export const bluesLicksDatabase: BluesLick[] = [
  {
    id: 'lick-001',
    name: '经典小调 Turnaround',
    style: 'chicago',
    difficulty: 'beginner',
    key: 'A',
    bpm: 90,
    description: '芝加哥 Blues 风格的经典回转乐句，常用于12小节 Blues 的最后两小节',
    audioTips: '注意推弦要到位，保持节奏的摇摆感',
    tabs: [
      { string: 2, fret: 5, duration: 0.25 },
      { string: 2, fret: 7, duration: 0.25, technique: 'bend', bendAmount: 1 },
      { string: 2, fret: 7, duration: 0.25 },
      { string: 2, fret: 5, duration: 0.25 },
      { string: 3, fret: 7, duration: 0.25 },
      { string: 3, fret: 5, duration: 0.25 },
      { string: 4, fret: 7, duration: 0.5 }
    ]
  },
  {
    id: 'lick-002',
    name: 'B.B. King 风格推弦',
    style: 'classic',
    difficulty: 'intermediate',
    key: 'A',
    bpm: 80,
    description: '受 B.B. King 启发的推弦乐句，强调表现力和颤音',
    audioTips: '推弦后加颤音，让音符"唱歌"',
    tabs: [
      { string: 1, fret: 8, duration: 0.5, technique: 'bend', bendAmount: 1 },
      { string: 1, fret: 8, duration: 0.5, technique: 'vibrato' },
      { string: 2, fret: 8, duration: 0.25 },
      { string: 2, fret: 10, duration: 0.25 },
      { string: 2, fret: 8, duration: 0.25 },
      { string: 2, fret: 5, duration: 0.25 }
    ]
  },
  {
    id: 'lick-003',
    name: '德州 Blues 双音',
    style: 'texas',
    difficulty: 'intermediate',
    key: 'A',
    bpm: 100,
    description: '德州 Blues 风格的双音演奏，受 Stevie Ray Vaughan 影响',
    audioTips: '同时拨两根弦，保持音量平衡',
    tabs: [
      { string: 1, fret: 5, duration: 0.25 },
      { string: 2, fret: 5, duration: 0.25 },
      { string: 1, fret: 8, duration: 0.25 },
      { string: 2, fret: 8, duration: 0.25 },
      { string: 1, fret: 10, duration: 0.5 },
      { string: 2, fret: 10, duration: 0.5 }
    ]
  },
  {
    id: 'lick-004',
    name: '三角洲 Blues 滑音',
    style: 'delta',
    difficulty: 'beginner',
    key: 'E',
    bpm: 70,
    description: '三角洲 Blues 风格的滑音乐句，简单但富有表现力',
    audioTips: '滑音要平滑连贯，模仿人声',
    tabs: [
      { string: 3, fret: 0, duration: 0.5 },
      { string: 3, fret: 2, duration: 0.25, technique: 'slide' },
      { string: 3, fret: 4, duration: 0.5 },
      { string: 4, fret: 2, duration: 0.25 },
      { string: 4, fret: 0, duration: 0.5 }
    ]
  },
  {
    id: 'lick-005',
    name: '现代 Blues 快速跑动',
    style: 'modern',
    difficulty: 'advanced',
    key: 'A',
    bpm: 120,
    description: '现代 Blues 风格的快速音阶跑动，融合摇滚元素',
    audioTips: '保持清晰度，不要为了速度牺牲音符的准确性',
    tabs: [
      { string: 1, fret: 5, duration: 0.125 },
      { string: 1, fret: 8, duration: 0.125 },
      { string: 2, fret: 5, duration: 0.125 },
      { string: 2, fret: 8, duration: 0.125 },
      { string: 2, fret: 10, duration: 0.125 },
      { string: 3, fret: 7, duration: 0.125 },
      { string: 3, fret: 9, duration: 0.125 },
      { string: 4, fret: 7, duration: 0.25 }
    ]
  },
  {
    id: 'lick-006',
    name: '芝加哥风格锤击音',
    style: 'chicago',
    difficulty: 'intermediate',
    key: 'G',
    bpm: 95,
    description: '使用锤击和勾弦技巧的芝加哥 Blues 乐句',
    audioTips: '锤击和勾弦要有力度，让音符清晰可辨',
    tabs: [
      { string: 2, fret: 3, duration: 0.25 },
      { string: 2, fret: 5, duration: 0.25, technique: 'hammer' },
      { string: 2, fret: 3, duration: 0.25, technique: 'pull' },
      { string: 3, fret: 5, duration: 0.25 },
      { string: 3, fret: 3, duration: 0.25 },
      { string: 3, fret: 5, duration: 0.5 }
    ]
  },
  {
    id: 'lick-007',
    name: '经典 I-IV 转换乐句',
    style: 'classic',
    difficulty: 'beginner',
    key: 'E',
    bpm: 85,
    description: '从 I 级和弦转到 IV 级和弦的经典过渡乐句',
    audioTips: '注意和弦变化时的音符选择',
    tabs: [
      { string: 4, fret: 2, duration: 0.25 },
      { string: 4, fret: 4, duration: 0.25 },
      { string: 3, fret: 2, duration: 0.25 },
      { string: 3, fret: 4, duration: 0.25 },
      { string: 3, fret: 2, duration: 0.5 }
    ]
  },
  {
    id: 'lick-008',
    name: '半音下行乐句',
    style: 'modern',
    difficulty: 'intermediate',
    key: 'A',
    bpm: 100,
    description: '使用半音下行的现代 Blues 乐句，增加张力',
    audioTips: '半音要清晰，营造紧张感后解决到根音',
    tabs: [
      { string: 1, fret: 10, duration: 0.25 },
      { string: 1, fret: 9, duration: 0.25 },
      { string: 1, fret: 8, duration: 0.25 },
      { string: 2, fret: 10, duration: 0.25 },
      { string: 2, fret: 8, duration: 0.5 }
    ]
  }
];

/**
 * 根据调式转换乐句
 */
export function transposeLick(lick: BluesLick, targetKey: string): BluesLick {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const originalKeyIndex = notes.indexOf(lick.key);
  const targetKeyIndex = notes.indexOf(targetKey);
  const semitoneOffset = targetKeyIndex - originalKeyIndex;

  const transposedTabs = lick.tabs.map(tab => ({
    ...tab,
    fret: Math.max(0, Math.min(20, tab.fret + semitoneOffset))
  }));

  return {
    ...lick,
    key: targetKey as any,
    tabs: transposedTabs
  };
}

/**
 * 根据难度筛选乐句
 */
export function filterLicksByDifficulty(difficulty: string) {
  return bluesLicksDatabase.filter(lick => lick.difficulty === difficulty);
}

/**
 * 根据风格筛选乐句
 */
export function filterLicksByStyle(style: string) {
  return bluesLicksDatabase.filter(lick => lick.style === style);
}
