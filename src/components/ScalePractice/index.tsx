import React from 'react';
import { motion } from 'framer-motion';
import type { ScalePracticeProps } from '../../types/components';

/**
 * 音阶练习组件
 */
const ScalePractice: React.FC<ScalePracticeProps> = ({
  selectedKey,
  bluesType,
  scaleNotes,
  scaleDegrees,
  fretboardPositions
}) => {
  // 动态计算指板显示范围
  const getDisplayRange = () => {
    if (!fretboardPositions || fretboardPositions.length === 0) {
      return { startFret: 0, endFret: 15, displayFrets: 15 };
    }

    // 找到最小品位
    const frets = fretboardPositions.map(pos => pos.fret);
    const minFret = Math.min(...frets);

    // 如果最小品位小于等于3，从0品开始显示
    if (minFret <= 3) {
      return { startFret: 0, endFret: 15, displayFrets: 15 };
    }

    // 否则，从最小品位-2开始，确保有一些空间
    const startFret = Math.max(0, minFret - 2);
    const endFret = Math.min(20, startFret + 15);

    return { startFret, endFret, displayFrets: endFret - startFret };
  };

  const { startFret, endFret, displayFrets } = getDisplayRange();

  // 调整指板位置，使其相对于起始品位
  const adjustedPositions = fretboardPositions.map(pos => ({
    ...pos,
    displayFret: pos.fret - startFret
  }));

  return (
    <div className="practice-panel rounded-2xl p-4 md:p-6 border border-slate-200">
      <h2 className="text-xl md:text-2xl font-bold mb-4">
        🎵 {selectedKey} {bluesType.charAt(0).toUpperCase() + bluesType.slice(1)} Blues 音阶
      </h2>

      {/* 临时调试信息 */}
      {!scaleDegrees && (
        <div className="bg-red-50 border border-red-500 rounded p-2 mb-4 text-sm">
          ⚠️ scaleDegrees 未传递！
        </div>
      )}

      {/* 音阶音符展示 - 移动端隐藏 */}
      <div className="hidden md:block bg-slate-50 rounded-xl p-2 mb-3">
        <h3 className="text-sm font-semibold mb-2">音阶音符</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {scaleNotes.map((note, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              {/* 音符圆圈 */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                  note === selectedKey
                    ? 'practice-highlight text-black'
                    : 'practice-selected text-slate-800'
                }`}
              >
                {note}
              </div>
              {/* 音程标记 */}
              <div className="text-xs font-bold text-slate-500">
                {scaleDegrees && scaleDegrees[index] ? scaleDegrees[index] : (index + 1)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 吉他指板图 */}
      <div className="bg-slate-50 rounded-xl p-3 md:p-8 lg:p-12 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-lg font-semibold">吉他指板</h3>
          <div className="text-[10px] md:text-xs text-slate-500">
            <span className="md:hidden">前15品可见 · 👉滑动查看更多</span>
            <span className="hidden md:inline">品位范围: {startFret}-{endFret} 品</span>
          </div>
        </div>
        {/* 移动端优化: 使用CSS缩放,确保前15品在屏幕内可见 */}
        <div className="w-full">
          <div
            className="relative origin-left scale-[0.3] md:scale-50"
            style={{
              width: '200%',
              minWidth: '1000px'
            }}
          >
            {/* 品位标记 - 顶部 */}
            <div className="flex justify-between mb-4 px-2">
              {Array.from({ length: displayFrets + 1 }).map((_, index) => {
                const fret = startFret + index;
                const isSpecialFret = [3, 5, 7, 9, 12, 15, 17, 19].includes(fret);
                return (
                  <div
                    key={fret}
                    className="flex-1 text-center"
                    style={{ maxWidth: `${100 / (displayFrets + 1)}%` }}
                  >
                    <div className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                      isSpecialFret
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {fret}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 琴弦 */}
            <div className="space-y-8 md:space-y-10">
              {['E', 'B', 'G', 'D', 'A', 'E'].map((stringName, stringIndex) => (
                <div key={stringIndex} className="relative h-[2px]">
                  {/* 弦名 */}
                  <div className="absolute -left-6 md:-left-8 top-0 transform -translate-y-1/2 text-xs md:text-sm font-bold text-slate-500">
                    {stringName}
                  </div>
                  {/* 弦线 */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-200">
                    {/* 品丝 */}
                    {Array.from({ length: displayFrets + 1 }).map((_, index) => {
                      const fret = startFret + index;
                      const isSpecialFret = [3, 5, 7, 9, 12, 15, 17, 19].includes(fret);
                      return (
                        <div
                          key={fret}
                          className={`absolute top-0 transform -translate-y-1/2 h-8 md:h-10 border-l ${
                            isSpecialFret ? 'border-amber-200 border-l-2' : 'border-slate-300'
                          }`}
                          style={{ left: `${(index / displayFrets) * 100}%` }}
                        >
                          {/* 品位标记 - 底部 */}
                          {stringIndex === 5 && (
                            <div className={`absolute -bottom-6 md:-bottom-8 left-1/2 transform -translate-x-1/2 ${
                              isSpecialFret
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs md:text-sm font-bold'
                                : 'text-xs md:text-sm text-slate-500 font-medium'
                            }`}>
                              {fret}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* 音阶位置 */}
                    {adjustedPositions
                      .filter(pos => pos.string === stringIndex && pos.fret >= startFret && pos.fret <= endFret)
                      .map((pos, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`absolute -top-3 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${
                            pos.isRoot
                              ? 'practice-highlight text-black border-2 border-yellow-300'
                              : 'practice-selected text-slate-800'
                          }`}
                          style={{ left: `${((pos.displayFret + 0.5) / displayFrets) * 100}%` }}
                        >
                          {pos.note}
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 音程说明 */}
      <div className="bg-emerald-50 rounded-xl p-4 mt-4 border border-emerald-200">
        <h3 className="text-sm md:text-base font-semibold mb-2">🎼 音程结构</h3>
        <p className="text-xs md:text-sm text-slate-600">
          {bluesType === 'minor' && '小调 Blues: 根音 - 小三度 - 纯四度 - 减五度 - 纯五度 - 小七度'}
          {bluesType === 'major' && '大调 Blues: 根音 - 大二度 - 小三度 - 大三度 - 纯五度 - 大六度'}
          {bluesType === 'mixolydian' && 'Mixolydian: 根音 - 大二度 - 大三度 - 纯四度 - 纯五度 - 大六度 - 小七度'}
        </p>
      </div>
    </div>
  );
};

export default ScalePractice;
