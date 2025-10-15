import { motion } from 'framer-motion';

/**
 * 即兴创作组件
 * @param {string} selectedKey - 当前选择的调式
 * @param {string} bluesType - Blues 类型 (minor, major, mixolydian)
 * @param {Array} scaleNotes - 音阶音符数组
 * @param {string} progression - 和弦进行类型
 * @param {number} bpm - 节拍速度
 */
const Improvisation = ({
  selectedKey,
  bluesType,
  scaleNotes,
  progression,
  bpm
}) => {
  const improvTechniques = [
    { name: '音阶爬行', desc: '从低到高演奏音阶', icon: '↗️' },
    { name: '重复动机', desc: '选择2-3个音符重复变化', icon: '🔄' },
    { name: '问答句式', desc: '一个短句+一个回应', icon: '💬' },
    { name: '弯音技巧', desc: '在关键音符上加弯音', icon: '〰️' },
    { name: '留白艺术', desc: '适当停顿,让音乐呼吸', icon: '⏸️' },
    { name: '节奏变化', desc: '改变音符时值', icon: '🎼' }
  ];

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/10">
      <h2 className="text-xl md:text-2xl font-bold mb-4">✨ {selectedKey} Blues 即兴创作</h2>

      {/* 当前设置总结 */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold mb-3">🎯 当前练习设置</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">调式</div>
            <div className="font-bold text-lg">{selectedKey}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">类型</div>
            <div className="font-bold">{bluesType}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">进行</div>
            <div className="font-bold">{progression === '12bar' ? '12小节' : '6小节'}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">速度</div>
            <div className="font-bold">{bpm} BPM</div>
          </div>
        </div>
      </div>

      {/* 可用音符 */}
      <div className="bg-black/50 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">可用音符</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {scaleNotes.map((note, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-base md:text-lg font-bold cursor-pointer ${
                note === selectedKey
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {note}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 即兴技巧 */}
      <div className="bg-black/50 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">即兴技巧工具箱</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {improvTechniques.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all cursor-pointer"
            >
              <div className="text-2xl mb-1">{tech.icon}</div>
              <div className="font-bold text-sm mb-1">{tech.name}</div>
              <div className="text-xs text-gray-400">{tech.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 练习步骤 */}
      <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
        <h3 className="text-base md:text-lg font-semibold mb-3">🎓 即兴练习步骤</h3>
        <ol className="space-y-2 text-sm text-gray-300">
          <li><span className="text-yellow-400 font-bold">1.</span> 先在和弦进行上练习音阶,熟悉音符位置</li>
          <li><span className="text-yellow-400 font-bold">2.</span> 选择一个简单的2-3音符动机,在不同把位重复</li>
          <li><span className="text-yellow-400 font-bold">3.</span> 尝试改变动机的节奏,保持音高</li>
          <li><span className="text-yellow-400 font-bold">4.</span> 在动机之间留出空白,让音乐呼吸</li>
          <li><span className="text-yellow-400 font-bold">5.</span> 逐渐增加变化,但保持连贯性</li>
          <li><span className="text-yellow-400 font-bold">6.</span> 录下自己的演奏,回听并改进</li>
        </ol>
      </div>
    </div>
  );
};

export default Improvisation;
