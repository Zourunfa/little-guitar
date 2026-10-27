import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ImprovisationProps } from '../../types/components';
import BluesLicksPlayer from '../BluesLicksPlayer';
import HarmonicaAccompaniment from '../HarmonicaAccompaniment';

interface ImprovTechnique {
  name: string;
  desc: string;
  icon: string;
}

/**
 * 即兴创作组件
 */
const Improvisation: React.FC<ImprovisationProps> = ({
  selectedKey,
  bluesType,
  scaleNotes,
  scaleDegrees,
  progression,
  bpm
}) => {
  const [activeTab, setActiveTab] = useState<'techniques' | 'licks' | 'harmonica'>('techniques');
  const [isHarmonicaPlaying, setIsHarmonicaPlaying] = useState(false);

  const improvTechniques: ImprovTechnique[] = [
    { name: '音阶爬行', desc: '从低到高演奏音阶', icon: '↗️' },
    { name: '重复动机', desc: '选择2-3个音符重复变化', icon: '🔄' },
    { name: '问答句式', desc: '一个短句+一个回应', icon: '💬' },
    { name: '弯音技巧', desc: '在关键音符上加弯音', icon: '〰️' },
    { name: '留白艺术', desc: '适当停顿,让音乐呼吸', icon: '⏸️' },
    { name: '节奏变化', desc: '改变音符时值', icon: '🎼' }
  ];

  return (
    <div className="practice-panel rounded-2xl p-4 md:p-6 border border-slate-200">
      <h2 className="text-xl md:text-2xl font-bold mb-4">✨ {selectedKey} Blues 即兴创作</h2>

      {/* 标签页切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('techniques')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'techniques'
              ? 'practice-selected text-slate-800'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
        >
          🎓 即兴技巧
        </button>
        <button
          onClick={() => setActiveTab('licks')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'licks'
              ? 'practice-selected text-slate-800'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
        >
          🎸 经典乐句库
        </button>
        <button
          onClick={() => setActiveTab('harmonica')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'harmonica'
              ? 'practice-selected text-slate-800'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
        >
          🎺 口琴伴奏
        </button>
      </div>

      {/* 当前设置总结 */}
      <div className="practice-tint rounded-xl p-4 mb-6 border border-emerald-200">
        <h3 className="text-lg font-semibold mb-3">🎯 当前练习设置</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">调式</div>
            <div className="font-bold text-lg">{selectedKey}</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">类型</div>
            <div className="font-bold">{bluesType}</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">进行</div>
            <div className="font-bold">{progression === '12bar' ? '12小节' : '6小节'}</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">速度</div>
            <div className="font-bold">{bpm} BPM</div>
          </div>
        </div>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'techniques' ? (
        <>
          {/* 可用音符 */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">可用音符</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {scaleNotes.map((note, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  {/* 音符圆圈 */}
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-base md:text-lg font-bold ${
                      note === selectedKey
                        ? 'practice-highlight text-black'
                        : 'practice-selected text-slate-800 hover:bg-emerald-100'
                    }`}
                  >
                    {note}
                  </div>
                  {/* 音程标记 */}
                  <div className="text-xs font-bold text-slate-500">
                    {scaleDegrees?.[index] || (index + 1)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 即兴技巧 */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">即兴技巧工具箱</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {improvTechniques.map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-50 hover:bg-slate-100 rounded-lg p-3 transition-all cursor-pointer"
                >
                  <div className="text-2xl mb-1">{tech.icon}</div>
                  <div className="font-bold text-sm mb-1">{tech.name}</div>
                  <div className="text-xs text-slate-500">{tech.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 练习步骤 */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-base md:text-lg font-semibold mb-3">🎓 即兴练习步骤</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li><span className="text-amber-700 font-bold">1.</span> 先在和弦进行上练习音阶,熟悉音符位置</li>
              <li><span className="text-amber-700 font-bold">2.</span> 选择一个简单的2-3音符动机,在不同把位重复</li>
              <li><span className="text-amber-700 font-bold">3.</span> 尝试改变动机的节奏,保持音高</li>
              <li><span className="text-amber-700 font-bold">4.</span> 在动机之间留出空白,让音乐呼吸</li>
              <li><span className="text-amber-700 font-bold">5.</span> 逐渐增加变化,但保持连贯性</li>
              <li><span className="text-amber-700 font-bold">6.</span> 录下自己的演奏,回听并改进</li>
            </ol>
          </div>
        </>
      ) : activeTab === 'licks' ? (
        /* 经典乐句库 */
        <BluesLicksPlayer selectedKey={selectedKey} bpm={bpm} />
      ) : (
        /* 口琴伴奏 */
        <HarmonicaAccompaniment
          selectedKey={selectedKey}
          bpm={bpm}
          isPlaying={isHarmonicaPlaying}
          onPlayingChange={setIsHarmonicaPlaying}
        />
      )}
    </div>
  );
};

export default Improvisation;
