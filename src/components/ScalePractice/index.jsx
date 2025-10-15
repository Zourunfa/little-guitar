import { motion } from 'framer-motion';

/**
 * 音阶练习组件
 * @param {string} selectedKey - 当前选择的调式
 * @param {string} bluesType - Blues 类型 (minor, major, mixolydian)
 * @param {Array} scaleNotes - 音阶音符数组
 * @param {Array} fretboardPositions - 指板位置数组
 */
const ScalePractice = ({ selectedKey, bluesType, scaleNotes, fretboardPositions }) => {
  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/10">
      <h2 className="text-xl md:text-2xl font-bold mb-4">
        🎵 {selectedKey} {bluesType.charAt(0).toUpperCase() + bluesType.slice(1)} Blues 音阶
      </h2>

      {/* 音阶音符展示 */}
      <div className="bg-black/50 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">音阶音符</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {scaleNotes.map((note, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl font-bold ${
                note === selectedKey
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {note}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 吉他指板图 */}
      <div className="bg-black/50 rounded-xl p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">吉他指板 (前12品)</h3>
        <div className="relative min-w-[600px] md:min-w-0">
          {/* 琴弦 */}
          <div className="space-y-8">
            {['E', 'B', 'G', 'D', 'A', 'E'].map((stringName, stringIndex) => (
              <div key={stringIndex} className="relative">
                {/* 弦名 */}
                <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-sm font-bold text-gray-400">
                  {stringName}
                </div>
                {/* 弦线 */}
                <div className="h-0.5 bg-gray-600 relative">
                  {/* 品丝 */}
                  {Array.from({ length: 13 }).map((_, fret) => (
                    <div
                      key={fret}
                      className="absolute top-1/2 transform -translate-y-1/2 h-8 border-l border-gray-500"
                      style={{ left: `${(fret / 12) * 100}%` }}
                    >
                      {/* 品位标记 */}
                      {stringIndex === 5 && fret > 0 && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                          {fret}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 音阶位置 */}
                  {fretboardPositions
                    .filter(pos => pos.string === stringIndex)
                    .map((pos, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          pos.isRoot
                            ? 'bg-yellow-500 text-black border-2 border-yellow-300'
                            : 'bg-blue-500 text-white'
                        }`}
                        style={{ left: `${((pos.fret + 0.5) / 12) * 100}%` }}
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

      {/* 音程说明 */}
      <div className="bg-blue-500/20 rounded-xl p-4 mt-4 border border-blue-500/30">
        <h3 className="text-sm md:text-base font-semibold mb-2">🎼 音程结构</h3>
        <p className="text-xs md:text-sm text-gray-300">
          {bluesType === 'minor' && '小调 Blues: 根音 - 小三度 - 纯四度 - 减五度 - 纯五度 - 小七度'}
          {bluesType === 'major' && '大调 Blues: 根音 - 大二度 - 小三度 - 大三度 - 纯五度 - 大六度'}
          {bluesType === 'mixolydian' && 'Mixolydian: 根音 - 大二度 - 大三度 - 纯四度 - 纯五度 - 大六度 - 小七度'}
        </p>
      </div>
    </div>
  );
};

export default ScalePractice;
