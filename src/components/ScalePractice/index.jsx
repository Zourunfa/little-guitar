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

      {/* 音阶音符展示 - 移动端隐藏 */}
      <div className="hidden md:block bg-black/50 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">音阶音符</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {scaleNotes.map((note, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
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
      <div className="bg-black/50 rounded-xl p-3 md:p-8 lg:p-12 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-lg font-semibold">吉他指板</h3>
          <div className="text-[10px] md:text-xs text-gray-400">
            <span className="md:hidden">前15品可见 · 👉滑动查看更多</span>
            <span className="hidden md:inline">前20品</span>
          </div>
        </div>
        {/* 移动端优化: 使用CSS缩放,确保前15品在屏幕内可见 */}
        <div className="w-full">
          <div
            className="relative origin-left scale-[0.3] md:scale-100"
            style={{
              width: '333.33%', // 补偿scale(0.3)后的宽度: 1/0.3 = 3.3333
              minWidth: '1000px'
            }}
          >
            {/* 琴弦 */}
            <div className="space-y-8 md:space-y-10">
              {['E', 'B', 'G', 'D', 'A', 'E'].map((stringName, stringIndex) => (
                <div key={stringIndex} className="relative h-[2px]">
                  {/* 弦名 */}
                  <div className="absolute -left-6 md:-left-8 top-0 transform -translate-y-1/2 text-xs md:text-sm font-bold text-gray-400">
                    {stringName}
                  </div>
                  {/* 弦线 */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-600">
                    {/* 品丝 */}
                    {Array.from({ length: 21 }).map((_, fret) => (
                      <div
                        key={fret}
                        className="absolute top-0 transform -translate-y-1/2 h-8 md:h-10 border-l border-gray-500"
                        style={{ left: `${(fret / 20) * 100}%` }}
                      >
                        {/* 品位标记 */}
                        {stringIndex === 5 && fret > 0 && (
                          <div className="absolute -bottom-5 md:-bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] md:text-xs text-gray-500">
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
                          transition={{ delay: idx * 0.02 }}
                          className={`absolute -top-3 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${
                            pos.isRoot
                              ? 'bg-yellow-500 text-black border-2 border-yellow-300'
                              : 'bg-blue-500 text-white'
                          }`}
                          style={{ left: `${((pos.fret + 0.5) / 20) * 100}%` }}
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
