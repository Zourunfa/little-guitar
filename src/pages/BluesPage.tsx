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
      { bars: 1, chord: 'I7', name: '主和弦' },
      { bars: 1, chord: 'V7', name: '属和弦终止' }
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
    { id: 'shuffle', name: 'Shuffle', pattern: [2, 1, 2, 1], description: '三连音摇摆节奏 - 长短长短' },
    { id: 'straight', name: 'Straight', pattern: [1, 1, 1, 1], description: '直四分音符 - 均匀节奏' },
    { id: 'swing', name: 'Swing', pattern: [2, 1, 2, 1], description: '摇摆节奏 - 轻松律动' },
    { id: 'syncopated', name: 'Syncopated', pattern: [1, 2, 1, 2], description: '切分音节奏 - 强调弱拍' }
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
    const openStrings: Note[] = ['E', 'B', 'G', 'D', 'A', 'E'];
    const positions: FretboardPosition[] = [];
    
    // 遍历每根弦
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
      const stringOpenNote = openStrings[stringIndex];
      const stringOpenIndex = notes.indexOf(stringOpenNote);
      
      // 遍历每个品位（0-20品）
      for (let fret = 0; fret <= 20; fret++) {
        const noteIndex = (stringOpenIndex + fret) % 12;
        const note = notes[noteIndex];
        
        // 如果这个音符在音阶中，就添加到位置列表
        if (scaleNotes.includes(note)) {
          positions.push({
            string: stringIndex,
            fret: fret,
            note,
            isRoot: note === selectedKey
          });
        }
      }
    }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white pb-32">
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

      {/* 固定在页面底部的播放控制栏 - 仅在和弦进行模式下显示 */}
      {practiceMode === 'chord' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-gradient-to-t from-black/98 via-black/95 to-transparent backdrop-blur-xl border-t border-purple-500/30 shadow-2xl">
            <div className="container mx-auto px-4 py-4 md:py-5">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between gap-3 md:gap-6">
                  
                  {/* 左侧：状态指示器 */}
                  <div className="flex items-center gap-3 min-w-[120px] md:min-w-[180px]">
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        isPlaying 
                          ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' 
                          : 'bg-gray-500'
                      }`}></div>
                      {isPlaying && (
                        <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping"></div>
                      )}
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-bold text-white">
                        {isPlaying ? '播放中' : '已暂停'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isPlaying ? `小节 ${currentChordIndex + 1}` : `${bpm} BPM`}
                      </div>
                    </div>
                  </div>

                  {/* 中间：播放控制按钮 */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative overflow-hidden px-6 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg
                        transition-all duration-300 shadow-2xl
                        ${isPlaying
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/50' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/50'
                        }
                      `}
                      onClick={() => {
                        if (isPlaying) {
                          setIsPlaying(false);
                        } else {
                          setCurrentChordIndex(0);
                          setIsPlaying(true);
                        }
                      }}
                    >
                      <div className="relative z-10 flex items-center gap-2 md:gap-3">
                        {isPlaying ? (
                          <>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                              <rect x="5" y="3" width="3" height="14" rx="1" />
                              <rect x="12" y="3" width="3" height="14" rx="1" />
                            </svg>
                            <span>暂停</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                            <span>播放</span>
                          </>
                        )}
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-xl transition-all duration-300"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentChordIndex(0);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                          <rect x="5" y="5" width="10" height="10" rx="1" />
                        </svg>
                        <span className="hidden md:inline">停止</span>
                      </div>
                    </motion.button>
                  </div>

                  {/* 右侧：当前信息 */}
                  <div className="hidden lg:flex items-center gap-4 min-w-[180px]">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-4 py-3 rounded-xl border border-purple-500/30">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">速度</div>
                        <div className="text-xl font-bold text-yellow-400">
                          {bpm}
                        </div>
                      </div>
                      <div className="w-px h-10 bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400">小节</div>
                        <div className="text-xl font-bold text-blue-400">
                          {currentChordIndex + 1}/{chordProgressions[progression].reduce((sum, section) => sum + section.bars, 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BluesPage;
