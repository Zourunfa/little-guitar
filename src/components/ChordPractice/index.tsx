import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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
  setSelectedKey,
  bluesType,
  progression,
  setProgression,
  chordProgressions,
  isPlaying,
  setIsPlaying,
  currentChordIndex,
  setCurrentChordIndex,
  bpm,
  setBpm,
  customConfig,
  setCustomConfig
}) => {
  const drumKitRef = useRef<DrumKit | null>(null);
  const accompanimentRef = useRef<Accompaniment | null>(null);
  const audioBackingTrackRef = useRef<AudioBackingTrack | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number>(1); // 当前拍号 (1-4 或更多)
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
  const [loadingProgress, setLoadingProgress] = useState<number>(0); // 加载进度 0-100
  const [loadingKeyName, setLoadingKeyName] = useState<string>(''); // 正在加载的调名
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false); // 抽屉是否打开
  const [selectedKeyForDrawer, setSelectedKeyForDrawer] = useState<BackingTrackKey>('A'); // 当前选择的调

  // 获取当前进行的配置
  const currentProgressionConfig = chordProgressions[progression]?.config || { beatsPerBar: 4, beatSubdivision: 4 };
  const beatsPerBar = currentProgressionConfig.beatsPerBar;

  // 初始化鼓组和伴奏
  useEffect(() => {
    drumKitRef.current = new DrumKit();
    drumKitRef.current.init();
    
    accompanimentRef.current = new Accompaniment();
    accompanimentRef.current.init();
    
    // 初始化音频伴奏并预加载
    const initAudioBacking = async () => {
      audioBackingTrackRef.current = new AudioBackingTrack();
      try {
        await audioBackingTrackRef.current.init();
        console.log('✅ 音频伴奏初始化成功');

        // 智能预加载：优先当前调 + 常用调(A, E, G)
        setIsPreloading(true);
        setLoadingKeyName('预加载音频');
        setLoadingProgress(0);

        // 设置缓存大小限制（30MB）
        audioBackingTrackRef.current.setMaxCacheSize(30);

        // 智能预加载所有音频，带实时进度反馈和优先级控制
        const priorityKeys: BackingTrackKey[] = [selectedKey, 'A', 'E', 'G'];
        await audioBackingTrackRef.current.preloadAllTracks(
          (progress, currentKey) => {
            setLoadingProgress(progress);
            if (currentKey) {
              setLoadingKeyName(`${currentKey} 调`);
            }

            // 实时更新已加载的调性列表
            const loaded = audioBackingTrackRef.current!.getPreloadedKeys();
            setPreloadedKeys(loaded);
          },
          priorityKeys,
          2 // 并发加载2个文件
        );

        const loaded = audioBackingTrackRef.current.getPreloadedKeys();
        setPreloadedKeys(loaded);
        
        // 显示缓存统计
        const stats = audioBackingTrackRef.current.getCacheStats();
        console.log(`✅ 预加载完成: ${loaded.join(', ')}`);
        console.log(`📊 缓存: ${stats.itemCount}个文件, ${stats.totalSizeMB.toFixed(2)}MB, 使用率${(stats.usage * 100).toFixed(1)}%`);
      } catch (err) {
        console.error('❌ 音频伴奏初始化或预加载失败:', err);
      } finally {
        setIsPreloading(false);
        setLoadingKeyName('');
      }
    };
    
    initAudioBacking();

    return () => {
      if (drumKitRef.current) {
        drumKitRef.current.dispose();
      }
      if (accompanimentRef.current) {
        accompanimentRef.current.dispose();
      }
      if (audioBackingTrackRef.current) {
        audioBackingTrackRef.current.dispose();
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
    const progressionData = chordProgressions[progression];
    if (!progressionData) return expanded;
    
    progressionData.sections.forEach(section => {
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
        drumKitRef.current.playBluesShuffle(beatNumber, drumVolume, beatsPerBar);
        break;
      case 'standard':
        drumKitRef.current.playStandardBeat(beatNumber, drumVolume, beatsPerBar);
        break;
      case 'slow':
        drumKitRef.current.playSlowBlues(beatNumber, drumVolume, beatsPerBar);
        break;
      default:
        drumKitRef.current.playBluesShuffle(beatNumber, drumVolume, beatsPerBar);
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
    setLoadingKeyName(`${key} 调`);
    setLoadingProgress(0);

    try {
      // 检查是否已预加载
      if (audioBackingTrackRef.current.isTrackPreloaded(key)) {
        console.log(`⚡ 使用预加载的 ${key} 调音频`);
        setLoadingProgress(50);
        await audioBackingTrackRef.current.loadTrack(key);
        setLoadingProgress(100);
        setAudioBackingKey(key);
      } else {
        // 如果未预加载，立即加载
        console.log(`⏳ ${key} 调音频未预加载，正在加载...`);
        setLoadingProgress(30);
        await audioBackingTrackRef.current.loadTrack(key);
        setLoadingProgress(100);
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
      setLoadingKeyName('');
    }
  };
  
  // 获取项目中可用的音频文件列表 - 按调性分类
  const getAvailableAudioFiles = (key: BackingTrackKey) => {
    // 定义所有调的音频文件配置（从对应文件夹中读取）
    const audioFilesByKey: Record<BackingTrackKey, Array<{ 
      name: string; 
      url: string; 
      bpm: number; 
      description?: string;
      startOffset?: number; // 音频起始偏移时间（秒）
      loopStart?: number; // 循环起始点（秒）
      loopEnd?: number; // 循环结束点（秒）
    }>> = {
      //startOffset: 音频文件循环开始节点 loopEnd: 音频文件循环结束节点 保证每一次循环都遵循12小节循环
      'A': [
        { name: 'A 调 Blues 伴奏 2', url: `/blues-mp3/A/A2.mp4`, bpm: 105, description: 'Blues 风格变奏', startOffset: 6.5, loopEnd: 62 },
        // 可以添加更多 A 调的音频,只需放到 public/blues-mp3/A/ 文件夹下
      ],
      'A#': [
        // { name: 'A# 调 Blues 伴奏', url: '/blues-mp3/A#/A#.mp3', bpm: 120 },
      ],
      'B': [
        // 可以添加更多 B 调的音频
      ],
      'C': [
        // { name: 'C 调 Blues 伴奏', url: '/blues-mp3/C/C.mp3', bpm: 120 },
        // { name: 'C 调 Funk 伴奏', url: '/blues-mp3/C/C-funk.mp3', bpm: 110 },
      ],
      'C#': [
        // { name: 'C# 调 Blues 伴奏', url: '/blues-mp3/C#/C#.mp3', bpm: 120 },
      ],
      'D': [
        // { name: 'D 调 Blues 伴奏', url: '/blues-mp3/D/D.mp3', bpm: 120 },
      ],
      'D#': [
        // { name: 'D# 调 Blues 伴奏', url: '/blues-mp3/D#/D#.mp3', bpm: 120 },
      ],
      'E': [
        { name: 'E 调 Blues 伴奏', url: `/blues-mp3/E/E1.mp4`, bpm: 90, description: '经典 12 小节 Blues', startOffset: 7.5 ,loopEnd: 72},
      ],
      'F': [
        // { name: 'F 调 Blues 伴奏', url: '/blues-mp3/F/F.mp3', bpm: 120 },
      ],
      'F#': [
        // { name: 'F# 调 Blues 伴奏', url: '/blues-mp3/F#/F#.mp3', bpm: 120 },
      ],
      'G': [
        // { name: 'G 调 Blues 伴奏', url: '/blues-mp3/G/G.mp3', bpm: 120 },
      ],
      'G#': [
        // { name: 'G# 调 Blues 伴奏', url: '/blues-mp3/G#/G#.mp3', bpm: 120 },
      ],
    };

    // 返回指定调的音频文件列表
    return audioFilesByKey[key] || [];
  };
  
  // 从URL加载音频
  const handleSelectAudioFromUrl = async (
    key: BackingTrackKey, 
    url: string, 
    bpm?: number,
    startOffset?: number,
    loopStart?: number,
    loopEnd?: number
  ) => {
    if (!audioBackingTrackRef.current) return;

    setIsDrawerOpen(false);
    setIsAudioBackingLoading(true);
    setAudioBackingError('');
    setLoadingKeyName(`${key} 调`);
    setLoadingProgress(0);

    try {
      console.log(`🔄 开始加载音频: ${url}`);
      setLoadingProgress(10);

      // 先更新该调的配置（URL、BPM 和其他参数）
      audioBackingTrackRef.current.updateTrackConfig(key, {
        url: url,
        originalBPM: bpm || 120,
        startOffset: startOffset,
        loopStart: loopStart,
        loopEnd: loopEnd,
      });
      setLoadingProgress(30);

      // 使用 loadTrack 方法加载（会设置 audioBuffer 和 currentKey）
      await audioBackingTrackRef.current.loadTrack(key);
      setLoadingProgress(100);

      // 更新预加载列表
      const loaded = audioBackingTrackRef.current.getPreloadedKeys();
      setPreloadedKeys(loaded);
      setAudioBackingKey(key);

      console.log(`✅ 成功加载音频: ${url}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载失败';
      setAudioBackingError(errorMsg);
      console.error('❌ 加载音频失败:', err);
    } finally {
      setIsAudioBackingLoading(false);
      setLoadingKeyName('');
    }
  };

  // 监听抽屉打开，如果有音频文件且未加载，自动选择第一个
  useEffect(() => {
    if (isDrawerOpen) {
      const availableFiles = getAvailableAudioFiles(selectedKeyForDrawer);

      // 如果有可用音频文件，且该调未预加载，自动加载第一个音频
      if (availableFiles.length > 0 && !preloadedKeys.includes(selectedKeyForDrawer)) {
        const firstAudio = availableFiles[0];
        console.log(`💡 ${selectedKeyForDrawer} 调有可用音频，自动加载第一个: ${firstAudio.name}`);
        // 延迟100ms自动加载，让用户看到抽屉内容
        setTimeout(() => {
          handleSelectAudioFromUrl(
            selectedKeyForDrawer, 
            firstAudio.url, 
            firstAudio.bpm,
            firstAudio.startOffset,
            firstAudio.loopStart,
            firstAudio.loopEnd
          );
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen, selectedKeyForDrawer]);
  
  // 监听isPlaying变化，启动倒计时或停止播放
  useEffect(() => {
    if (isPlaying && !isActuallyPlaying && countdown === 0) {
      // 检查音频模式下是否有可用音频
      if (accompanimentMode === 'audio') {
        const isAvailable = audioBackingTrackRef.current?.isTrackAvailable(audioBackingKey);
        const isPreloaded = audioBackingTrackRef.current?.isTrackPreloaded(audioBackingKey);
        
        if (!isAvailable) {
          setIsPlaying(false);
          alert(`❌ ${audioBackingKey} 调暂无音频文件，请选择其他调或上传本地音频！`);
          return;
        }
        
        if (!isPreloaded && !isAudioBackingLoading) {
          setIsPlaying(false);
          alert(`⏳ ${audioBackingKey} 调音频未加载，请稍候...`);
          // 自动开始加载
          loadAudioBacking(audioBackingKey);
          return;
        }
        
        if (isAudioBackingLoading) {
          setIsPlaying(false);
          alert('⏳ 音频正在加载中，请稍候...');
          return;
        }
      }
      
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
      beatCounter = (beatCounter % beatsPerBar) + 1; // 循环 1-beatsPerBar
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
  }, [isActuallyPlaying, bpm, drumPattern, drumVolume, isDrumEnabled, isGuitarEnabled, isHarmonicaEnabled, guitarVolume, harmonicaVolume, currentChordIndex, accompanimentMode, beatsPerBar]);

  // 小节控制 - 根据 beatsPerBar 切换和弦
  useEffect(() => {
    if (!isActuallyPlaying) return;

    const msPerBeat = (60 / bpm) * 1000;
    const msPerBar = msPerBeat * beatsPerBar;

    const barInterval = setInterval(() => {
      setCurrentChordIndex(prev => (prev + 1) % expandedChords.length);
    }, msPerBar);

    return () => clearInterval(barInterval);
  }, [isActuallyPlaying, bpm, expandedChords.length, setCurrentChordIndex, beatsPerBar]);
  
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
  
  // 监听伴奏模式切换，自动加载默认音频
  useEffect(() => {
    if (accompanimentMode === 'audio' && audioBackingTrackRef.current) {
      const isPreloaded = audioBackingTrackRef.current.isTrackPreloaded(audioBackingKey);
      
      // 如果当前调性未预加载，自动加载该调的第一个音频文件
      if (!isPreloaded) {
        const availableFiles = getAvailableAudioFiles(audioBackingKey);
        
        if (availableFiles.length > 0) {
          const firstAudio = availableFiles[0];
          console.log(`🔄 切换到音频模式，自动加载 ${audioBackingKey} 调的第一个音频: ${firstAudio.name}`);
          
          // 自动加载第一个音频
          handleSelectAudioFromUrl(
            audioBackingKey,
            firstAudio.url,
            firstAudio.bpm,
            firstAudio.startOffset,
            firstAudio.loopStart,
            firstAudio.loopEnd
          );
        } else {
          console.warn(`⚠️ ${audioBackingKey} 调暂无可用音频文件`);
        }
      } else {
        console.log(`✅ ${audioBackingKey} 调已预加载，可直接使用`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accompanimentMode]);

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/10">
      <h2 className="text-xl md:text-2xl font-bold mb-4">🎹 {selectedKey} Blues 和弦进行</h2>

      {/* 和弦进行选择 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">选择进行类型</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <div className="text-xs text-gray-400 mt-1">4/4 拍</div>
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
            <div className="text-xs text-gray-400 mt-1">4/4 拍</div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all ${
              progression === '12bar-12beats'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setProgression('12bar-12beats')}
          >
            <div className="font-bold text-lg">12 拍 Blues</div>
            <div className="text-sm text-gray-300">12/8 拍号</div>
            <div className="text-xs text-gray-400 mt-1">八分音符</div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all ${
              progression === 'custom'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setProgression('custom')}
          >
            <div className="font-bold text-lg">自定义设置</div>
            <div className="text-sm text-gray-300">自由配置拍号</div>
            <div className="text-xs text-gray-400 mt-1">
              {customConfig ? `${customConfig.beatsPerBar}/${customConfig.beatSubdivision}` : '点击设置'}
            </div>
          </motion.button>
        </div>
      </div>

      {/* 自定义配置面板 */}
      {progression === 'custom' && setCustomConfig && customConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
        >
          <h3 className="text-lg font-semibold mb-4">⚙️ 自定义拍号设置</h3>
          
          {/* 每小节拍数 */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              每小节拍数: <span className="text-yellow-400 text-xl font-bold">{customConfig.beatsPerBar}</span> 拍
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="16"
                step="1"
                value={customConfig.beatsPerBar}
                onChange={(e) => setCustomConfig({
                  ...customConfig,
                  beatsPerBar: parseInt(e.target.value)
                })}
                className="flex-1 h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((customConfig.beatsPerBar - 3) / (16 - 3)) * 100}%, rgba(255,255,255,0.2) ${((customConfig.beatsPerBar - 3) / (16 - 3)) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3 拍</span>
              <span>8 拍</span>
              <span>16 拍</span>
            </div>
          </div>

          {/* 音符细分 */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              音符细分: <span className="text-yellow-400 text-xl font-bold">{customConfig.beatSubdivision === 4 ? '四分音符' : customConfig.beatSubdivision === 8 ? '八分音符' : '十六分音符'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 4, name: '四分音符', symbol: '♪' },
                { value: 8, name: '八分音符', symbol: '♫' },
                { value: 16, name: '十六分音符', symbol: '♬' }
              ].map(option => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-lg text-center transition-all ${
                    customConfig.beatSubdivision === option.value
                      ? 'bg-yellow-500 text-black shadow-lg'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => setCustomConfig({
                    ...customConfig,
                    beatSubdivision: option.value
                  })}
                >
                  <div className="text-2xl mb-1">{option.symbol}</div>
                  <div className="text-xs font-medium">{option.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 拍号预览 */}
          <div className="bg-black/30 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">当前拍号:</div>
            <div className="text-3xl font-bold text-center text-yellow-400">
              {customConfig.beatsPerBar}/{customConfig.beatSubdivision}
            </div>
            <div className="text-xs text-gray-400 text-center mt-2">
              {customConfig.beatsPerBar === 12 && customConfig.beatSubdivision === 8 && '经典 12/8 Blues 节奏'}
              {customConfig.beatsPerBar === 4 && customConfig.beatSubdivision === 4 && '标准 4/4 拍'}
              {customConfig.beatsPerBar === 3 && customConfig.beatSubdivision === 4 && '华尔兹 3/4 拍'}
              {customConfig.beatsPerBar === 6 && customConfig.beatSubdivision === 8 && '复合 6/8 拍'}
            </div>
          </div>
        </motion.div>
      )}

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
        {isActuallyPlaying && (
          <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg">
            <span className="text-sm font-medium">当前节拍:</span>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: beatsPerBar }, (_, i) => i + 1).map(beat => (
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
            <span className="text-sm text-gray-400">({currentBeat}/{beatsPerBar})</span>
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

      {/* 音频加载进度条 */}
      {(isAudioBackingLoading || isPreloading) && loadingKeyName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-yellow-400">
              🎵 {loadingKeyName}加载中...
            </h3>
            <span className="text-2xl font-bold text-yellow-400">{loadingProgress}%</span>
          </div>
          <div className="relative h-4 bg-black/50 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-300">⚠️ 请等待音频加载完成后再播放</p>
            {isPreloading && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 border border-red-500/30"
                onClick={() => {
                  if (audioBackingTrackRef.current) {
                    audioBackingTrackRef.current.cancelPreload();
                    setIsPreloading(false);
                    setLoadingKeyName('');
                  }
                }}
              >
                取消预加载
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* 缓存统计信息 */}
      {accompanimentMode === 'audio' && audioBackingTrackRef.current && preloadedKeys.length > 0 && !isPreloading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-green-400">
              💾 音频缓存
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-300">
                {(() => {
                  const stats = audioBackingTrackRef.current?.getCacheStats();
                  return stats ? `${stats.itemCount}个 | ${stats.totalSizeMB.toFixed(1)}MB / ${stats.maxSizeMB}MB` : '';
                })()}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-400 border border-red-500/30"
                onClick={() => {
                  if (audioBackingTrackRef.current) {
                    audioBackingTrackRef.current.clearPreloadCache();
                    setPreloadedKeys([]);
                  }
                }}
              >
                清空
              </motion.button>
            </div>
          </div>
          
          {/* 缓存使用率进度条 */}
          {(() => {
            const stats = audioBackingTrackRef.current?.getCacheStats();
            if (!stats) return null;
            
            return (
              <div className="mb-3">
                <div className="relative h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                      stats.usage > 0.9 ? 'bg-red-500' : stats.usage > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stats.usage * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{(stats.usage * 100).toFixed(1)}% 使用</span>
                  <span>{stats.usage > 0.8 && '⚠️ 接近限制'}</span>
                </div>
              </div>
            );
          })()}

          {/* 缓存项列表 */}
          <div className="grid grid-cols-6 gap-2">
            {(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as BackingTrackKey[]).map(key => {
              const isPreloadedKey = preloadedKeys.includes(key);
              const isCurrent = audioBackingKey === key;
              const stats = audioBackingTrackRef.current?.getCacheStats();
              const item = stats?.items.find(i => i.key === key);
              
              return (
                <div
                  key={key}
                  className={`relative px-2 py-1 rounded text-center text-sm font-medium transition-all ${
                    isCurrent && isPreloadedKey
                      ? 'bg-green-500 text-white shadow-lg'
                      : isPreloadedKey
                      ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                      : 'bg-gray-700/30 text-gray-500'
                  }`}
                  title={isPreloadedKey && item ? `访问${item.accessCount}次 | ${item.sizeMB.toFixed(1)}MB` : '未缓存'}
                >
                  {key}
                  {isPreloadedKey && item && item.accessCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      {item.accessCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
            <span>🟢 已缓存 | ⚫ 未缓存 | 🔵 访问次数</span>
          </div>
        </motion.div>
      )}

      {/* 伴奏模式选择 */}
      <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl p-3 md:p-4 mb-6 border border-orange-500/30">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">🎵 伴奏模式</h3>
        
        {/* 模式切换 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-xl text-center transition-all ${
              accompanimentMode === 'synthesized'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setAccompanimentMode('synthesized')}
          >
            <div className="font-bold text-sm md:text-base">🎹 原生合成</div>
            <div className="text-xs text-gray-300">实时合成伴奏</div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-xl text-center transition-all ${
              accompanimentMode === 'audio'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setAccompanimentMode('audio')}
          >
            <div className="font-bold text-sm md:text-base">🎸 经典音频</div>
            <div className="text-xs text-gray-300">真实录音伴奏</div>
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
              <div className="text-xs md:text-sm text-gray-400 mb-2">
                选择调性:
                {isPreloading && (
                  <span className="ml-2 text-yellow-400 text-xs">
                    ⏳ 正在预加载音频...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as BackingTrackKey[]).map(key => {
                  const isCurrent = audioBackingKey === key;
                  const isPreloadedKey = preloadedKeys.includes(key);
                  const hasAudio = getAvailableAudioFiles(key).length > 0; // 检查是否有可用音频
                  
                  return (
                    <motion.button
                      key={key}
                      whileHover={hasAudio ? { scale: 1.05 } : {}}
                      whileTap={hasAudio ? { scale: 0.95 } : {}}
                      className={`w-full px-2 py-2 rounded-lg text-sm font-medium transition-all relative ${
                        !hasAudio
                          ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed opacity-50'
                          : isCurrent
                          ? 'bg-pink-500 text-white shadow-lg'
                          : isPreloadedKey
                          ? 'bg-green-500/30 hover:bg-green-500/40 border border-green-500/50'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={() => {
                        if (hasAudio) {
                          // 同步更新和弦进行的调性
                          setSelectedKey(key as Note);
                          // 打开抽屉让用户选择音频
                          setSelectedKeyForDrawer(key);
                          setIsDrawerOpen(true);
                        }
                      }}
                      disabled={isAudioBackingLoading || !hasAudio}
                      title={!hasAudio ? '暂无可用音频' : ''}
                    >
                      {key}
                      {isPreloadedKey && hasAudio && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" title="已加载"></span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                💡 提示: 点击调式按钮选择音频文件 | 绿点=已加载 | 灰色=暂无音频
              </div>
            </div>

            {/* 播放状态显示 */}
            {accompanimentMode === 'audio' && (
              <div className="bg-black/30 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">音频状态:</span>
                  <div className="flex items-center gap-2">
                    {isAudioBackingLoading && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-400 border-t-transparent"></div>
                        <span className="text-xs">加载中...</span>
                      </div>
                    )}
                    {!isAudioBackingLoading && isAudioBackingPlaying && (
                      <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs">正在播放</span>
                      </div>
                    )}
                    {!isAudioBackingLoading && !isAudioBackingPlaying && isActuallyPlaying && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs">已停止</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 错误提示 */}
                {audioBackingError && (
                  <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-lg mt-2">
                    ⚠️ {audioBackingError}
                  </div>
                )}
              </div>
            )}

            {/* 音量控制 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 whitespace-nowrap">音量:</span>
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
            <div className="text-xs text-gray-400 bg-black/30 p-3 rounded-lg">
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
        {isActuallyPlaying && isDrumEnabled && (
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
      <div className="bg-black/50 rounded-xl p-2 md:p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm md:text-base font-semibold">和弦序列</h3>
          <div className="text-[10px] md:text-xs text-gray-400">{expandedChords.length}小节</div>
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
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-md scale-105'
                  : 'bg-white/10'
              }`}
            >
              <div className="text-[8px] text-gray-400">#{index + 1}</div>
              <div className="text-xs md:text-sm font-bold">{item.chord}</div>
              {isActuallyPlaying && index === currentChordIndex && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"
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
            className="text-[120px] md:text-[200px] font-bold bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
          >
            {countdown}
          </motion.div>
        </motion.div>
      )}


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

      {/* 音频文件选择抽屉 - 使用 Portal 渲染到 body，从最右边弹出，固定在视口 */}
      {createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setIsDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-gradient-to-b from-gray-900 to-black shadow-2xl border-l border-purple-500/30 overflow-hidden"
              style={{ position: 'fixed', height: '100vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 抽屉头部 */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-white">
                    🎵 选择 {selectedKeyForDrawer} 调音频
                  </h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-400">从项目音频库中选择伴奏文件</p>
              </div>

              {/* 音频文件列表 */}
              <div className="p-6 h-[calc(100vh-120px)] overflow-y-auto">
                {getAvailableAudioFiles(selectedKeyForDrawer).length > 0 ? (
                  <div className="space-y-3">
                    {getAvailableAudioFiles(selectedKeyForDrawer).map((audio, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all text-left"
                        onClick={() => handleSelectAudioFromUrl(
                          selectedKeyForDrawer, 
                          audio.url, 
                          audio.bpm,
                          audio.startOffset,
                          audio.loopStart,
                          audio.loopEnd
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-bold text-lg text-white mb-1">
                              {audio.name}
                            </div>
                            {audio.description && (
                              <div className="text-sm text-purple-300 mb-1">
                                {audio.description}
                              </div>
                            )}
                            <div className="text-sm text-gray-400">
                              原始 BPM: {audio.bpm}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {audio.url}
                            </div>
                          </div>
                          <div className="ml-4 text-purple-400 flex-shrink-0">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-gray-400 mb-2">暂无可用的音频文件</p>
                    <p className="text-sm text-gray-500">
                      请在 public/blues-mp3 目录下添加 {selectedKeyForDrawer}.mp3 文件
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ChordPractice;
