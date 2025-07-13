import { useState } from 'react';
import { motion } from 'framer-motion';

const ChordFinderPage = () => {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedType, setSelectedType] = useState('major');
  const [currentChord, setCurrentChord] = useState(null);

  // 音符列表
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // 和弦类型
  const chordTypes = [
    { id: 'major', name: '大三和弦', suffix: '' },
    { id: 'minor', name: '小三和弦', suffix: 'm' },
    { id: '7', name: '属七和弦', suffix: '7' },
    { id: 'maj7', name: '大七和弦', suffix: 'maj7' },
    { id: 'm7', name: '小七和弦', suffix: 'm7' },
    { id: 'dim', name: '减三和弦', suffix: 'dim' },
    { id: 'aug', name: '增三和弦', suffix: 'aug' },
    { id: 'sus2', name: '挂二和弦', suffix: 'sus2' },
    { id: 'sus4', name: '挂四和弦', suffix: 'sus4' },
    { id: 'add9', name: '加九和弦', suffix: 'add9' },
  ];

  // 和弦指法数据库
  const chordDatabase = {
    // C和弦
    'C': {
      'major': { positions: ['x32010', 'x32013', '8x1098'], fingering: ['x32010'], name: 'C' },
      'minor': { positions: ['x31013', 'x35543'], fingering: ['x31013'], name: 'Cm' },
      '7': { positions: ['x32310', 'x35353'], fingering: ['x32310'], name: 'C7' },
      'maj7': { positions: ['x32000', 'x35453'], fingering: ['x32000'], name: 'Cmaj7' },
      'm7': { positions: ['x31313', 'x35343'], fingering: ['x31313'], name: 'Cm7' },
      'dim': { positions: ['x31x1x', 'x3454x'], fingering: ['x31x1x'], name: 'Cdim' },
      'aug': { positions: ['x32110', 'x3211x'], fingering: ['x32110'], name: 'Caug' },
      'sus2': { positions: ['x30010', 'x30013'], fingering: ['x30010'], name: 'Csus2' },
      'sus4': { positions: ['x33010', 'x33013'], fingering: ['x33010'], name: 'Csus4' },
      'add9': { positions: ['x32030', 'x30010'], fingering: ['x32030'], name: 'Cadd9' },
    },
    // G和弦
    'G': {
      'major': { positions: ['320003', '320033', '355433'], fingering: ['320003'], name: 'G' },
      'minor': { positions: ['310033', '355333'], fingering: ['310033'], name: 'Gm' },
      '7': { positions: ['320001', '353433'], fingering: ['320001'], name: 'G7' },
      'maj7': { positions: ['320002', '354433'], fingering: ['320002'], name: 'Gmaj7' },
      'm7': { positions: ['310031', '353333'], fingering: ['310031'], name: 'Gm7' },
      'dim': { positions: ['31x32x', '3x232x'], fingering: ['31x32x'], name: 'Gdim' },
      'aug': { positions: ['321003', '3x100x'], fingering: ['321003'], name: 'Gaug' },
      'sus2': { positions: ['300033', '300003'], fingering: ['300033'], name: 'Gsus2' },
      'sus4': { positions: ['330033', '330003'], fingering: ['330033'], name: 'Gsus4' },
      'add9': { positions: ['300203', '300233'], fingering: ['300203'], name: 'Gadd9' },
    },
    // D和弦
    'D': {
      'major': { positions: ['xx0232', 'x54232'], fingering: ['xx0232'], name: 'D' },
      'minor': { positions: ['xx0231', 'x54231'], fingering: ['xx0231'], name: 'Dm' },
      '7': { positions: ['xx0212', 'x54232'], fingering: ['xx0212'], name: 'D7' },
      'maj7': { positions: ['xx0222', 'x54222'], fingering: ['xx0222'], name: 'Dmaj7' },
      'm7': { positions: ['xx0211', 'x54211'], fingering: ['xx0211'], name: 'Dm7' },
      'dim': { positions: ['xx0131', 'x5313x'], fingering: ['xx0131'], name: 'Ddim' },
      'aug': { positions: ['xx0332', 'x5433x'], fingering: ['xx0332'], name: 'Daug' },
      'sus2': { positions: ['xx0230', 'x54230'], fingering: ['xx0230'], name: 'Dsus2' },
      'sus4': { positions: ['xx0233', 'x54233'], fingering: ['xx0233'], name: 'Dsus4' },
      'add9': { positions: ['x54230', 'xx0230'], fingering: ['x54230'], name: 'Dadd9' },
    },
    // A和弦
    'A': {
      'major': { positions: ['x02220', '577655'], fingering: ['x02220'], name: 'A' },
      'minor': { positions: ['x02210', '577555'], fingering: ['x02210'], name: 'Am' },
      '7': { positions: ['x02020', '575655'], fingering: ['x02020'], name: 'A7' },
      'maj7': { positions: ['x02120', '576655'], fingering: ['x02120'], name: 'Amaj7' },
      'm7': { positions: ['x02010', '575555'], fingering: ['x02010'], name: 'Am7' },
      'dim': { positions: ['x0121x', 'x01212'], fingering: ['x0121x'], name: 'Adim' },
      'aug': { positions: ['x03221', 'x0322x'], fingering: ['x03221'], name: 'Aaug' },
      'sus2': { positions: ['x02200', 'x02400'], fingering: ['x02200'], name: 'Asus2' },
      'sus4': { positions: ['x02230', 'x02235'], fingering: ['x02230'], name: 'Asus4' },
      'add9': { positions: ['x02420', 'x02400'], fingering: ['x02420'], name: 'Aadd9' },
    },
    // E和弦
    'E': {
      'major': { positions: ['022100', '022104', '079997'], fingering: ['022100'], name: 'E' },
      'minor': { positions: ['022000', '022003', '079987'], fingering: ['022000'], name: 'Em' },
      '7': { positions: ['020100', '020130', '076767'], fingering: ['020100'], name: 'E7' },
      'maj7': { positions: ['021100', '021104', '076897'], fingering: ['021100'], name: 'Emaj7' },
      'm7': { positions: ['020000', '020003', '079787'], fingering: ['020000'], name: 'Em7' },
      'dim': { positions: ['0120xx', '01200x'], fingering: ['0120xx'], name: 'Edim' },
      'aug': { positions: ['032110', '03211x'], fingering: ['032110'], name: 'Eaug' },
      'sus2': { positions: ['002400', '002404'], fingering: ['002400'], name: 'Esus2' },
      'sus4': { positions: ['002200', '002204'], fingering: ['002200'], name: 'Esus4' },
      'add9': { positions: ['024100', '024104'], fingering: ['024100'], name: 'Eadd9' },
    },
  };

  // 查找和弦
  const findChord = () => {
    // 如果数据库中有这个和弦
    if (chordDatabase[selectedRoot] && chordDatabase[selectedRoot][selectedType]) {
      setCurrentChord(chordDatabase[selectedRoot][selectedType]);
    } else {
      // 如果没有这个和弦，返回一个通用的和弦结构
      const chordType = chordTypes.find(type => type.id === selectedType);
      setCurrentChord({
        positions: ['xxxxxx'],
        fingering: ['xxxxxx'],
        name: `${selectedRoot}${chordType.suffix}`,
        notFound: true
      });
    }
  };

  // 渲染吉他指板
  const renderFretboard = (position) => {
    // 将和弦位置字符串转换为数组
    const frets = position.split('').map(fret => fret === 'x' ? 'x' : parseInt(fret));
    
    // 弦名称
    const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
    
    return (
      <div className="mb-8">
        <div className="relative w-full h-64 bg-base-300 rounded-lg overflow-hidden">
          {/* 弦 */}
          {[0, 1, 2, 3, 4, 5].map(string => (
            <div 
              key={`string-${string}`}
              className="absolute w-full h-0.5 bg-gray-400"
              style={{ top: `${string * 20 + 10}%` }}
            ></div>
          ))}
          
          {/* 品 */}
          {[0, 1, 2, 3, 4].map(fret => (
            <div 
              key={`fret-${fret}`}
              className="absolute h-full w-0.5 bg-gray-600"
              style={{ left: `${fret * 20 + 20}%` }}
            ></div>
          ))}
          
          {/* 品位标记 */}
          {[0, 1, 2, 3, 4].map(fret => (
            <div 
              key={`fret-marker-${fret}`}
              className="absolute bottom-1 text-xs text-gray-400"
              style={{ left: `${fret * 20 + 10}%` }}
            >
              {fret}
            </div>
          ))}
          
          {/* 弦名称 */}
          {stringNames.map((name, index) => (
            <div 
              key={`string-name-${index}`}
              className="absolute left-2 text-sm font-medium"
              style={{ top: `${index * 20 + 9}%` }}
            >
              {name}
            </div>
          ))}
          
          {/* 和弦按位 */}
          {frets.map((fret, stringIndex) => {
            if (fret === 'x') {
              // 不弹的弦
              return (
                <div 
                  key={`mute-${stringIndex}`}
                  className="absolute text-lg font-bold text-error"
                  style={{ 
                    left: '10%', 
                    top: `${stringIndex * 20 + 8}%` 
                  }}
                >
                  ✕
                </div>
              );
            } else if (fret === 0) {
              // 空弦
              return (
                <div 
                  key={`open-${stringIndex}`}
                  className="absolute text-lg font-bold text-success"
                  style={{ 
                    left: '10%', 
                    top: `${stringIndex * 20 + 8}%` 
                  }}
                >
                  ○
                </div>
              );
            } else {
              // 按弦位置
              return (
                <div 
                  key={`fret-${stringIndex}-${fret}`}
                  className="absolute w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold"
                  style={{ 
                    left: `${fret * 20 + 10}%`, 
                    top: `${stringIndex * 20 + 8}%`,
                    transform: 'translate(-50%, -50%)' 
                  }}
                >
                  {fret}
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-center mb-8">吉他和弦查找器</h1>
        
        <div className="bg-base-200 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 根音选择 */}
            <div className="flex-1">
              <label className="label">
                <span className="label-text">根音</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {notes.map(note => (
                  <button
                    key={note}
                    className={`btn ${selectedRoot === note ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedRoot(note)}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 和弦类型选择 */}
            <div className="flex-1">
              <label className="label">
                <span className="label-text">和弦类型</span>
              </label>
              <select 
                className="select select-bordered w-full"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {chordTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.suffix})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 查找按钮 */}
          <div className="flex justify-center mb-6">
            <button 
              className="btn btn-primary btn-lg"
              onClick={findChord}
            >
              查找和弦
            </button>
          </div>
          
          {/* 和弦显示区域 */}
          {currentChord && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-center mb-4">{currentChord.name} 和弦</h2>
              
              {currentChord.notFound ? (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>抱歉，我们的数据库中没有这个和弦的指法。请尝试其他和弦。</span>
                </div>
              ) : (
                <>
                  {/* 和弦指法图 */}
                  {renderFretboard(currentChord.fingering[0])}
                  
                  {/* 和弦音符组成 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">和弦组成音</h3>
                    <div className="flex flex-wrap gap-2">
                      {getChordNotes(selectedRoot, selectedType).map((note, index) => (
                        <div key={index} className="badge badge-lg badge-primary">{note}</div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 替代指法 */}
                  {currentChord.positions.length > 1 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">替代指法</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentChord.positions.slice(1).map((position, index) => (
                          <div key={index} className="text-center">
                            <div className="font-mono bg-base-300 p-2 rounded">
                              {position.split('').map((fret, i) => (
                                <span key={i} className="mx-1">{fret}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">使用说明</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>选择和弦的根音（如C、G、D等）</li>
            <li>选择和弦类型（如大三和弦、小三和弦等）</li>
            <li>点击"查找和弦"按钮</li>
            <li>查看和弦指法图和音符组成</li>
            <li>如果有替代指法，可以查看其他按法选项</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
};

// 根据根音和和弦类型获取和弦组成音
const getChordNotes = (root, type) => {
  const noteIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(root);
  
  // 各和弦类型的音程结构（半音数）
  const intervals = {
    'major': [0, 4, 7],           // 大三和弦: 1-3-5
    'minor': [0, 3, 7],           // 小三和弦: 1-b3-5
    '7': [0, 4, 7, 10],           // 属七和弦: 1-3-5-b7
    'maj7': [0, 4, 7, 11],        // 大七和弦: 1-3-5-7
    'm7': [0, 3, 7, 10],          // 小七和弦: 1-b3-5-b7
    'dim': [0, 3, 6],             // 减三和弦: 1-b3-b5
    'aug': [0, 4, 8],             // 增三和弦: 1-3-#5
    'sus2': [0, 2, 7],            // 挂二和弦: 1-2-5
    'sus4': [0, 5, 7],            // 挂四和弦: 1-4-5
    'add9': [0, 4, 7, 14],        // 加九和弦: 1-3-5-9
  };
  
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // 根据音程计算和弦音符
  return intervals[type].map(interval => {
    const notePos = (noteIndex + interval) % 12;
    return allNotes[notePos];
  });
};

export default ChordFinderPage;