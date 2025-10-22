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
    description: `芝加哥 Blues 风格的经典回转乐句，常用于12小节 Blues 的最后两小节。

【详细解释】
Turnaround（回转乐句）是 Blues 音乐中最重要的概念之一，通常出现在12小节进行的第11-12小节，作为一个"转折点"引导回到开头。这个乐句使用小调五声音阶，通过推弦和下行音阶制造张力后解决。

【技术要点】
• 使用小调五声音阶的经典音型
• 推弦技巧：7品推到8品的音高（推一个全音）
• 保持 Shuffle 摇摆节奏感
• 最后落在主音上形成完美解决

【学习资源】
• YouTube: "Blues Turnaround Licks - Easy Blues Guitar Lesson" by GuitarLessons365
• 推荐视频: https://www.youtube.com/results?search_query=blues+turnaround+licks+tutorial
• 相关教程: Justinguitar.com - Blues Lead Guitar Course`,
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
    description: `受 B.B. King 启发的推弦乐句，强调表现力和颤音。

【详细解释】
B.B. King 被誉为"Blues 之王"，他的标志性技巧就是富有表现力的推弦和颤音。这个乐句模仿了他的演奏风格：推弦后保持音高并加入颤音，让吉他"唱歌"。B.B. King 很少使用快速跑动，而是通过少量音符表达深刻情感。

【技术要点】
• 推弦要准确到位，推一个全音
• 推弦后保持音高，加入宽幅颤音
• 颤音频率约5-6次/秒，幅度约半音
• 注意音符的"呼吸感"，不要急促

【学习资源】
• YouTube: "B.B. King Style Guitar Lesson" by Marty Music
• 推荐视频: https://www.youtube.com/results?search_query=bb+king+guitar+style+lesson
• 经典曲目参考: "The Thrill Is Gone", "Sweet Little Angel"`,
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
    description: `德州 Blues 风格的双音演奏，受 Stevie Ray Vaughan 影响。

【详细解释】
德州 Blues 以其强劲有力的音色和双音（Double Stops）技巧著称。Stevie Ray Vaughan 将这种风格发扬光大，他经常使用六度、三度音程的双音来增加音乐的厚度和力量感。这种技巧让单音旋律听起来更饱满。

【技术要点】
• 同时弹奏两根相邻的弦，保持音量平衡
• 使用较重的拨片力度，营造德州风格的强劲音色
• 双音之间的音程关系很重要（通常是三度或六度）
• 可以加入轻微的推弦让双音更有表现力

【学习资源】
• YouTube: "Stevie Ray Vaughan Double Stops Lesson" by Texas Blues Alley
• 推荐视频: https://www.youtube.com/results?search_query=texas+blues+double+stops+tutorial
• 经典曲目参考: "Pride and Joy", "Texas Flood"`,
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
    description: `三角洲 Blues 风格的滑音乐句，简单但富有表现力。

【详细解释】
三角洲 Blues（Delta Blues）起源于密西西比三角洲地区，是最原始、最纯粹的 Blues 形式。这种风格强调情感表达胜过技巧炫耀，滑音技巧模仿人声的哭泣和呻吟，是三角洲 Blues 的核心特征。代表人物包括 Robert Johnson、Son House。

【技术要点】
• 滑音要平滑连贯，不要有明显的"跳跃"感
• 滑音速度可以有变化，营造情感起伏
• 模仿人声的音调变化
• 通常使用开放弦和低把位

【学习资源】
• YouTube: "Delta Blues Slide Guitar Lesson" by Acoustic Blues Guitar
• 推荐视频: https://www.youtube.com/results?search_query=delta+blues+slide+technique
• 经典曲目参考: Robert Johnson "Cross Road Blues"`,
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
    description: `现代 Blues 风格的快速音阶跑动，融合摇滚元素。

【详细解释】
现代 Blues 融合了摇滚、爵士等多种元素，技巧更加复杂多样。快速音阶跑动是现代 Blues 的标志之一，要求高超的技巧和清晰度。这种风格的代表人物包括 Joe Bonamassa、John Mayer 等。

【技术要点】
• 使用交替拨弦（Alternate Picking）保持速度
• 左手按弦要准确，避免杂音
• 保持每个音符的清晰度和音量均衡
• 可以加入锤击、勾弦增加流畅度

【学习资源】
• YouTube: "Modern Blues Guitar Techniques" by GuitarZoom
• 推荐视频: https://www.youtube.com/results?search_query=modern+blues+fast+runs+tutorial
• 相关教程: TrueFire.com - Modern Blues Guitar Courses`,
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
    description: `使用锤击和勾弦技巧的芝加哥 Blues 乐句。

【详细解释】
芝加哥 Blues 在20世纪中期达到巅峰，以电吉他、口琴和强劲的节奏为特色。锤击（Hammer-on）和勾弦（Pull-off）是芝加哥风格的重要技巧，可以让演奏更流畅，减少拨弦次数，营造连贯的旋律线条。代表人物包括 Muddy Waters、Buddy Guy。

【技术要点】
• 锤击：用手指快速敲击琴弦，不用拨弦发声
• 勾弦：手指离开琴弦时向下勾动，让下方音符发声
• 锤击和勾弦要有足够力度，音量不能太弱
• 保持节奏的稳定性

【学习资源】
• YouTube: "Chicago Blues Hammer-On Pull-Off Lesson" by Active Melody
• 推荐视频: https://www.youtube.com/results?search_query=chicago+blues+hammer+on+pull+off
• 经典曲目参考: Muddy Waters "Hoochie Coochie Man"`,
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
    description: `从 I 级和弦转到 IV 级和弦的经典过渡乐句。

【详细解释】
在12小节 Blues 进行中，从 I 级和弦（主和弦）转换到 IV 级和弦（下属和弦）是第5小节的标志性变化。这个乐句专门设计用于平滑过渡这个和弦变化，通过音阶中的特定音符来强调和弦的转换。

【技术要点】
• 理解 I-IV 和弦关系（相差纯四度）
• 使用五声音阶中与两个和弦都契合的音符
• 注意在和弦变化点上使用目标音
• 保持 Shuffle 节奏感

【学习资源】
• YouTube: "Blues Chord Changes - I to IV Transition" by JustinGuitar
• 推荐视频: https://www.youtube.com/results?search_query=blues+I+IV+chord+change+licks
• 理论学习: 12小节 Blues 和弦进行分析`,
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
    description: `使用半音下行的现代 Blues 乐句，增加张力。

【详细解释】
半音下行（Chromatic Descent）是现代 Blues 和爵士 Blues 中常用的技巧。通过连续的半音下行制造紧张感和不稳定感，最后解决到目标音（通常是根音或和弦音）时产生强烈的释放感。这种技巧增加了音乐的色彩和张力。

【技术要点】
• 半音下行要清晰，每个音符都要听得见
• 控制好节奏，不要越弹越快
• 最后解决到稳定音时要有"着陆"的感觉
• 可以配合推弦、颤音增强表现力

【学习资源】
• YouTube: "Chromatic Blues Licks Tutorial" by Steve Stine Guitar
• 推荐视频: https://www.youtube.com/results?search_query=chromatic+blues+licks+lesson
• 相关理论: 半音趋近音（Chromatic Approach Notes）`,
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
