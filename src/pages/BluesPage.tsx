import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScalePractice from '../components/ScalePractice';
import ChordPractice from '../components/ChordPractice';
import RhythmPractice from '../components/RhythmPractice';
import Improvisation from '../components/Improvisation';
import type { Note, BluesType, ProgressionType, PracticeMode, ChordProgressions, BluesScales, RhythmPattern, FretboardPosition } from '../types';

const BluesPage: React.FC = () => {
  // 当前选择的调式
  const [selectedKey, setSelectedKey] = useState<Note>('A');
  // 当前选择的 Blues 类型
  const [bluesType, setBluesType] = useState<BluesType>('minor');
  // 当前选择的和弦进行
  const [progression, setProgression] = useState<ProgressionType>('12bar');
  // 节拍器状态
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(90);
  // 和弦播放状态
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(0);
  // 当前选择的练习模式
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('chord');

  // 音符定义
  const notes: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Blues 音阶定义 (半音间隔)
  const bluesScales: BluesScales = {
    minor: [0, 3, 5, 6, 7, 10, 12],
    major: [0, 2, 3, 4, 7, 9, 12],
    mixolydian: [0, 2, 4, 5, 7, 9, 10, 12]
  };

  // 12小节 Blues 和弦进行
  const chordProgressions: ChordProgressions = {
    '12bar': [
      { bars: 4, chord: 'I7', name: '主和弦' },
      { bars: 2, chord: 'IV7', name: '下属和弦' },
      { bars: 2, chord: 'I7', name: '主和弦' },
      { bars: 1, chord: 'V7', name: '属和弦' },
      { bars: 1, chord: 'IV7', name: '下属和弦' },
      { bars: 2, chord: 'I7', name: '主和弦回到终止' }
    ],
    'quick': [
      { bars: 2, chord: 'I7', name: '主和弦' },
      { bars: 1, chord: 'IV7', name: '下属和弦' },
      { bars: 1, chord: 'I7', name: '主和弦' },
      { bars: 1, chord: 'V7', name: '属和弦' },
      { bars: 1, chord: 'I7', name: '主和弦' }
    ]
  };

  // 节奏型定义
  const rhythmPatterns: RhythmPattern[] = [
    { id: 'shuffle', name: 'Shuffle', pattern: [1, 2, 3], description: '三连音摇摆节奏' },
    { id: 'straight', name: 'Straight', pattern: [1, 1, 1, 1], description: '直四分音符' },
    { id: 'syncopated', name: 'Syncopated', pattern: [1, 2, 1, 2], description: '切分音节奏' },
    { id: 'slow', name: 'Slow Blues', pattern: [3, 1, 3, 1], description: '慢板 Blues' }
  ];

  // 根据调式和音阶类型生成音阶音符
  const getScaleNotes = useCallback((): string[] => {
    const rootIndex = notes.indexOf(selectedKey);
    const intervals = bluesScales[bluesType];
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return notes[noteIndex];
    });
  }, [selectedKey, bluesType]);

  // 吉他指板音符位置
  const getFretboardPositions = useCallback((): FretboardPosition[] => {
    const scaleNotes = getScaleNotes();
    
    const aMinorBluesTemplate = [
      // 第1弦 - 高E弦
      { string: 0, fretOffset: 0 }, { string: 0, fretOffset: 3 }, { string: 0, fretOffset: 5 },
      { string: 0, fretOffset: 8 }, { string: 0, fretOffset: 10 }, { string: 0, fretOffset: 11 },
      { string: 0, fretOffset: 12 }, { string: 0, fretOffset: 15 }, { string: 0, fretOffset: 17 },
      { string: 0, fretOffset: 20 },
      
      // 第2弦 - B弦
      { string: 1, fretOffset: 1 }, { string: 1, fretOffset: 3 }, { string: 1, fretOffset: 4 },
      { string: 1, fretOffset: 5 }, { string: 1, fretOffset: 8 }, { string: 1, fretOffset: 10 },
      { string: 1, fretOffset: 13 }, { string: 1, fretOffset: 15 }, { string: 1, fretOffset: 16 },
      { string: 1, fretOffset: 17 }, { string: 1, fretOffset: 20 },
      
      // 第3弦 - G弦
      { string: 2, fretOffset: 0 }, { string: 2, fretOffset: 2 }, { string: 2, fretOffset: 5 },
      { string: 2, fretOffset: 7 }, { string: 2, fretOffset: 8 }, { string: 2, fretOffset: 9 },
      { string: 2, fretOffset: 12 }, { string: 2, fretOffset: 14 }, { string: 2, fretOffset: 17 },
      { string: 2, fretOffset: 19 }, { string: 2, fretOffset: 20 },
      
      // 第4弦 - D弦
      { string: 3, fretOffset: 0 }, { string: 3, fretOffset: 1 }, { string: 3, fretOffset: 2 },
      { string: 3, fretOffset: 5 }, { string: 3, fretOffset: 7 }, { string: 3, fretOffset: 10 },
      { string: 3, fretOffset: 12 }, { string: 3, fretOffset: 13 }, { string: 3, fretOffset: 14 },
      { string: 3, fretOffset: 17 }, { string: 3, fretOffset: 19 },
      
      // 第5弦 - A弦
      { string: 4, fretOffset: 0 }, { string: 4, fretOffset: 3 }, { string: 4, fretOffset: 5 },
      { string: 4, fretOffset: 6 }, { string: 4, fretOffset: 7 }, { string: 4, fretOffset: 10 },
      { string: 4, fretOffset: 12 }, { string: 4, fretOffset: 15 }, { string: 4, fretOffset: 17 },
      { string: 4, fretOffset: 18 }, { string: 4, fretOffset: 19 },
      
      // 第6弦 - 低E弦
      { string: 5, fretOffset: 0 }, { string: 5, fretOffset: 3 }, { string: 5, fretOffset: 5 },
      { string: 5, fretOffset: 8 }, { string: 5, fretOffset: 10 }, { string: 5, fretOffset: 11 },
      { string: 5, fretOffset: 12 }, { string: 5, fretOffset: 15 }, { string: 5, fretOffset: 17 },
      { string: 5, fretOffset: 20 }
    ];

    const rootIndexA = notes.indexOf('A');
    const targetRootIndex = notes.indexOf(selectedKey);
    const transposeOffset = (targetRootIndex - rootIndexA + 12) % 12;

    const openStrings: Note[] = ['E', 'B', 'G', 'D', 'A', 'E'];

    const positions: FretboardPosition[] = [];
    
    aMinorBluesTemplate.forEach(template => {
      const stringOpenNote = openStrings[template.string];
      const stringOpenIndex = notes.indexOf(stringOpenNote);
      
      const newFret = template.fretOffset + transposeOffset;
      
      if (newFret >= 0 && newFret <= 20) {
        const noteIndex = (stringOpenIndex + newFret) % 12;
        const note = notes[noteIndex];
        
        if (scaleNotes.includes(note)) {
          positions.push({
            string: template.string,
            fret: newFret,
            note,
            isRoot: note === selectedKey
          });
        }
      }
    });

    return positions;
  }, [selectedKey, bluesType, getScaleNotes]);

  // 练习提示
  const getPracticeTips = (): string[] => {
    const tips: Record<PracticeMode, string[]> = {
      scale: [
        '从根音开始,熟悉音阶的上下行',
        '尝试不同的指型和把位',
        '注意弯音和滑音的运用',
        'Blues 音阶的 b5 是关键音符'
      ],
      chord: [
        'Blues 通常使用属七和弦 (Dominant 7th)',
        '注意和弦转换的流畅性',
        '尝试加入九音、十三音等延伸音',
        '听和弦色彩的变化'
      ],
      rhythm: [
        'Shuffle 节奏是 Blues 的灵魂',
        '注意三连音的摇摆感',
        '切分音增加律动感',
        '用节拍器保持稳定的节奏'
      ],
      improv: [
        '从简单的旋律动机开始',
        '重复和变化是即兴的核心',
        '留白也是音乐的一部分',
        '用耳朵听,用心感受'
      ]
    };
    return tips[practiceMode] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* 标题 */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
              🎸 Blues 即兴练习室
            </h1>
            <p className="text-lg md:text-xl text-gray-300">系统化训练 · 旋律 · 和弦 · 节奏</p>
          </div>

          {/* 练习模式选择 */}
          <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 mb-6 border border-white/10">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">选择练习模式</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { id: 'chord' as PracticeMode, icon: '🎹', name: '和弦进行', desc: '熟悉和弦变化' },
                { id: 'scale' as PracticeMode, icon: '🎵', name: '音阶练习', desc: '掌握 Blues 音阶' },
                { id: 'rhythm' as PracticeMode, icon: '🥁', name: '节奏训练', desc: '培养律动感' },
                { id: 'improv' as PracticeMode, icon: '✨', name: '即兴创作', desc: '综合实战' }
              ].map(mode => (
                <motion.button
                  key={mode.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    practiceMode === mode.id
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50'
                      : 'bg-white/10 hover:bg-white/20 border border-white/20'
                  }`}
                  onClick={() => setPracticeMode(mode.id)}
                >
                  <div className="text-3xl md:text-4xl mb-2">{mode.icon}</div>
                  <div className="text-sm md:text-base font-bold mb-1">{mode.name}</div>
                  <div className="text-xs text-gray-300">{mode.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 调式和类型选择 */}
          <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 mb-6 border border-white/10">
            <div className="grid md:grid-cols-2 gap-6">
              {/* 调式选择 */}
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-3">选择调式</h3>
                <div className="grid grid-cols-4 gap-2">
                  {notes.map(note => (
                    <motion.button
                      key={note}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 md:p-3 rounded-lg font-bold transition-all ${
                        selectedKey === note
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={() => setSelectedKey(note)}
                    >
                      {note}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Blues 类型选择 */}
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Blues 类型</h3>
                <div className="space-y-2">
                  {[
                    { id: 'minor' as BluesType, name: '小调 Blues', desc: '最常用,情感丰富' },
                    { id: 'major' as BluesType, name: '大调 Blues', desc: '明亮欢快' },
                    { id: 'mixolydian' as BluesType, name: 'Mixolydian', desc: '爵士色彩' }
                  ].map(type => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        bluesType === type.id
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={() => setBluesType(type.id)}
                    >
                      <div className="font-bold">{type.name}</div>
                      <div className="text-xs text-gray-300">{type.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 主要内容区域 - 根据练习模式切换 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={practiceMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {practiceMode === 'scale' && (
                <ScalePractice
                  selectedKey={selectedKey}
                  bluesType={bluesType}
                  scaleNotes={getScaleNotes()}
                  fretboardPositions={getFretboardPositions()}
                />
              )}

              {practiceMode === 'chord' && (
                <ChordPractice
                  selectedKey={selectedKey}
                  bluesType={bluesType}
                  progression={progression}
                  setProgression={setProgression}
                  chordProgressions={chordProgressions}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentChordIndex={currentChordIndex}
                  setCurrentChordIndex={setCurrentChordIndex}
                  bpm={bpm}
                  setBpm={setBpm}
                />
              )}

              {practiceMode === 'rhythm' && (
                <RhythmPractice
                  rhythmPatterns={rhythmPatterns}
                  bpm={bpm}
                  setBpm={setBpm}
                  isMetronomeActive={isMetronomeActive}
                  setIsMetronomeActive={setIsMetronomeActive}
                />
              )}

              {practiceMode === 'improv' && (
                <Improvisation
                  selectedKey={selectedKey}
                  bluesType={bluesType}
                  scaleNotes={getScaleNotes()}
                  progression={progression}
                  bpm={bpm}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 练习提示 */}
          <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 mt-6 border border-white/10">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-400">💡 练习提示</h3>
            <ul className="space-y-2 text-sm md:text-base text-gray-300">
              {getPracticeTips().map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-400 mr-2">▸</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BluesPage;
