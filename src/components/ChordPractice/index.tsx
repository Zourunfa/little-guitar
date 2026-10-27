import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import DrumKit from '../../utils/drumKit';
import Accompaniment from '../../utils/accompaniment';
import AudioBackingTrack, { type BackingTrackKey } from '../../utils/audioBackingTrack';
import ScalePractice from '../ScalePractice';
import type { ChordPracticeProps } from '../../types/components';
import type { Note, DrumPattern as DrumPatternType } from '../../types';

// 音符定义 (组件外部常量)
const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Blues音阶定义 (半音间隔)
const BLUES_INTERVALS = {
  minor: [0, 3, 5, 6, 7, 10, 12],      // 1, b3, 4, b5, 5, b7, 8
  major: [0, 2, 3, 4, 7, 9, 12],       // 1, 2, b3, 3, 5, 6, 8
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12] // 1, 2, 3, 4, 5, 6, b7, 8
};

/**
 * 和弦进行练习组件
 */
const ChordPractice: React.FC<ChordPracticeProps> = ({
  selectedKey,
  bluesType,
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
  const audioBackingTrackRef = useRef<AudioBackingTrack | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number>(1); // 当前拍号 (1-4)
  const [drumPattern, setDrumPattern] = useState<DrumPatternType>('shuffle'); // 鼓声节奏型
  const [drumVolume, setDrumVolume] = useState<number>(0.7); // 鼓声音量
  const [isDrumEnabled, setIsDrumEnabled] = useState<boolean>(true); // 是否启用鼓声
  const [countdown, setCountdown] = useState<number>(0); // 倒计时状态 (0表示不倒计时, 3/2/1表示倒计时中)
  const [isActuallyPlaying, setIsActuallyPlaying] = useState<boolean>(false); // 真正的播放状态

  // 伴奏相关状态
  const [isHarmonicaEnabled] = useState<boolean>(false); // 是否启用口琴
  const [isGuitarEnabled] = useState<boolean>(false); // 是否启用吉他
  const [harmonicaVolume] = useState<number>(0.4); // 口琴音量
  const [guitarVolume] = useState<number>(0.4); // 吉他音量

  // 音频伴奏相关状态
  const [accompanimentMode, setAccompanimentMode] = useState<'synthesized' | 'audio'>('synthesized'); // 伴奏模式
  const [audioBackingKey, setAudioBackingKey] = useState<BackingTrackKey>('A'); // 音频伴奏调性
  const [audioBackingVolume, setAudioBackingVolume] = useState<number>(0.7); // 音频伴奏音量
  const [isAudioBackingLoading, setIsAudioBackingLoading] = useState<boolean>(false); // 音频加载状态
  const [audioBackingError, setAudioBackingError] = useState<string>(''); // 音频加载错误
  const [isAudioBackingPlaying, setIsAudioBackingPlaying] = useState<boolean>(false); // 音频播放状态
  const [isPreloading, setIsPreloading] = useState<boolean>(false); // 预加载状态
  const [preloadedKeys, setPreloadedKeys] = useState<BackingTrackKey[]>([]); // 已预加载的调性

  // 初始化鼓组和伴奏
  useEffect(() => {
    drumKitRef.current = new DrumKit();
    drumKitRef.current.init();

    accompanimentRef.current = new Accompaniment();
    accompanimentRef.current.init();

    // 初始化音频伴奏并预加载
    let cancelled = false;
    const backingTrack = new AudioBackingTrack();
    audioBackingTrackRef.current = backingTrack;

    const initAudioBacking = async () => {
      try {
        await backingTrack.init();
        if (cancelled) return;
        console.log('✅ 音频伴奏初始化成功');

        // 自动预加载所有可用音频
        setIsPreloading(true);
        await backingTrack.preloadAllTracks();
        if (cancelled) return;
        const loaded = backingTrack.getPreloadedKeys();
        setPreloadedKeys(loaded);
        console.log(`✅ 预加载完成: ${loaded.join(', ')}`);
      } catch (err) {
        if (!cancelled) console.error('❌ 音频伴奏初始化或预加载失败:', err);
      } finally {
        if (!cancelled) setIsPreloading(false);
      }
    };

    initAudioBacking();

    return () => {
      cancelled = true;
      if (drumKitRef.current) {
        drumKitRef.current.dispose();
      }
      if (accompanimentRef.current) {
        accompanimentRef.current.dispose();
      }
      backingTrack.dispose();
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

  // 根据当前和弦根音和Blues类型生成对应的Blues音阶
  const getCurrentScaleNotes = useMemo(() => {
    const rootIndex = NOTES.indexOf(getCurrentChordRoot);
    const intervals = BLUES_INTERVALS[bluesType];
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  }, [getCurrentChordRoot, bluesType]);

  // 获取当前音阶的音程标记（度数）
  const getCurrentScaleDegrees = useMemo(() => {
    if (bluesType === 'minor') {
      return ['1', 'b3', '4', 'b5', '5', 'b7', '1'];
    } else if (bluesType === 'major') {
      return ['1', '2', 'b3', '3', '5', '6', '1'];
    } else if (bluesType === 'mixolydian') {
      return ['1', '2', '3', '4', '5', '6', 'b7', '1'];
    }
    // 默认返回小调
    return ['1', 'b3', '4', 'b5', '5', 'b7', '1'];
  }, [bluesType]);

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
      // 第12小节使用特殊的低音行进节奏型
      const customPattern = currentChordIndex === 11 ? '1111 4411 5415' : undefined;

      accompanimentRef.current.playGuitarBluesRhythm(
        rootNote,
        beatNumber,
        guitarVolume,
        customPattern
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

  // 加载音频伴奏（使用预加载缓存）
  const loadAudioBacking = async (key: BackingTrackKey) => {
    if (!audioBackingTrackRef.current) return;

    setIsAudioBackingLoading(true);
    setAudioBackingError('');
    setIsAudioBackingPlaying(false);

    try {
      // 检查是否已预加载
      if (audioBackingTrackRef.current.isTrackPreloaded(key)) {
        console.log(`⚡ 使用预加载的 ${key} 调音频`);
        await audioBackingTrackRef.current.loadTrack(key);
        setAudioBackingKey(key);
      } else {
        // 如果未预加载，立即加载
        console.log(`⏳ ${key} 调音频未预加载，正在加载...`);
        await audioBackingTrackRef.current.loadTrack(key);
        setAudioBackingKey(key);
        // 更新预加载列表
        const loaded = audioBackingTrackRef.current.getPreloadedKeys();
        setPreloadedKeys(loaded);
      }
      console.log(`✅ 成功加载 ${key} 调音频伴奏`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载失败';
      setAudioBackingError(errorMsg);
      console.error('❌ 加载音频伴奏失败:', err);
    } finally {
      setIsAudioBackingLoading(false);
    }
  };

  // 监听isPlaying变化，启动倒计时或停止播放
  useEffect(() => {
    if (isPlaying && !isActuallyPlaying && countdown === 0) {
      // 用户点击了播放，启动倒计时
      setCountdown(3);
      setIsPlaying(false); // 先暂停，等倒计时结束再播放
    } else if (!isPlaying && isActuallyPlaying) {
      // 用户点击了暂停或停止，重置实际播放状态
      setIsActuallyPlaying(false);
      setCountdown(0); // 清除可能正在进行的倒计时

      // 停止音频伴奏
      if (audioBackingTrackRef.current) {
        audioBackingTrackRef.current.stop();
        setIsAudioBackingPlaying(false);
        console.log('🛑 停止音频伴奏播放');
      }
    }
  }, [isPlaying, isActuallyPlaying, countdown, setIsPlaying]);

  // 倒计时逻辑 - 倒计时速度跟随节拍速度
  useEffect(() => {
    if (countdown > 0) {
      // 计算每拍的时长（毫秒）
      const msPerBeat = (60 / bpm) * 1000;

      const timer = setTimeout(async () => {
        if (countdown === 1) {
          // 倒计时结束,开始播放
          setCountdown(0);
          setIsActuallyPlaying(true);
          setIsPlaying(true);

          // 如果是音频伴奏模式，启动音频播放
          if (accompanimentMode === 'audio' && audioBackingTrackRef.current) {
            try {
              // 检查音频是否已加载
              if (!audioBackingTrackRef.current.isAudioLoaded()) {
                console.log(`⏳ 音频未加载，正在加载 ${audioBackingKey} 调伴奏...`);
                await loadAudioBacking(audioBackingKey);
              }

              // 播放音频
              audioBackingTrackRef.current.play(bpm);
              setIsAudioBackingPlaying(true);
              console.log(`🎵 开始播放 ${audioBackingKey} 调音频伴奏，速度: ${bpm} BPM`);
            } catch (err) {
              console.error('❌ 音频伴奏播放失败:', err);
              const errorMsg = err instanceof Error ? err.message : '播放失败';
              setAudioBackingError(errorMsg);
              setIsAudioBackingPlaying(false);
              setIsActuallyPlaying(false);
              setIsPlaying(false);
            }
          }
        } else {
          setCountdown(countdown - 1);
        }
      }, msPerBeat); // 使用节拍时长而不是固定的1000ms
      return () => clearTimeout(timer);
    }
  }, [countdown, setIsPlaying, accompanimentMode, bpm, audioBackingKey]);

  // 节拍控制 - 每拍触发一次鼓声和伴奏
  useEffect(() => {
    if (!isActuallyPlaying || countdown > 0) {
      setCurrentBeat(1);
      return;
    }

    const msPerBeat = (60 / bpm) * 1000;
    let beatCounter = 1;

    // 只在合成伴奏模式下播放鼓声和伴奏
    if (accompanimentMode === 'synthesized') {
      playDrum(beatCounter);
      const currentChord = expandedChords[currentChordIndex]?.chord || selectedKey;
      playAccompaniment(beatCounter, currentChord);
    }
    setCurrentBeat(beatCounter);

    const beatInterval = setInterval(() => {
      beatCounter = (beatCounter % 4) + 1; // 循环 1-4 拑
      // 只在合成伴奏模式下播放鼓声和伴奏
      if (accompanimentMode === 'synthesized') {
        playDrum(beatCounter);
        const chord = expandedChords[currentChordIndex]?.chord || selectedKey;
        playAccompaniment(beatCounter, chord);
      }
      setCurrentBeat(beatCounter);
    }, msPerBeat);

    return () => clearInterval(beatInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActuallyPlaying, bpm, drumPattern, drumVolume, isDrumEnabled, isGuitarEnabled, isHarmonicaEnabled, guitarVolume, harmonicaVolume, currentChordIndex, accompanimentMode]);

  // 小节控制 - 每4拍切换一次和弦
  useEffect(() => {
    if (!isActuallyPlaying) return;

    const beatsPerBar = 4;
    const msPerBeat = (60 / bpm) * 1000;
    const msPerBar = msPerBeat * beatsPerBar;

    const barInterval = setInterval(() => {
      setCurrentChordIndex(prev => (prev + 1) % expandedChords.length);
    }, msPerBar);

    return () => clearInterval(barInterval);
  }, [isActuallyPlaying, bpm, expandedChords.length, setCurrentChordIndex]);

  // 监听BPM变化，实时调整音频伴奏速度
  useEffect(() => {
    if (accompanimentMode === 'audio' && isActuallyPlaying && audioBackingTrackRef.current) {
      audioBackingTrackRef.current.adjustSpeed(bpm);
    }
  }, [bpm, accompanimentMode, isActuallyPlaying]);

  // 监听音频伴奏音量变化
  useEffect(() => {
    if (audioBackingTrackRef.current) {
      audioBackingTrackRef.current.setVolume(audioBackingVolume);
    }
  }, [audioBackingVolume]);

  // 监听伴奏模式切换，确保当前调性已加载
  useEffect(() => {
    if (accompanimentMode === 'audio' && audioBackingTrackRef.current) {
      const isAvailable = audioBackingTrackRef.current.isTrackAvailable(audioBackingKey);
      const isPreloaded = audioBackingTrackRef.current.isTrackPreloaded(audioBackingKey);

      // 如果调性可用但未预加载，立即加载
      if (isAvailable && !isPreloaded) {
        console.log(`🔄 切换到音频模式，${audioBackingKey} 调未预加载，正在加载...`);
        loadAudioBacking(audioBackingKey);
      } else if (isPreloaded) {
        // 如果已预加载，直接设置为当前调性
        console.log(`✅ ${audioBackingKey} 调已预加载，可直接使用`);
        loadAudioBacking(audioBackingKey);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accompanimentMode, audioBackingKey]);

  return (
    <div className="practice-panel rounded-2xl p-4 md:p-6 border border-slate-200">
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
                ? 'practice-selected shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100'
            }`}
            onClick={() => setProgression('12bar')}
          >
            <div className="font-bold text-lg">标准 12 小节 Blues</div>
            <div className="text-sm text-slate-600">经典 Blues 进行</div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all ${
              progression === 'quick'
                ? 'practice-selected shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100'
            }`}
            onClick={() => setProgression('quick')}
          >
            <div className="font-bold text-lg">快速 6 小节 Blues</div>
            <div className="text-sm text-slate-600">适合快速练习</div>
          </motion.button>
        </div>
      </div>

      {/* BPM速度控制 */}
      <div className="practice-tint rounded-xl p-3 md:p-4 mb-6 border border-emerald-200">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">⏱️ 节拍速度 (BPM)</h3>

        <div className="flex items-center gap-3 md:gap-4 mb-4">
          <div className="flex items-center gap-2 min-w-[80px] md:min-w-[100px]">
            <span className="text-xs md:text-sm font-medium">当前:</span>
            <span className="text-2xl md:text-3xl font-bold text-amber-700">{bpm}</span>
          </div>

          <div className="flex-1">
            <input
              type="range"
              min="60"
              max="180"
              step="5"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #059669 0%, #059669 ${((bpm - 60) / (180 - 60)) * 100}%, #e2e8f0 ${((bpm - 60) / (180 - 60)) * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>60</span>
              <span>120</span>
              <span>180</span>
            </div>
          </div>
        </div>

        {/* 快捷BPM按钮 */}
        <div className="mb-3">
          <div className="text-xs md:text-sm text-slate-500 mb-2">快速设置:</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[60, 80, 100, 120, 140, 160].map(speed => (
              <motion.button
                key={speed}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  bpm === speed
                    ? 'practice-highlight text-black shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
                onClick={() => setBpm(speed)}
              >
                {speed}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 节拍指示器 */}
        {isActuallyPlaying && (
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
            <span className="text-sm font-medium">当前节拍:</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(beat => (
                <div
                  key={beat}
                  className={`w-4 h-4 rounded-full transition-all duration-100 ${
                    currentBeat === beat
                      ? 'practice-highlight scale-125 shadow-sm '
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-slate-500">({currentBeat}/4)</span>
          </div>
        )}

        {/* BPM描述 */}
        <div className="mt-3 text-xs text-slate-500 text-center">
          {bpm < 80 && "🐌 慢速 - 适合初学者练习"}
          {bpm >= 80 && bpm < 120 && "🚶 中速 - 标准练习速度"}
          {bpm >= 120 && bpm < 150 && "🏃 快速 - 进阶练习"}
          {bpm >= 150 && "🚀 极速 - 专业水平挑战"}
        </div>
      </div>

      {/* 伴奏模式选择 */}
      <div className="practice-tint rounded-xl p-3 md:p-4 mb-6 border border-emerald-200">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">🎵 伴奏模式</h3>

        {/* 模式切换 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-xl text-center transition-all ${
              accompanimentMode === 'synthesized'
                ? 'practice-selected shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100'
            }`}
            onClick={() => setAccompanimentMode('synthesized')}
          >
            <div className="font-bold text-sm md:text-base">🎹 原生合成</div>
            <div className="text-xs text-slate-600">实时合成伴奏</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-xl text-center transition-all ${
              accompanimentMode === 'audio'
                ? 'practice-selected shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100'
            }`}
            onClick={() => setAccompanimentMode('audio')}
          >
            <div className="font-bold text-sm md:text-base">🎸 经典音频</div>
            <div className="text-xs text-slate-600">真实录音伴奏</div>
          </motion.button>
        </div>

        {/* 音频伴奏设置 */}
        {accompanimentMode === 'audio' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* 调性选择 */}
            <div>
              <div className="text-xs md:text-sm text-slate-500 mb-2">
                选择调性:
                {isPreloading && (
                  <span className="ml-2 text-amber-700 text-xs">
                    ⏳ 正在预加载音频...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as BackingTrackKey[]).map(key => {
                  const isAvailable = audioBackingTrackRef.current?.isTrackAvailable(key);
                  const isCurrent = audioBackingKey === key;
                  const isPreloadedKey = preloadedKeys.includes(key);

                  return (
                    <motion.button
                      key={key}
                      whileHover={isAvailable ? { scale: 1.05 } : {}}
                      whileTap={isAvailable ? { scale: 0.95 } : {}}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all relative ${
                        isCurrent && isAvailable
                          ? 'practice-selected text-slate-800 shadow-sm'
                          : isAvailable
                          ? 'bg-slate-50 hover:bg-slate-100'
                          : 'bg-slate-50 text-gray-600 cursor-not-allowed'
                      }`}
                      onClick={() => isAvailable && loadAudioBacking(key)}
                      disabled={!isAvailable || isAudioBackingLoading}
                    >
                      {key}
                      {isPreloadedKey && isAvailable && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" title="已预加载"></span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                💡 提示: 灰色按钮表示该调暂未配置音频文件，绿点表示已预加载
              </div>
            </div>

            {/* 播放状态显示 */}
            {accompanimentMode === 'audio' && (
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">音频状态:</span>
                  <div className="flex items-center gap-2">
                    {isAudioBackingLoading && (
                      <div className="flex items-center gap-2 text-amber-700">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-400 border-t-transparent"></div>
                        <span className="text-xs">加载中...</span>
                      </div>
                    )}
                    {!isAudioBackingLoading && isAudioBackingPlaying && (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs">正在播放</span>
                      </div>
                    )}
                    {!isAudioBackingLoading && !isAudioBackingPlaying && isActuallyPlaying && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                        <span className="text-xs">已停止</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 错误提示 */}
                {audioBackingError && (
                  <div className="text-sm text-red-700 bg-red-50 p-2 rounded-lg mt-2">
                    ⚠️ {audioBackingError}
                  </div>
                )}
              </div>
            )}

            {/* 音量控制 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 whitespace-nowrap">音量:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioBackingVolume}
                onChange={(e) => setAudioBackingVolume(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-bold w-12">{Math.round(audioBackingVolume * 100)}%</span>
            </div>

            {/* 说明 */}
            <div className="text-xs text-slate-500 bg-white p-3 rounded-lg">
              <div className="font-semibold mb-1">🎼 音频伴奏说明:</div>
              <ul className="space-y-1 ml-4">
                <li>• 使用真实录音的Blues伴奏</li>
                <li>• 自动根据BPM调整播放速度</li>
                <li>• 循环播放，无缝衔接</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* 鼓声节奏设置 */}
      <div className="bg-slate-50 rounded-xl p-3 md:p-4 mb-6">
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
                  ? 'practice-selected text-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
              onClick={() => setDrumPattern(pattern.id)}
              disabled={!isDrumEnabled}
            >
              <div className="font-bold text-sm">{pattern.name}</div>
              <div className="text-xs text-slate-500">{pattern.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* 音量控制 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 whitespace-nowrap">音量:</span>
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
        {isActuallyPlaying && isDrumEnabled && (
          <div className="mt-4 flex justify-center gap-2">
            {[1, 2, 3, 4].map(beat => (
              <motion.div
                key={beat}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  currentBeat === beat
                    ? 'practice-selected text-slate-800 shadow-sm'
                    : 'bg-slate-50 text-slate-500'
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
      <div className="bg-slate-50 rounded-xl p-2 md:p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm md:text-base font-semibold">和弦序列</h3>
          <div className="text-[10px] md:text-xs text-slate-500">{expandedChords.length}小节</div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {expandedChords.map((item, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`relative p-2 rounded text-center transition-all ${
                isActuallyPlaying && index === currentChordIndex
                  ? 'practice-highlight text-black shadow-md scale-105'
                  : 'bg-slate-50'
              }`}
            >
              <div className="text-[8px] text-slate-500">#{index + 1}</div>
              <div className="text-xs md:text-sm font-bold">{item.chord}</div>
              {isActuallyPlaying && index === currentChordIndex && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-100 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <ScalePractice
          selectedKey={getCurrentChordRoot}
          bluesType={bluesType}
          scaleNotes={getCurrentScaleNotes}
          scaleDegrees={getCurrentScaleDegrees}
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
            transition={{
              duration: Math.min((60 / bpm) * 0.8, 0.8) // 动画时长为一拍的80%，最长0.8秒
            }}
            className="text-[120px] md:text-[200px] font-bold text-emerald-700"
          >
            {countdown}
          </motion.div>
        </motion.div>
      )}


      {/* 和弦指法提示 */}
      <div className="bg-emerald-50 rounded-xl p-4 mt-4 border border-emerald-200">
        <h3 className="text-sm md:text-base font-semibold mb-2">🎸 练习提示</h3>
        <ul className="text-xs md:text-sm text-slate-600 space-y-1">
          <li>▸ 属七和弦通常使用 E 型或 A 型把位</li>
          <li>▸ 跟随鼓声节奏,在每拍上弹奏和弦</li>
          <li>▸ 尝试在和弦之间加入装饰音</li>
          <li>▸ 可以加入九音、十三音等延伸音增加色彩</li>
        </ul>
      </div>

      {/* 当前和弦对应的Blues纸板 */}
      <div className="mt-4 md:mt-6">
        <div className="practice-tint rounded-xl p-3 md:p-4 mb-4 border border-amber-200">
          <h3 className="text-base md:text-xl font-bold mb-2">
            🎯 当前和弦即兴指南
          </h3>
          <p className="text-xs md:text-base text-slate-600">
            当前播放: <span className="text-amber-700 font-bold text-lg md:text-xl">{getCurrentChordRoot}7</span> 和弦
            → 可使用 <span className="text-emerald-700 font-bold">{getCurrentChordRoot} 小调 Blues</span> 音阶即兴
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2">
            💡 提示: 指板上的琥珀色圆点是根音位置，绿色圆点是其他音阶音符。跟随和弦变化,在对应的音阶上即兴演奏!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChordPractice;
