import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

      {/* 节拍器控制 */}
      <div className="bg-black/50 rounded-xl p-6">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">节拍器</h3>

          {/* BPM 显示 */}
          <motion.div
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-6 ${
              isMetronomeActive
                ? 'bg-gradient-to-br from-green-400 to-blue-500'
                : 'bg-gray-700'
            }`}
            animate={isMetronomeActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 60 / bpm, repeat: Infinity }}
          >
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold">{bpm}</div>
              <div className="text-sm text-gray-300">BPM</div>
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
            onClick={() => setIsMetronomeActive(!isMetronomeActive)}
          >
            {isMetronomeActive ? '⏸ 停止节拍器' : '▶️ 启动节拍器'}
          </motion.button>
        </div>
      </div>

      {/* Shuffle 节奏说明 */}
      <div className="bg-blue-500/20 rounded-xl p-4 mt-4 border border-blue-500/30">
        <h3 className="text-sm md:text-base font-semibold mb-2">🎵 Shuffle 节奏要点</h3>
        <ul className="text-xs md:text-sm text-gray-300 space-y-1">
          <li>▸ Shuffle = 三连音的前两个音符连奏 (长-短-长-短)</li>
          <li>▸ 三连音比例约为 2:1 (不是严格的 2:1)</li>
          <li>▸ 放松自然,不要过于机械</li>
          <li>▸ 感受摇摆的律动感</li>
        </ul>
      </div>
    </div>
  );
};

export default RhythmPractice;
