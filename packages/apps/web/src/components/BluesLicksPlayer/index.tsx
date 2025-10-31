import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import type { BluesLick, TabNote, Note } from '../../types';
import { bluesLicksDatabase, transposeLick, filterLicksByDifficulty, filterLicksByStyle } from '../../data/bluesLicks';

interface BluesLicksPlayerProps {
  selectedKey: Note;
  bpm: number;
}

/**
 * Blues 乐句播放器组件
 */
const BluesLicksPlayer: React.FC<BluesLicksPlayerProps> = ({ selectedKey, bpm }) => {
  const [selectedLick, setSelectedLick] = useState<BluesLick | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // 初始化音频合成器
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();
    synthRef.current.volume.value = -10;

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, []);

  // 将 TAB 转换为音符
  const tabToNote = (tab: TabNote): string => {
    const openStrings = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
    const stringNote = openStrings[tab.string];
    const midiNote = Tone.Frequency(stringNote).toMidi() + tab.fret;
    return Tone.Frequency(midiNote, 'midi').toNote();
  };

  // 播放乐句
  const playLick = async (lick: BluesLick) => {
    if (!synthRef.current) return;

    await Tone.start();
    setIsPlaying(true);
    setCurrentNoteIndex(0);

    // 转换到当前调式
    const transposedLick = transposeLick(lick, selectedKey);
    
    // 创建音符序列
    const notes = transposedLick.tabs.map(tab => ({
      note: tabToNote(tab),
      duration: tab.duration,
      technique: tab.technique
    }));

    const times: number[] = [];
    let currentTime = 0;

    notes.forEach((note) => {
      times.push(currentTime);
      currentTime += note.duration;
    });

    // 使用 Tone.js Transport 播放
    Tone.Transport.bpm.value = bpm;
    
    sequenceRef.current = new Tone.Sequence(
      (time, index) => {
        if (synthRef.current && notes[index]) {
          const note = notes[index];
          synthRef.current.triggerAttackRelease(
            note.note,
            note.duration,
            time
          );
          
          // 更新当前音符索引
          Tone.Draw.schedule(() => {
            setCurrentNoteIndex(index);
          }, time);
        }
      },
      Array.from({ length: notes.length }, (_, i) => i),
      '4n'
    );

    sequenceRef.current.start(0);
    Tone.Transport.start();

    // 播放完成后停止
    setTimeout(() => {
      stopLick();
    }, currentTime * 1000 + 500);
  };

  // 停止播放
  const stopLick = () => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
  };

  // 筛选乐句
  const getFilteredLicks = () => {
    let licks = [...bluesLicksDatabase];
    
    if (filterDifficulty !== 'all') {
      licks = filterLicksByDifficulty(filterDifficulty);
    }
    
    if (filterStyle !== 'all') {
      licks = filterLicksByStyle(filterStyle);
    }
    
    return licks;
  };

  const filteredLicks = getFilteredLicks();

  // 难度标签样式
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 风格标签样式
  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'chicago':
        return '🏙️';
      case 'texas':
        return '🤠';
      case 'delta':
        return '🌊';
      case 'modern':
        return '⚡';
      case 'classic':
        return '🎸';
      default:
        return '🎵';
    }
  };

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="bg-black/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-3">🎯 筛选乐句</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 难度筛选 */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">难度</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">全部</option>
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>

          {/* 风格筛选 */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">风格</label>
            <select
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">全部</option>
              <option value="chicago">芝加哥</option>
              <option value="texas">德州</option>
              <option value="delta">三角洲</option>
              <option value="modern">现代</option>
              <option value="classic">经典</option>
            </select>
          </div>
        </div>
      </div>

      {/* 乐句列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLicks.map((lick) => (
          <motion.div
            key={lick.id}
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 border cursor-pointer transition-all ${
              selectedLick?.id === lick.id
                ? 'border-yellow-400 shadow-lg shadow-yellow-400/50'
                : 'border-white/10 hover:border-white/30'
            }`}
            onClick={() => setSelectedLick(lick)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStyleIcon(lick.style)}</span>
                <h4 className="font-bold">{lick.name}</h4>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(lick.difficulty)}`}>
                {lick.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{lick.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>原调: {lick.key}</span>
              <span>{lick.bpm} BPM</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 选中的乐句详情 */}
      {selectedLick && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 rounded-xl p-6 border border-yellow-400/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">📖 {selectedLick.name}</h3>
            <button
              onClick={() => (isPlaying ? stopLick() : playLick(selectedLick))}
              disabled={isPlaying}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isPlaying ? '⏹️ 停止' : '▶️ 播放'}
            </button>
          </div>

          {/* 演奏提示 */}
          {selectedLick.audioTips && (
            <div className="bg-blue-500/20 rounded-lg p-3 mb-4 border border-blue-500/30">
              <p className="text-sm">💡 <strong>演奏提示:</strong> {selectedLick.audioTips}</p>
            </div>
          )}

          {/* TAB 谱显示 */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-400">吉他 TAB 谱</h4>
            <div className="font-mono text-sm space-y-1 overflow-x-auto">
              {[0, 1, 2, 3, 4, 5].map((stringNum) => {
                const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
                const notesOnString = selectedLick.tabs
                  .map((tab, index) => ({ ...tab, index }))
                  .filter((tab) => tab.string === stringNum);

                return (
                  <div key={stringNum} className="flex items-center gap-2">
                    <span className="text-gray-500 w-4">{stringNames[stringNum]}|</span>
                    <div className="flex-1 flex items-center">
                      {notesOnString.map((tab, i) => (
                        <span
                          key={i}
                          className={`inline-block min-w-[24px] text-center ${
                            currentNoteIndex === tab.index
                              ? 'text-yellow-400 font-bold scale-125'
                              : 'text-white'
                          } transition-all`}
                        >
                          {tab.fret}
                          {tab.technique && (
                            <span className="text-xs text-blue-400">
                              {tab.technique === 'bend' && 'b'}
                              {tab.technique === 'slide' && '/'}
                              {tab.technique === 'hammer' && 'h'}
                              {tab.technique === 'pull' && 'p'}
                              {tab.technique === 'vibrato' && '~'}
                            </span>
                          )}
                          -
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 技巧说明 */}
          <div className="mt-4 text-xs text-gray-400">
            <p>技巧标记: b=推弦 /=滑音 h=锤击 p=勾弦 ~=颤音</p>
          </div>
        </motion.div>
      )}

      {/* 空状态 */}
      {filteredLicks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">😕 没有找到符合条件的乐句</p>
          <p className="text-sm mt-2">尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
};

export default BluesLicksPlayer;
