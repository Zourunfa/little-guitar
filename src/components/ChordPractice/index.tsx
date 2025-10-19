import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import DrumKit from '../../utils/drumKit';
import Accompaniment from '../../utils/accompaniment';
import ScalePractice from '../ScalePractice';
import type { ChordPracticeProps } from '../../types/components';
import type { Note, DrumPattern as DrumPatternType } from '../../types';

// 音符定义 (组件外部常量)
const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 小调Blues音阶定义 (半音间隔)
const MINOR_BLUES_INTERVALS = [0, 3, 5, 6, 7, 10, 12]; // 1, b3, 4, b5, 5, b7, 8

/**
 * 和弦进行练习组件
 */
const ChordPractice: React.FC<ChordPracticeProps> = ({
  selectedKey,
  progression,
  setProgression,
  chordProgressions,
  isPlaying,
  setIsPlaying,
  currentChordIndex,
  setCurrentChordIndex,
  bpm,
  setBpm
}) => {
  const drumKitRef = useRef<DrumKit | null>(null);
  const accompanimentRef = useRef<Accompaniment | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number>(1); // 当前拍号 (1-4)
  const [drumPattern, setDrumPattern] = useState<DrumPatternType>('shuffle'); // 鼓声节奏型
  const [drumVolume, setDrumVolume] = useState<number>(0.7); // 鼓声音量
  const [isDrumEnabled, setIsDrumEnabled] = useState<boolean>(true); // 是否启用鼓声
  const [countdown, setCountdown] = useState<number>(0); // 倒计时状态 (0表示不倒计时, 3/2/1表示倒计时中)
  
  // 伴奏相关状态
  const [isHarmonicaEnabled] = useState<boolean>(false); // 是否启用口琴
  const [isGuitarEnabled] = useState<boolean>(false); // 是否启用吉他
  const [harmonicaVolume] = useState<number>(0.4); // 口琴音量
  const [guitarVolume] = useState<number>(0.4); // 吉他音量

  // 初始化鼓组和伴奏
  useEffect(() => {
    drumKitRef.current = new DrumKit();
    drumKitRef.current.init();
    
    accompanimentRef.current = new Accompaniment();
    accompanimentRef.current.init();

    return () => {
      if (drumKitRef.current) {
        drumKitRef.current.dispose();
      }
      if (accompanimentRef.current) {
        accompanimentRef.current.dispose();
      }
    };
  }, []);

  // 根据调式生成和弦名称
  const getChordName = (degree: string): string => {
    const notes: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = notes.indexOf(selectedKey);

    const intervals: Record<string, number> = {
      'I7': 0,
      'IV7': 5,
      'V7': 7
    };

    const chordRoot = notes[(rootIndex + intervals[degree]) % 12];
    return `${chordRoot}7`;
  };

  // 展开和弦进行为小节列表
  const expandProgression = () => {
    const expanded: Array<{ chord: string; degree: string; name: string }> = [];
    chordProgressions[progression].forEach(section => {
      for (let i = 0; i < section.bars; i++) {
        expanded.push({
          chord: getChordName(section.chord),
          degree: section.chord,
          name: section.name
        });
      }
    });
    return expanded;
  };

  const expandedChords = expandProgression();

  // 获取当前和弦的根音 (从和弦名中提取,如 "A7" -> "A")
  const getCurrentChordRoot = useMemo(() => {
    if (expandedChords.length === 0) return selectedKey;
    const currentChord = expandedChords[currentChordIndex]?.chord || selectedKey;
    return currentChord.replace(/7$/, '') as Note; // 去掉"7"
  }, [currentChordIndex, expandedChords, selectedKey]);

  // 根据当前和弦根音生成对应的小调Blues音阶
  const getCurrentScaleNotes = useMemo(() => {
    const rootIndex = NOTES.indexOf(getCurrentChordRoot);
    return MINOR_BLUES_INTERVALS.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  }, [getCurrentChordRoot]);

  // 计算当前和弦对应的指板位置
  const getCurrentFretboardPositions = useMemo(() => {
    const scaleNotes = getCurrentScaleNotes;
    const positions: Array<{ string: number; fret: number; note: string; isRoot: boolean }> = [];

    // 标准调弦的每根弦的空弦音
    const openStrings: Note[] = ['E', 'B', 'G', 'D', 'A', 'E'];

    // 直接计算每根弦上0-20品的所有音阶位置
    openStrings.forEach((openString, stringIndex) => {
      const openNoteIndex = NOTES.indexOf(openString);

      // 遍历0-20品
      for (let fret = 0; fret <= 20; fret++) {
        const noteIndex = (openNoteIndex + fret) % 12;
        const note = NOTES[noteIndex];

        // 如果该音符在当前音阶内,则添加位置
        if (scaleNotes.includes(note)) {
          positions.push({
            string: stringIndex,
            fret: fret,
            note,
            isRoot: note === getCurrentChordRoot
          });
        }
      }
    });

    return positions;
  }, [getCurrentChordRoot, getCurrentScaleNotes]);

  // 播放鼓声
  const playDrum = (beatNumber: number): void => {
    if (!isDrumEnabled || !drumKitRef.current) return;

    switch (drumPattern) {
      case 'shuffle':
        drumKitRef.current.playBluesShuffle(beatNumber, drumVolume);
        break;
      case 'standard':
        drumKitRef.current.playStandardBeat(beatNumber, drumVolume);
        break;
      case 'slow':
        drumKitRef.current.playSlowBlues(beatNumber, drumVolume);
        break;
      default:
        drumKitRef.current.playBluesShuffle(beatNumber, drumVolume);
    }
  };

  // 播放伴奏
  const playAccompaniment = (beatNumber: number, currentChord: string): void => {
    if (!accompanimentRef.current) return;

    // 从和弦名称中提取根音 (例如 "C7" -> "C", "A#7" -> "A#")
    const rootNote = currentChord.replace(/7$/, '');

    // 播放吉他伴奏
    if (isGuitarEnabled) {
      accompanimentRef.current.playGuitarBluesRhythm(
        rootNote,
        beatNumber,
        guitarVolume
      );
    }

    // 播放口琴 (只在第1拍和第3拍)
    if (isHarmonicaEnabled && (beatNumber === 1 || beatNumber === 3)) {
      accompanimentRef.current.playHarmonicaBluesRiff(
        rootNote,
        harmonicaVolume
      );
    }
  };

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          // 倒计时结束,开始播放
          setCountdown(0);
          setIsPlaying(true);
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, setIsPlaying]);

  // 节拍控制 - 每拍触发一次鼓声和伴奏
  useEffect(() => {
    if (!isPlaying || countdown > 0) {
      setCurrentBeat(1);
      return;
    }

    const msPerBeat = (60 / bpm) * 1000;
    let beatCounter = 1;

    // 立即播放第一拍
    playDrum(beatCounter);
    const currentChord = expandedChords[currentChordIndex]?.chord || selectedKey;
    playAccompaniment(beatCounter, currentChord);
    setCurrentBeat(beatCounter);

    const beatInterval = setInterval(() => {
      beatCounter = (beatCounter % 4) + 1; // 循环 1-4 拍
      playDrum(beatCounter);
      const chord = expandedChords[currentChordIndex]?.chord || selectedKey;
      playAccompaniment(beatCounter, chord);
      setCurrentBeat(beatCounter);
    }, msPerBeat);

    return () => clearInterval(beatInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, bpm, drumPattern, drumVolume, isDrumEnabled, isGuitarEnabled, isHarmonicaEnabled, guitarVolume, harmonicaVolume, currentChordIndex]);

  // 小节控制 - 每4拍切换一次和弦
  useEffect(() => {
    if (!isPlaying) return;

    const beatsPerBar = 4;
    const msPerBeat = (60 / bpm) * 1000;
    const msPerBar = msPerBeat * beatsPerBar;

    const barInterval = setInterval(() => {
      setCurrentChordIndex(prev => (prev + 1) % expandedChords.length);
    }, msPerBar);

    return () => clearInterval(barInterval);
  }, [isPlaying, bpm, expandedChords.length, setCurrentChordIndex]);

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/10">
      <h2 className="text-xl md:text-2xl font-bold mb-4">🎹 {selectedKey} Blues 和弦进行</h2>

      {/* 和弦进行选择 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">选择进行类型</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all ${
              progression === '12bar'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setProgression('12bar')}
          >
            <div className="font-bold text-lg">标准 12 小节 Blues</div>
            <div className="text-sm text-gray-300">经典 Blues 进行</div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all ${
              progression === 'quick'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setProgression('quick')}
          >
            <div className="font-bold text-lg">快速 6 小节 Blues</div>
            <div className="text-sm text-gray-300">适合快速练习</div>
          </motion.button>
        </div>
      </div>

      {/* BPM速度控制 */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-3 md:p-4 mb-6 border border-purple-500/30">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">⏱️ 节拍速度 (BPM)</h3>

        <div className="flex items-center gap-3 md:gap-4 mb-4">
          <div className="flex items-center gap-2 min-w-[80px] md:min-w-[100px]">
            <span className="text-xs md:text-sm font-medium">当前:</span>
            <span className="text-2xl md:text-3xl font-bold text-yellow-400">{bpm}</span>
          </div>
          
          <div className="flex-1">
            <input
              type="range"
              min="60"
              max="180"
              step="5"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((bpm - 60) / (180 - 60)) * 100}%, rgba(255,255,255,0.2) ${((bpm - 60) / (180 - 60)) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>60</span>
              <span>120</span>
              <span>180</span>
            </div>
          </div>
        </div>

        {/* 快捷BPM按钮 */}
        <div className="mb-3">
          <div className="text-xs md:text-sm text-gray-400 mb-2">快速设置:</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[60, 80, 100, 120, 140, 160].map(speed => (
              <motion.button
                key={speed}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  bpm === speed
                    ? 'bg-yellow-500 text-black shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                onClick={() => setBpm(speed)}
              >
                {speed}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 节拍指示器 */}
        {isPlaying && (
          <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg">
            <span className="text-sm font-medium">当前节拍:</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(beat => (
                <div
                  key={beat}
                  className={`w-4 h-4 rounded-full transition-all duration-100 ${
                    currentBeat === beat 
                      ? 'bg-yellow-400 scale-125 shadow-lg shadow-yellow-400/50' 
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">({currentBeat}/4)</span>
          </div>
        )}

        {/* BPM描述 */}
        <div className="mt-3 text-xs text-gray-400 text-center">
          {bpm < 80 && "🐌 慢速 - 适合初学者练习"}
          {bpm >= 80 && bpm < 120 && "🚶 中速 - 标准练习速度"}
          {bpm >= 120 && bpm < 150 && "🏃 快速 - 进阶练习"}
          {bpm >= 150 && "🚀 极速 - 专业水平挑战"}
        </div>
      </div>

      {/* 鼓声节奏设置 */}
      <div className="bg-black/50 rounded-xl p-3 md:p-4 mb-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold">🥁 鼓声节奏</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDrumEnabled}
              onChange={(e) => setIsDrumEnabled(e.target.checked)}
              className="w-4 h-4 md:w-5 md:h-5 rounded"
            />
            <span className="text-xs md:text-sm">启用</span>
          </label>
        </div>

        {/* 节奏型选择 */}
        <div className="grid grid-cols-3 gap-2 mb-3 md:mb-4">
          {[
            { id: 'shuffle' as DrumPatternType, name: 'Shuffle', desc: 'Blues 摇摆' },
            { id: 'standard' as DrumPatternType, name: 'Standard', desc: '标准四四拍' },
            { id: 'slow' as DrumPatternType, name: 'Slow Blues', desc: '慢板 Blues' }
          ].map(pattern => (
            <motion.button
              key={pattern.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-lg text-center transition-all ${
                drumPattern === pattern.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              onClick={() => setDrumPattern(pattern.id)}
              disabled={!isDrumEnabled}
            >
              <div className="font-bold text-sm">{pattern.name}</div>
              <div className="text-xs text-gray-400">{pattern.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* 音量控制 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 whitespace-nowrap">音量:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={drumVolume}
            onChange={(e) => setDrumVolume(Number(e.target.value))}
            className="flex-1"
            disabled={!isDrumEnabled}
          />
          <span className="text-sm font-bold w-12">{Math.round(drumVolume * 100)}%</span>
        </div>

        {/* 当前拍号显示 */}
        {isPlaying && isDrumEnabled && (
          <div className="mt-4 flex justify-center gap-2">
            {[1, 2, 3, 4].map(beat => (
              <motion.div
                key={beat}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  currentBeat === beat
                    ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-400'
                }`}
                animate={currentBeat === beat ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.2 }}
              >
                {beat}
              </motion.div>
            ))}
          </div>
        )}
      </div>



      {/* 和弦进行展示 */}
      <div className="bg-black/50 rounded-xl p-3 md:p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <h3 className="text-base md:text-lg font-semibold">和弦序列</h3>
          <div className="text-xs md:text-sm text-gray-400">共 {expandedChords.length} 小节 · 每小节 4 拍</div>
        </div>
        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          {expandedChords.map((item, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-1 md:p-3 rounded-md text-center transition-all ${
                isPlaying && index === currentChordIndex
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg transform scale-110'
                  : 'bg-white/10'
              }`}
            >
              <div className="text-[7px] md:text-xs text-gray-400 mb-0.5">#{index + 1}</div>
              <div className="text-[10px] md:text-lg font-bold">{item.chord}</div>
              <div className="text-[7px] md:text-xs text-gray-400 mt-0.5">{item.degree}</div>
              {isPlaying && index === currentChordIndex && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <ScalePractice
          selectedKey={getCurrentChordRoot}
          bluesType="minor"
          scaleNotes={getCurrentScaleNotes}
          fretboardPositions={getCurrentFretboardPositions}
        />
      {/* 倒计时动画 */}
      {countdown > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            key={countdown}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[120px] md:text-[200px] font-bold bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
          >
            {countdown}
          </motion.div>
        </motion.div>
      )}

      {/* 播放控制 */}
      <div className="bg-black/50 rounded-xl p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 max-w-[160px] px-5 py-3 rounded-xl font-bold text-base md:text-lg transition-all ${
                isPlaying || countdown > 0
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              onClick={() => {
                if (countdown > 0) {
                  // 倒计时中,点击取消
                  setCountdown(0);
                  setIsPlaying(false);
                } else if (isPlaying) {
                  // 正在播放,点击暂停
                  setIsPlaying(false);
                } else {
                  // 未播放,开始倒计时
                  setCurrentChordIndex(0);
                  setCurrentBeat(1);
                  setCountdown(3);
                }
              }}
              disabled={countdown > 0}
            >
              {countdown > 0 ? '准备中...' : isPlaying ? '⏸ 暂停' : '▶️ 播放'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 max-w-[160px] px-5 py-3 rounded-xl font-bold text-base md:text-lg bg-gray-600 hover:bg-gray-700"
              onClick={() => {
                setCountdown(0);
                setIsPlaying(false);
                setCurrentChordIndex(0);
                setCurrentBeat(1);
              }}
            >
              ⏹ 停止
            </motion.button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm md:text-base">
            <span className="text-gray-400">当前速度:</span>
            <div className="px-3 py-1.5 bg-white/10 rounded-lg">
              <span className="font-bold">{bpm} BPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* 和弦指法提示 */}
      <div className="bg-purple-500/20 rounded-xl p-4 mt-4 border border-purple-500/30">
        <h3 className="text-sm md:text-base font-semibold mb-2">🎸 练习提示</h3>
        <ul className="text-xs md:text-sm text-gray-300 space-y-1">
          <li>▸ 属七和弦通常使用 E 型或 A 型把位</li>
          <li>▸ 跟随鼓声节奏,在每拍上弹奏和弦</li>
          <li>▸ 尝试在和弦之间加入装饰音</li>
          <li>▸ 可以加入九音、十三音等延伸音增加色彩</li>
        </ul>
      </div>

      {/* 当前和弦对应的Blues纸板 */}
      <div className="mt-4 md:mt-6">
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 md:p-4 mb-4 border border-yellow-500/30">
          <h3 className="text-base md:text-xl font-bold mb-2">
            🎯 当前和弦即兴指南
          </h3>
          <p className="text-xs md:text-base text-gray-300">
            当前播放: <span className="text-yellow-400 font-bold text-lg md:text-xl">{getCurrentChordRoot}7</span> 和弦
            → 可使用 <span className="text-blue-400 font-bold">{getCurrentChordRoot} 小调 Blues</span> 音阶即兴
          </p>
          <p className="text-[10px] md:text-sm text-gray-400 mt-2">
            💡 提示: 纸板上的黄色圆点是根音位置,蓝色圆点是其他音阶音符。跟随和弦变化,在对应的音阶上即兴演奏!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChordPractice;
