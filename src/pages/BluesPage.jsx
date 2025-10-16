import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScalePractice from '../components/ScalePractice';
import ChordPractice from '../components/ChordPractice';
import RhythmPractice from '../components/RhythmPractice';
import Improvisation from '../components/Improvisation';

const BluesPage = () => {
  // 当前选择的调式
  const [selectedKey, setSelectedKey] = useState('A');
  // 当前选择的 Blues 类型
  const [bluesType, setBluesType] = useState('minor'); // minor, major, mixolydian
  // 当前选择的和弦进行
  const [progression, setProgression] = useState('12bar');
  // 节拍器状态
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState(90);
  // 和弦播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  // 当前选择的练习模式
  const [practiceMode, setPracticeMode] = useState('chord'); // scale, chord, rhythm, improv

  // 音符定义
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Blues 音阶定义 (半音间隔)
  const bluesScales = {
    minor: [0, 3, 5, 6, 7, 10, 12], // 小调 Blues: 1, b3, 4, b5, 5, b7, 8
    major: [0, 2, 3, 4, 7, 9, 12], // 大调 Blues: 1, 2, b3, 3, 5, 6, 8
    mixolydian: [0, 2, 4, 5, 7, 9, 10, 12] // Mixolydian: 1, 2, 3, 4, 5, 6, b7, 8
  };

  // 12小节 Blues 和弦进行
  const chordProgressions = {
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
  const rhythmPatterns = [
    { id: 'shuffle', name: 'Shuffle', pattern: '♪♪♪ ♪♪♪ ♪♪♪ ♪♪♪', description: '三连音摇摆节奏' },
    { id: 'straight', name: 'Straight', pattern: '♩ ♩ ♩ ♩', description: '直四分音符' },
    { id: 'syncopated', name: 'Syncopated', pattern: '♪♪ ♩ ♪♪ ♩', description: '切分音节奏' },
    { id: 'slow', name: 'Slow Blues', pattern: '♩. ♪ ♩. ♪', description: '慢板 Blues' }
  ];

  // 根据调式和音阶类型生成音阶音符
  const getScaleNotes = useCallback(() => {
    const rootIndex = notes.indexOf(selectedKey);
    const intervals = bluesScales[bluesType];
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return notes[noteIndex];
    });
  }, [selectedKey, bluesType]);

  // 吉他指板音符位置 - 基于A小调精确位置，通过移调计算所有调
  const getFretboardPositions = useCallback(() => {
    const scaleNotes = getScaleNotes();
    
    // A小调Blues的精确指板位置模板（基于图片，扩展到20品）
    // 这里只存储相对于根音A的品位偏移
    // ScalePractice组件的弦顺序: ['E', 'B', 'G', 'D', 'A', 'E']
    // stringIndex: 0=高E, 1=B, 2=G, 3=D, 4=A, 5=低E
    const aMinorBluesTemplate = [
      // 第1弦 - 高E弦 (stringIndex = 0, 空弦音=E)
      { string: 0, fretOffset: 0 },  // E
      { string: 0, fretOffset: 3 },  // G
      { string: 0, fretOffset: 5 },  // A (根音)
      { string: 0, fretOffset: 8 },  // C
      { string: 0, fretOffset: 10 }, // D
      { string: 0, fretOffset: 11 }, // D# (Eb)
      { string: 0, fretOffset: 12 }, // E
      { string: 0, fretOffset: 15 }, // G
      { string: 0, fretOffset: 17 }, // A (根音)
      { string: 0, fretOffset: 20 }, // C
      
      // 第2弦 - B弦 (stringIndex = 1, 空弦音=B)
      { string: 1, fretOffset: 1 },  // C
      { string: 1, fretOffset: 3 },  // D
      { string: 1, fretOffset: 4 },  // D# (Eb)
      { string: 1, fretOffset: 5 },  // E
      { string: 1, fretOffset: 8 },  // G
      { string: 1, fretOffset: 10 }, // A (根音)
      { string: 1, fretOffset: 13 }, // C
      { string: 1, fretOffset: 15 }, // D
      { string: 1, fretOffset: 16 }, // D# (Eb)
      { string: 1, fretOffset: 17 }, // E
      { string: 1, fretOffset: 20 }, // G
      
      // 第3弦 - G弦 (stringIndex = 2, 空弦音=G)
      { string: 2, fretOffset: 0 },  // G
      { string: 2, fretOffset: 2 },  // A (根音)
      { string: 2, fretOffset: 5 },  // C
      { string: 2, fretOffset: 7 },  // D
      { string: 2, fretOffset: 8 },  // D# (Eb)
      { string: 2, fretOffset: 9 },  // E
      { string: 2, fretOffset: 12 }, // G
      { string: 2, fretOffset: 14 }, // A (根音)
      { string: 2, fretOffset: 17 }, // C
      { string: 2, fretOffset: 19 }, // D
      { string: 2, fretOffset: 20 }, // D# (Eb)
      
      // 第4弦 - D弦 (stringIndex = 3, 空弦音=D)
      { string: 3, fretOffset: 0 },  // D
      { string: 3, fretOffset: 1 },  // D# (Eb)
      { string: 3, fretOffset: 2 },  // E
      { string: 3, fretOffset: 5 },  // G
      { string: 3, fretOffset: 7 },  // A (根音)
      { string: 3, fretOffset: 10 }, // C
      { string: 3, fretOffset: 12 }, // D
      { string: 3, fretOffset: 13 }, // D# (Eb)
      { string: 3, fretOffset: 14 }, // E
      { string: 3, fretOffset: 17 }, // G
      { string: 3, fretOffset: 19 }, // A (根音)
      
      // 第5弦 - A弦 (stringIndex = 4, 空弦音=A)
      { string: 4, fretOffset: 0 },  // A (根音)
      { string: 4, fretOffset: 3 },  // C
      { string: 4, fretOffset: 5 },  // D
      { string: 4, fretOffset: 6 },  // D# (Eb)
      { string: 4, fretOffset: 7 },  // E
      { string: 4, fretOffset: 10 }, // G
      { string: 4, fretOffset: 12 }, // A (根音)
      { string: 4, fretOffset: 15 }, // C
      { string: 4, fretOffset: 17 }, // D
      { string: 4, fretOffset: 18 }, // D# (Eb)
      { string: 4, fretOffset: 19 }, // E
      
      // 第6弦 - 低E弦 (stringIndex = 5, 空弦音=E)
      { string: 5, fretOffset: 0 },  // E
      { string: 5, fretOffset: 3 },  // G
      { string: 5, fretOffset: 5 },  // A (根音)
      { string: 5, fretOffset: 8 },  // C
      { string: 5, fretOffset: 10 }, // D
      { string: 5, fretOffset: 11 }, // D# (Eb)
      { string: 5, fretOffset: 12 }, // E
      { string: 5, fretOffset: 15 }, // G
      { string: 5, fretOffset: 17 }, // A (根音)
      { string: 5, fretOffset: 20 }  // C
    ];

    // 计算从A到目标调的半音偏移
    const rootIndexA = notes.indexOf('A');
    const targetRootIndex = notes.indexOf(selectedKey);
    const transposeOffset = (targetRootIndex - rootIndexA + 12) % 12;

    // 标准调弦的每根弦的空弦音
    const openStrings = ['E', 'B', 'G', 'D', 'A', 'E']; // 对应stringIndex 0-5

    // 基于模板和移调偏移计算实际位置
    const positions = [];
    
    aMinorBluesTemplate.forEach(template => {
      const stringOpenNote = openStrings[template.string];
      const stringOpenIndex = notes.indexOf(stringOpenNote);
      
      // 计算移调后的品位
      const newFret = template.fretOffset + transposeOffset;
      
      // 只保留0-20品的位置
      if (newFret >= 0 && newFret <= 20) {
        const noteIndex = (stringOpenIndex + newFret) % 12;
        const note = notes[noteIndex];
        
        // 只添加在当前音阶内的音符
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
  const getPracticeTips = () => {
    const tips = {
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
                { id: 'chord', icon: '🎹', name: '和弦进行', desc: '熟悉和弦变化' },
                { id: 'scale', icon: '🎵', name: '音阶练习', desc: '掌握 Blues 音阶' },
                { id: 'rhythm', icon: '🥁', name: '节奏训练', desc: '培养律动感' },
                { id: 'improv', icon: '✨', name: '即兴创作', desc: '综合实战' }
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
                    { id: 'minor', name: '小调 Blues', desc: '最常用,情感丰富' },
                    { id: 'major', name: '大调 Blues', desc: '明亮欢快' },
                    { id: 'mixolydian', name: 'Mixolydian', desc: '爵士色彩' }
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
