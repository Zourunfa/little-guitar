import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import type { RhythmPracticeProps } from '../../types/components';

/**
 * 节奏训练组件
 */
const RhythmPractice: React.FC<RhythmPracticeProps> = ({
  rhythmPatterns,
  bpm,
  setBpm,
  isMetronomeActive,
  setIsMetronomeActive
}) => {
  const [selectedPattern, setSelectedPattern] = useState<string>('shuffle');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // 初始化鼓音色
  useEffect(() => {
    synthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.4
      }
    }).toDestination();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, []);

  // 获取当前选中的节奏模式
  const currentPattern = rhythmPatterns.find(p => p.id === selectedPattern);

  // 生成节奏序列
  const getRhythmSequence = (patternId: string): { time: string; note: string; accent: boolean }[] => {
    switch (patternId) {
      case 'shuffle':
        // Shuffle: 三连音的长-短模式
        return [
          { time: '0:0:0', note: 'C2', accent: true },
          { time: '0:0:2', note: 'C3', accent: false },
          { time: '0:1:0', note: 'C2', accent: false },
          { time: '0:1:2', note: 'C3', accent: false },
          { time: '0:2:0', note: 'C2', accent: false },
          { time: '0:2:2', note: 'C3', accent: false },
          { time: '0:3:0', note: 'C2', accent: false },
          { time: '0:3:2', note: 'C3', accent: false }
        ];
      case 'straight':
        // Straight: 均匀的四分音符
        return [
          { time: '0:0:0', note: 'C2', accent: true },
          { time: '0:1:0', note: 'C3', accent: false },
          { time: '0:2:0', note: 'C3', accent: false },
          { time: '0:3:0', note: 'C3', accent: false }
        ];
      case 'swing':
        // Swing: 摇摆节奏
        return [
          { time: '0:0:0', note: 'C2', accent: true },
          { time: '0:0:2.5', note: 'C3', accent: false },
          { time: '0:1:0', note: 'C2', accent: false },
          { time: '0:1:2.5', note: 'C3', accent: false },
          { time: '0:2:0', note: 'C2', accent: false },
          { time: '0:2:2.5', note: 'C3', accent: false },
          { time: '0:3:0', note: 'C2', accent: false },
          { time: '0:3:2.5', note: 'C3', accent: false }
        ];
      case 'syncopated':
      default:
        // Syncopated: 切分音
        return [
          { time: '0:0:0', note: 'C2', accent: true },
          { time: '0:0:2', note: 'C3', accent: false },
          { time: '0:1:1', note: 'C3', accent: false },
          { time: '0:2:0', note: 'C2', accent: false },
          { time: '0:2:2', note: 'C3', accent: false },
          { time: '0:3:1', note: 'C3', accent: false }
        ];
    }
  };

  // 播放节奏
  const playRhythm = async () => {
    if (!synthRef.current) return;

    await Tone.start();
    setIsPlaying(true);
    setCurrentBeat(0);

    Tone.Transport.bpm.value = bpm;

    const sequence = getRhythmSequence(selectedPattern);
    let beatIndex = 0;

    sequenceRef.current = new Tone.Sequence(
      (time, event) => {
        if (synthRef.current) {
          synthRef.current.triggerAttackRelease(
            event.note,
            '8n',
            time,
            event.accent ? 1 : 0.6
          );
        }
        Tone.Draw.schedule(() => {
          setCurrentBeat(beatIndex % sequence.length);
          beatIndex++;
        }, time);
      },
      sequence.map((s, i) => ({ ...s, index: i })),
      '1m'
    );

    sequenceRef.current.loop = true;
    sequenceRef.current.start(0);
    Tone.Transport.start();
  };

  // 停止播放
  const stopRhythm = () => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  // 更新 BPM
  useEffect(() => {
    if (isPlaying) {
      Tone.Transport.bpm.value = bpm;
    }
  }, [bpm, isPlaying]);

  // 切换节奏模式时停止播放
  useEffect(() => {
    if (isPlaying) {
      stopRhythm();
    }
  }, [selectedPattern]);

  // 节拍器状态变化时，同步播放节奏
  useEffect(() => {
    if (isMetronomeActive && !isPlaying) {
      playRhythm();
    } else if (!isMetronomeActive && isPlaying) {
      stopRhythm();
    }
  }, [isMetronomeActive]);

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/10">
      <h2 className="text-xl md:text-2xl font-bold mb-4">🥁 Blues 节奏训练</h2>

      {/* 节奏型选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
        {rhythmPatterns.map(pattern => (
          <motion.button
            key={pattern.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedPattern === pattern.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setSelectedPattern(pattern.id)}
          >
            <div className="font-bold text-lg mb-1">{pattern.name}</div>
            <div className="text-2xl md:text-3xl mb-2 font-mono">{pattern.pattern.join(' ')}</div>
            <div className="text-xs md:text-sm text-gray-300">{pattern.description}</div>
          </motion.button>
        ))}
      </div>

      {/* 节奏可视化和播放控制 */}
      <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 mb-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">🎵 节奏可视化</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isPlaying) {
                stopRhythm();
                setIsMetronomeActive(false);
              } else {
                playRhythm();
                setIsMetronomeActive(true);
              }
            }}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? '⏹ 停止' : '▶️ 播放节奏'}
          </motion.button>
        </div>

        {/* 节拍可视化 */}
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-4">
          {getRhythmSequence(selectedPattern).map((beat, index) => (
            <motion.div
              key={index}
              className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold transition-all ${
                isPlaying && currentBeat === index
                  ? beat.accent
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 scale-125 shadow-lg'
                    : 'bg-gradient-to-br from-blue-400 to-purple-500 scale-110 shadow-lg'
                  : beat.accent
                  ? 'bg-yellow-500/30 border-2 border-yellow-500'
                  : 'bg-blue-500/20 border border-blue-500/50'
              }`}
              animate={
                isPlaying && currentBeat === index
                  ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                  : {}
              }
              transition={{ duration: 0.2 }}
            >
              <span className="text-xs md:text-sm">
                {beat.accent ? '●' : '○'}
              </span>
            </motion.div>
          ))}
        </div>

        {/* 节奏说明 */}
        {currentPattern && (
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-sm text-gray-300">
              <span className="font-bold text-purple-400">💡 {currentPattern.name}:</span>{' '}
              {currentPattern.description}
            </div>
          </div>
        )}
      </div>

      {/* 节拍器控制 */}
      <div className="bg-black/50 rounded-xl p-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">节拍器</h3>
            {isMetronomeActive && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full animate-pulse">
                运行中
              </span>
            )}
          </div>

          {/* BPM 显示 - 与节奏同步 */}
          <motion.div
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-6 relative ${
              isMetronomeActive
                ? 'bg-gradient-to-br from-green-400 to-blue-500'
                : 'bg-gray-700'
            }`}
            animate={
              isMetronomeActive && isPlaying
                ? {
                    scale: currentBeat % 4 === 0 ? [1, 1.15, 1] : [1, 1.08, 1],
                    boxShadow: currentBeat % 4 === 0 
                      ? ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 0 20px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)']
                      : ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 0 15px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)']
                  }
                : {}
            }
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold">{bpm}</div>
              <div className="text-sm text-gray-300">BPM</div>
              {isPlaying && (
                <div className="text-xs mt-1 text-green-300">
                  {currentBeat + 1}/{getRhythmSequence(selectedPattern).length}
                </div>
              )}
            </div>
          </motion.div>

          {/* BPM 滑块 */}
          <div className="w-full max-w-md mb-6">
            <input
              type="range"
              min="40"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>慢 (40)</span>
              <span>中 (120)</span>
              <span>快 (200)</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isMetronomeActive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={() => {
              const newState = !isMetronomeActive;
              setIsMetronomeActive(newState);
              if (newState && !isPlaying) {
                playRhythm();
              } else if (!newState && isPlaying) {
                stopRhythm();
              }
            }}
          >
            {isMetronomeActive ? '⏸ 停止节拍器' : '▶️ 启动节拍器'}
          </motion.button>
          
          <p className="text-xs text-gray-400 mt-3 text-center">
            节拍器会同步播放选中的节奏模式
          </p>
        </div>
      </div>

      {/* 节奏详细说明 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shuffle 说明 */}
        <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
          <h3 className="text-sm md:text-base font-semibold mb-2">🎵 Shuffle 节奏</h3>
          <ul className="text-xs md:text-sm text-gray-300 space-y-1">
            <li>▸ 三连音的长-短模式 (2:1 比例)</li>
            <li>▸ 第一拍和第三拍为重音</li>
            <li>▸ 经典 Blues 摇摆感</li>
            <li>▸ 放松自然，不要过于机械</li>
          </ul>
        </div>

        {/* Straight 说明 */}
        <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
          <h3 className="text-sm md:text-base font-semibold mb-2">🎵 Straight 节奏</h3>
          <ul className="text-xs md:text-sm text-gray-300 space-y-1">
            <li>▸ 均匀的四分音符节奏</li>
            <li>▸ 每拍时值相等</li>
            <li>▸ 适合摇滚和流行风格</li>
            <li>▸ 强调稳定和力量感</li>
          </ul>
        </div>

        {/* Swing 说明 */}
        <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
          <h3 className="text-sm md:text-base font-semibold mb-2">🎵 Swing 节奏</h3>
          <ul className="text-xs md:text-sm text-gray-300 space-y-1">
            <li>▸ 轻松的摇摆律动</li>
            <li>▸ 比 Shuffle 更柔和</li>
            <li>▸ 适合爵士和轻快 Blues</li>
            <li>▸ 强调流畅和优雅</li>
          </ul>
        </div>

        {/* Syncopated 说明 */}
        <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
          <h3 className="text-sm md:text-base font-semibold mb-2">🎵 Syncopated 节奏</h3>
          <ul className="text-xs md:text-sm text-gray-300 space-y-1">
            <li>▸ 强调弱拍的切分音</li>
            <li>▸ 制造节奏张力</li>
            <li>▸ 适合快节奏 Blues</li>
            <li>▸ 增加音乐的动感</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RhythmPractice;
