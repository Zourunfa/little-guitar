import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [selectedSound, setSelectedSound] = useState<string>('synth');
  const synthRef = useRef<Tone.Synth | Tone.FMSynth | Tone.AMSynth | Tone.PluckSynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化音色
  const initSynth = (soundType: string) => {
    // 清理旧的音色
    if (synthRef.current) {
      synthRef.current.dispose();
    }

    switch (soundType) {
      case 'synth':
        // 基础合成器 - 温暖柔和
        synthRef.current = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.4,
            release: 0.8
          }
        }).toDestination();
        break;

      case 'fm':
        // FM 合成器 - 明亮清脆，类似电钢琴
        synthRef.current = new Tone.FMSynth({
          harmonicity: 3,
          modulationIndex: 10,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.3,
            release: 1
          },
          modulation: { type: 'square' },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.3,
            release: 0.5
          }
        }).toDestination();
        break;

      case 'am':
        // AM 合成器 - 丰富的泛音，类似风琴
        synthRef.current = new Tone.AMSynth({
          harmonicity: 2,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.5,
            release: 1.2
          },
          modulation: { type: 'square' },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.4,
            release: 0.8
          }
        }).toDestination();
        break;

      case 'pluck':
        // 拨弦合成器 - 类似吉他/贝斯
        synthRef.current = new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.9
        }).toDestination();
        break;

      default:
        synthRef.current = new Tone.Synth().toDestination();
    }
  };

  // 初始化音色
  useEffect(() => {
    initSynth(selectedSound);

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (partRef.current) {
        partRef.current.dispose();
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [selectedSound]);

  // 获取当前选中的节奏模式
  const currentPattern = rhythmPatterns.find(p => p.id === selectedPattern);

  // 生成节奏序列 - 返回实际播放的音符
  const getRhythmSequence = (patternId: string): { time: string; note: string; accent: boolean; beatIndex: number; subBeatIndex: number }[] => {
    switch (patternId) {
      case 'shuffle':
        // Shuffle: 三连音的第1和第3个音符响（哒～哒）
        return [
          // 第1拍
          { time: '0:0:0', note: 'G3', accent: true, beatIndex: 0, subBeatIndex: 0 },   // 响
          { time: '0:0:2', note: 'G4', accent: false, beatIndex: 0, subBeatIndex: 2 },  // 响
          // 第2拍
          { time: '0:1:0', note: 'G3', accent: false, beatIndex: 1, subBeatIndex: 0 },  // 响
          { time: '0:1:2', note: 'G4', accent: false, beatIndex: 1, subBeatIndex: 2 },  // 响
          // 第3拍
          { time: '0:2:0', note: 'G3', accent: false, beatIndex: 2, subBeatIndex: 0 },  // 响
          { time: '0:2:2', note: 'G4', accent: false, beatIndex: 2, subBeatIndex: 2 },  // 响
          // 第4拍
          { time: '0:3:0', note: 'G3', accent: false, beatIndex: 3, subBeatIndex: 0 },  // 响
          { time: '0:3:2', note: 'G4', accent: false, beatIndex: 3, subBeatIndex: 2 }   // 响
        ];
      case 'straight':
        // Straight: 每拍均匀，3个音符都响
        return [
          // 第1拍
          { time: '0:0:0', note: 'G3', accent: true, beatIndex: 0, subBeatIndex: 0 },
          { time: '0:0:1', note: 'G3', accent: false, beatIndex: 0, subBeatIndex: 1 },
          { time: '0:0:2', note: 'G3', accent: false, beatIndex: 0, subBeatIndex: 2 },
          // 第2拍
          { time: '0:1:0', note: 'G3', accent: false, beatIndex: 1, subBeatIndex: 0 },
          { time: '0:1:1', note: 'G3', accent: false, beatIndex: 1, subBeatIndex: 1 },
          { time: '0:1:2', note: 'G3', accent: false, beatIndex: 1, subBeatIndex: 2 },
          // 第3拍
          { time: '0:2:0', note: 'G3', accent: false, beatIndex: 2, subBeatIndex: 0 },
          { time: '0:2:1', note: 'G3', accent: false, beatIndex: 2, subBeatIndex: 1 },
          { time: '0:2:2', note: 'G3', accent: false, beatIndex: 2, subBeatIndex: 2 },
          // 第4拍
          { time: '0:3:0', note: 'G3', accent: false, beatIndex: 3, subBeatIndex: 0 },
          { time: '0:3:1', note: 'G3', accent: false, beatIndex: 3, subBeatIndex: 1 },
          { time: '0:3:2', note: 'G3', accent: false, beatIndex: 3, subBeatIndex: 2 }
        ];
      case 'swing':
        // Swing: 和 Shuffle 一样，第1和第3个音符响
        return [
          // 第1拍
          { time: '0:0:0', note: 'G3', accent: true, beatIndex: 0, subBeatIndex: 0 },
          { time: '0:0:2', note: 'G4', accent: false, beatIndex: 0, subBeatIndex: 2 },
          // 第2拍
          { time: '0:1:0', note: 'G3', accent: false, beatIndex: 1, subBeatIndex: 0 },
          { time: '0:1:2', note: 'G4', accent: false, beatIndex: 1, subBeatIndex: 2 },
          // 第3拍
          { time: '0:2:0', note: 'G3', accent: false, beatIndex: 2, subBeatIndex: 0 },
          { time: '0:2:2', note: 'G4', accent: false, beatIndex: 2, subBeatIndex: 2 },
          // 第4拍
          { time: '0:3:0', note: 'G3', accent: false, beatIndex: 3, subBeatIndex: 0 },
          { time: '0:3:2', note: 'G4', accent: false, beatIndex: 3, subBeatIndex: 2 }
        ];
      case 'syncopated':
      default:
        // Syncopated: 切分音
        return [
          { time: '0:0:0', note: 'G3', accent: true, beatIndex: 0, subBeatIndex: 0 },
          { time: '0:0:2', note: 'G4', accent: false, beatIndex: 0, subBeatIndex: 2 },
          { time: '0:1:1', note: 'G4', accent: false, beatIndex: 1, subBeatIndex: 1 },
          { time: '0:2:0', note: 'G3', accent: false, beatIndex: 2, subBeatIndex: 0 },
          { time: '0:2:2', note: 'G4', accent: false, beatIndex: 2, subBeatIndex: 2 },
          { time: '0:3:1', note: 'G4', accent: false, beatIndex: 3, subBeatIndex: 1 }
        ];
    }
  };

  // 获取可视化显示的所有音符（包括不响的）
  const getVisualBeats = (patternId: string): { beatIndex: number; subBeatIndex: number; shouldPlay: boolean }[] => {
    const playingNotes = getRhythmSequence(patternId);
    const allBeats: { beatIndex: number; subBeatIndex: number; shouldPlay: boolean }[] = [];
    
    // 4拍，每拍3个三连音位置
    for (let beat = 0; beat < 4; beat++) {
      for (let sub = 0; sub < 3; sub++) {
        const shouldPlay = playingNotes.some(
          note => note.beatIndex === beat && note.subBeatIndex === sub
        );
        allBeats.push({ beatIndex: beat, subBeatIndex: sub, shouldPlay });
      }
    }
    
    return allBeats;
  };

  // 播放节奏
  const playRhythm = async () => {
    if (!synthRef.current) return;

    await Tone.start();
    setIsPlaying(true);
    setCurrentBeat(0);

    Tone.Transport.bpm.value = bpm;

    const sequence = getRhythmSequence(selectedPattern);
    const visualBeats = getVisualBeats(selectedPattern);

    // 创建 Part 来播放音符
    partRef.current = new Tone.Part((time, event: any) => {
      if (synthRef.current && event) {
        // 根据节奏模式决定音符持续时间
        let duration = '8n'; // 默认：八分音符
        
        if (selectedPattern === 'shuffle' || selectedPattern === 'swing') {
          // Shuffle/Swing: 第1个音符延音长，第3个音符短促
          if (event.subBeatIndex === 0) {
            duration = '4n.'; // 附点四分音符，延音覆盖到第2个三连音
          } else {
            duration = '16n'; // 十六分音符，短促
          }
        } else if (selectedPattern === 'straight') {
          // Straight: 所有音符短促均匀
          duration = '8t'; // 三连音八分音符，短促
        } else if (selectedPattern === 'syncopated') {
          // Syncopated: 根据位置决定
          if (event.subBeatIndex === 0) {
            duration = '8n'; // 八分音符
          } else {
            duration = '16n'; // 十六分音符
          }
        } else {
          duration = '8n'; // 默认八分音符
        }
        
        synthRef.current.triggerAttackRelease(
          event.note,
          duration,
          time,
          event.accent ? 1 : 0.6
        );
      }
      
      // 在主线程更新 UI
      Tone.Draw.schedule(() => {
        if (event) {
          const visualIndex = visualBeats.findIndex(
            v => v.beatIndex === event.beatIndex && v.subBeatIndex === event.subBeatIndex
          );
          if (visualIndex !== -1) {
            setCurrentBeat(visualIndex);
          }
        }
      }, time);
    }, sequence.map(s => [s.time, s]));

    partRef.current.loop = true;
    partRef.current.loopEnd = '1m';
    partRef.current.start(0);
    
    Tone.Transport.start();
  };

  // 停止播放
  const stopRhythm = () => {
    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
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

      {/* 音色选择 */}
      <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-gray-300">🎹 选择音色</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'synth', name: '合成器', icon: '🎹', desc: '温暖柔和' },
            { id: 'fm', name: 'FM 电钢', icon: '🎼', desc: '明亮清脆' },
            { id: 'am', name: 'AM 风琴', icon: '🎺', desc: '丰富泛音' },
            { id: 'pluck', name: '拨弦', icon: '🎸', desc: '吉他贝斯' }
          ].map(sound => (
            <motion.button
              key={sound.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedSound === sound.id
                  ? 'bg-gradient-to-br from-green-500 to-teal-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              onClick={() => {
                if (isPlaying) {
                  stopRhythm();
                }
                setSelectedSound(sound.id);
              }}
            >
              <div className="text-2xl mb-1">{sound.icon}</div>
              <div className="text-xs font-bold">{sound.name}</div>
              <div className="text-xs text-gray-400">{sound.desc}</div>
            </motion.button>
          ))}
        </div>
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

        {/* 节拍可视化 - 按拍分组显示 */}
        <div className="space-y-4 mb-4">
          {[0, 1, 2, 3].map(beatIndex => {
            const visualBeats = getVisualBeats(selectedPattern);
            const beatNotes = visualBeats.filter(v => v.beatIndex === beatIndex);
            
            return (
              <div key={beatIndex} className="flex items-center gap-2">
                {/* 拍号 */}
                <div className="w-8 h-8 flex items-center justify-center font-bold text-purple-400">
                  {beatIndex + 1}
                </div>
                
                {/* 三连音可视化 */}
                <div className="flex items-center gap-1 flex-1 relative">
                  {beatNotes.map((note, subIndex) => {
                    const globalIndex = beatIndex * 3 + subIndex;
                    const isActive = isPlaying && currentBeat === globalIndex;
                    
                    // 判断是否显示延音效果
                    let showSustain = false;
                    if (selectedPattern === 'shuffle' || selectedPattern === 'swing') {
                      // Shuffle/Swing: 第2个位置显示延音
                      showSustain = subIndex === 1 && beatNotes[0].shouldPlay;
                    } else if (selectedPattern === 'straight') {
                      // Straight: 不显示延音（所有音符都响）
                      showSustain = false;
                    } else if (selectedPattern === 'syncopated') {
                      // Syncopated: 根据实际音符判断
                      const prevNote = subIndex > 0 ? beatNotes[subIndex - 1] : null;
                      showSustain = !note.shouldPlay && (prevNote?.shouldPlay || false);
                    }
                    
                    return (
                      <div key={`${beatIndex}-${subIndex}`} className="flex-1 relative">
                        <motion.div
                          className={`h-16 rounded-lg flex items-center justify-center font-bold transition-all relative overflow-hidden ${
                            isActive && note.shouldPlay
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50'
                              : note.shouldPlay
                              ? 'bg-yellow-500/30 border-2 border-yellow-400'
                              : showSustain && isActive
                              ? 'bg-yellow-500/10 border-2 border-yellow-400/50 border-dashed'
                              : showSustain
                              ? 'bg-yellow-500/5 border border-yellow-400/30 border-dashed'
                              : 'bg-gray-700/30 border border-gray-600'
                          }`}
                          animate={
                            isActive && note.shouldPlay
                              ? { 
                                  scale: [1, 1.1, 1],
                                  boxShadow: [
                                    '0 0 0 0 rgba(251, 191, 36, 0)',
                                    '0 0 0 10px rgba(251, 191, 36, 0.3)',
                                    '0 0 0 0 rgba(251, 191, 36, 0)'
                                  ]
                                }
                              : {}
                          }
                          transition={{ duration: 0.15 }}
                        >
                          {/* 延音波纹效果 */}
                          {showSustain && isActive && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-transparent"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: [0.5, 0], x: [0, 20] }}
                              transition={{ duration: 0.3, repeat: Infinity }}
                            />
                          )}
                          
                          <span className="text-2xl relative z-10">
                            {note.shouldPlay ? '●' : showSustain ? '～' : '○'}
                          </span>
                        </motion.div>
                        
                        {/* 延音连接线 */}
                        {showSustain && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 -z-10">
                            <motion.div
                              className="h-full bg-gradient-to-r from-yellow-400/50 to-yellow-400/20 rounded-full"
                              animate={isActive ? { opacity: [0.3, 0.8, 0.3] } : {}}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* 拍的说明 */}
                <div className="w-20 text-xs text-gray-400 text-right">
                  {beatIndex === 0 ? '重音拍' : `第${beatIndex + 1}拍`}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 节奏说明 */}
        <div className="bg-black/30 rounded-lg p-3 mb-2">
          <div className="text-xs text-gray-400 text-center space-y-1">
            <div>
              <span className="text-yellow-400 font-bold">●</span> = 发声击打  
              <span className="mx-2">|</span>
              <span className="text-yellow-400/60 font-bold">～</span> = 延音持续
              <span className="mx-2">|</span>
              <span className="text-gray-500">○</span> = 静音
            </div>
            <div className="text-xs text-gray-500">
              Shuffle/Swing 模式：第1个音符延续到第2个位置（虚线框表示延音区域）
            </div>
          </div>
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
            <li>▸ 均匀的三连音节奏</li>
            <li>▸ 每拍3个音，时值相等</li>
            <li>▸ 适合练习三连音感觉</li>
            <li>▸ 强调均匀和稳定</li>
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
