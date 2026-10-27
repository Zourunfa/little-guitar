import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import type { Note } from '../../types';

interface HarmonicaAccompanimentProps {
  selectedKey: Note;
  bpm: number;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
}

/**
 * 口琴伴奏组件
 * 使用 Teoria.js 生成口琴音符，Tone.js 播放
 */
const HarmonicaAccompaniment: React.FC<HarmonicaAccompanimentProps> = ({
  selectedKey,
  bpm,
  isPlaying,
  onPlayingChange
}) => {
  const [pattern, setPattern] = useState<'train' | 'shuffle' | 'wail' | 'riff'>('train');
  const [volume, setVolume] = useState<number>(-10);
  const [instrument, setInstrument] = useState<'piano' | 'guitar' | 'harmonica'>('piano');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const samplerRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // 加载乐器采样
  useEffect(() => {
    const loadInstrument = async () => {
      setIsLoading(true);

      // 清理旧的采样器
      if (samplerRef.current) {
        samplerRef.current.dispose();
      }

      try {
        if (instrument === 'piano') {
          // 钢琴音色 - 使用 AMSynth 模拟钢琴的明亮音色
          samplerRef.current = new Tone.PolySynth(Tone.AMSynth, {
            harmonicity: 3,
            oscillator: {
              type: 'sine'
            },
            envelope: {
              attack: 0.001,
              decay: 0.2,
              sustain: 0.3,
              release: 0.8
            },
            modulation: {
              type: 'square'
            },
            modulationEnvelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 0,
              release: 0.1
            }
          }).toDestination();

          samplerRef.current.volume.value = volume;
          setIsLoading(false);
          console.log('✅ 钢琴音色加载成功！');
          return;
        } else if (instrument === 'guitar') {
          // 吉他音色 - 使用 MembraneSynth 模拟拨弦的打击感
          samplerRef.current = new Tone.PolySynth(Tone.MembraneSynth, {
            pitchDecay: 0.05,
            octaves: 6,
            oscillator: {
              type: 'triangle'
            },
            envelope: {
              attack: 0.001,
              decay: 0.4,
              sustain: 0.01,
              release: 1.4
            }
          }).toDestination();

          samplerRef.current.volume.value = volume;
          setIsLoading(false);
          console.log('✅ 吉他音色加载成功！');
          return;
        } else {
          // 口琴音色 - 使用 FMSynth 模拟簧片振动
          samplerRef.current = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 2.5,
            modulationIndex: 12,
            oscillator: {
              type: 'square'
            },
            envelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.6,
              release: 0.4
            },
            modulation: {
              type: 'triangle'
            },
            modulationEnvelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.3,
              release: 0.2
            }
          }).toDestination();

          samplerRef.current.volume.value = volume;
          setIsLoading(false);
          console.log('✅ 口琴音色加载成功！');
          return;
        }
      } catch (error) {
        console.error('初始化乐器失败:', error);
        setIsLoading(false);
      }
    };

    loadInstrument();

    return () => {
      if (samplerRef.current) {
        samplerRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, [instrument]);

  // 更新音量
  useEffect(() => {
    if (samplerRef.current) {
      samplerRef.current.volume.value = volume;
    }
  }, [volume]);

  /**
   * 使用 Teoria.js 生成口琴音符模式
   */
  const generateHarmonicaPattern = (key: Note, patternType: string): string[] => {
    try {
      // 音符映射表
      const notes: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = notes.indexOf(key);

      // 根据半音间隔计算音符
      const getNoteFromInterval = (semitones: number, octave: number = 3): string => {
        const noteIndex = (rootIndex + semitones) % 12;
        const octaveShift = Math.floor((rootIndex + semitones) / 12);
        return notes[noteIndex] + (octave + octaveShift);
      };

      const I = key + '3';

      switch (patternType) {
        case 'train': {
          // 火车节奏：I - IV - I - V 的低音行进
          const IV = getNoteFromInterval(5);  // 纯四度 = 5 半音
          const V = getNoteFromInterval(7);   // 纯五度 = 7 半音
          return [I, I, IV, IV, I, I, V, I];
        }

        case 'shuffle': {
          // Shuffle 节奏：使用三度和五度
          const third = getNoteFromInterval(4);  // 大三度 = 4 半音
          const fifth = getNoteFromInterval(7);  // 纯五度 = 7 半音
          return [I, third, fifth, third, I, third, fifth, I];
        }

        case 'wail': {
          // 哀鸣风格：使用小三度和大三度交替（Blues 特色）
          const minorThird = getNoteFromInterval(3);  // 小三度 = 3 半音
          const majorThird = getNoteFromInterval(4);  // 大三度 = 4 半音
          const fifth = getNoteFromInterval(7);       // 纯五度 = 7 半音
          return [I, minorThird, majorThird, fifth, majorThird, minorThird, I, I];
        }

        case 'riff': {
          // Riff 风格：使用五声音阶
          const minorThird = getNoteFromInterval(3);   // 小三度 = 3 半音
          const fourth = getNoteFromInterval(5);       // 纯四度 = 5 半音
          const fifth = getNoteFromInterval(7);        // 纯五度 = 7 半音
          const minorSeventh = getNoteFromInterval(10); // 小七度 = 10 半音
          return [I, minorThird, fourth, fifth, minorSeventh, fifth, fourth, I];
        }

        default:
          return [I];
      }
    } catch (error) {
      console.error('生成口琴音符失败:', error);
      // 降级方案：返回简单的根音模式
      return [selectedKey + '3'];
    }
  };

  /**
   * 播放伴奏
   */
  const playHarmonica = async () => {
    if (!samplerRef.current || isLoading) {
      console.warn('乐器音色尚未加载完成');
      return;
    }

    await Tone.start();
    onPlayingChange(true);

    // 生成音符模式
    const notes = generateHarmonicaPattern(selectedKey, pattern);
    console.log('🎵 播放音符:', notes);

    // 设置速度
    Tone.Transport.bpm.value = bpm;

    // 创建循环序列
    let noteIndex = 0;
    sequenceRef.current = new Tone.Sequence(
      (time) => {
        const note = notes[noteIndex % notes.length];

        // 使用 Tone.js 播放
        if (samplerRef.current) {
          samplerRef.current.triggerAttackRelease(note, '4n', time);
        }

        noteIndex++;
      },
      Array.from({ length: notes.length }, (_, i) => i),
      '4n' // 每个音符持续四分音符
    );

    sequenceRef.current.loop = true;
    sequenceRef.current.start(0);
    Tone.Transport.start();
    console.log(`▶️ ${instrument} 伴奏已启动`);
  };

  /**
   * 停止播放
   */
  const stopHarmonica = () => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    onPlayingChange(false);
  };

  // 监听外部播放状态变化
  useEffect(() => {
    if (!isPlaying && sequenceRef.current) {
      stopHarmonica();
    }
  }, [isPlaying]);

  // 模式描述
  const patternDescriptions = {
    train: '火车节奏 - 经典的 I-IV-V 低音行进，模拟火车的律动感',
    shuffle: 'Shuffle 节奏 - 使用三度和五度，营造摇摆感',
    wail: '哀鸣风格 - 大小三度交替，Blues 的灵魂',
    riff: 'Riff 风格 - 五声音阶跑动，适合快节奏'
  };

  return (
    <div className="practice-tint rounded-xl p-4 md:p-6 border border-emerald-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {instrument === 'piano' ? '🎹' : instrument === 'guitar' ? '🎸' : '🎺'}
          </span>
          <div>
            <h3 className="text-lg md:text-xl font-bold">乐器伴奏</h3>
            <p className="text-xs text-slate-500">
              {isLoading ? '⏳ 加载中...' : `✅ ${instrument === 'piano' ? '钢琴' : instrument === 'guitar' ? '吉他' : '口琴'}音色`}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => (isPlaying ? stopHarmonica() : playHarmonica())}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${
            isLoading
              ? 'bg-slate-300 cursor-not-allowed text-slate-800'
              : isPlaying
              ? 'practice-danger text-slate-800'
              : 'bg-emerald-100 hover:bg-emerald-200 text-slate-800'
          }`}
        >
          {isLoading ? '⏳ 加载中' : isPlaying ? '⏹️ 停止' : '▶️ 播放'}
        </motion.button>
      </div>

      {/* 乐器选择 */}
      <div className="mb-4">
        <label className="text-sm text-slate-500 mb-2 block">选择乐器</label>
        <div className="grid grid-cols-3 gap-2">
          {(['piano', 'guitar', 'harmonica'] as const).map((inst) => (
            <motion.button
              key={inst}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInstrument(inst);
                if (isPlaying) {
                  stopHarmonica();
                }
              }}
              className={`p-3 rounded-lg text-center transition-all ${
                instrument === inst
                  ? 'practice-selected text-slate-800 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div className="text-2xl mb-1">
                {inst === 'piano' ? '🎹' : inst === 'guitar' ? '🎸' : '🎺'}
              </div>
              <div className="text-xs font-bold">
                {inst === 'piano' ? '钢琴' : inst === 'guitar' ? '吉他' : '口琴'}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 当前设置 */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">调式：</span>
            <span className="font-bold text-amber-700">{selectedKey}</span>
          </div>
          <div>
            <span className="text-slate-500">速度：</span>
            <span className="font-bold text-amber-700">{bpm} BPM</span>
          </div>
        </div>
      </div>

      {/* 模式选择 */}
      <div className="mb-4">
        <label className="text-sm text-slate-500 mb-2 block">选择伴奏模式</label>
        <div className="grid grid-cols-2 gap-2">
          {(['train', 'shuffle', 'wail', 'riff'] as const).map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setPattern(p);
                if (isPlaying) {
                  stopHarmonica();
                  setTimeout(() => playHarmonica(), 100);
                }
              }}
              className={`p-3 rounded-lg text-left transition-all ${
                pattern === p
                  ? 'practice-selected text-slate-800 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div className="font-bold text-sm capitalize">{p}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 模式说明 */}
      <div className="bg-emerald-50 rounded-lg p-3 mb-4 border border-emerald-200">
        <p className="text-xs text-slate-600">
          <span className="font-bold text-emerald-700">💡 {pattern}:</span>{' '}
          {patternDescriptions[pattern]}
        </p>
      </div>

      {/* 音量控制 */}
      <div>
        <label className="text-sm text-slate-500 mb-2 block">
          音量：{volume} dB
        </label>
        <input
          type="range"
          min="-30"
          max="0"
          step="1"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #059669 0%, #059669 ${((volume + 30) / 30) * 100}%, #e2e8f0 ${((volume + 30) / 30) * 100}%, #e2e8f0 100%)`
          }}
        />
      </div>

      {/* 使用说明 */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <h4 className="text-sm font-semibold mb-2 text-amber-700">🎓 使用技巧</h4>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• 🎹 <strong>钢琴</strong>：AM 合成，明亮清脆的钢琴音色</li>
          <li>• 🎸 <strong>吉他</strong>：Membrane 合成，模拟拨弦打击感</li>
          <li>• 🎺 <strong>口琴</strong>：FM 合成，模拟簧片振动</li>
          <li>• 伴奏会循环播放，适合练习即兴演奏</li>
          <li>• 不同模式适合不同的 Blues 风格</li>
        </ul>
      </div>
    </div>
);
};

export default HarmonicaAccompaniment;
