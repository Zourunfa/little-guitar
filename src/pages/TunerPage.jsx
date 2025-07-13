import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TunerPage = () => {
  const [listening, setListening] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [frequency, setFrequency] = useState(0);
  const [cents, setCents] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [error, setError] = useState(null);
  const [selectedString, setSelectedString] = useState(2); // 默认选择第3弦(G3)
  const [tuningMode, setTuningMode] = useState('standard');
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustModalData, setAdjustModalData] = useState({ semitones: 0, stringIndex: 0 });
  const oscillatorRef = useRef(null);

  // 调音模式配置
  const tuningModes = {
    'standard': {
      name: '标准调音',
      strings: [
        { note: 'E2', frequency: 82.41, fret: 0 },
        { note: 'A2', frequency: 110.00, fret: 5 },
        { note: 'D3', frequency: 146.83, fret: 10 },
        { note: 'G3', frequency: 196.00, fret: 15 },
        { note: 'B3', frequency: 246.94, fret: 19 },
        { note: 'E4', frequency: 329.63, fret: 24 }
      ]
    },
    'dropD': {
      name: 'Drop D',
      strings: [
        { note: 'D2', frequency: 73.42, fret: 0 },
        { note: 'A2', frequency: 110.00, fret: 5 },
        { note: 'D3', frequency: 146.83, fret: 10 },
        { note: 'G3', frequency: 196.00, fret: 15 },
        { note: 'B3', frequency: 246.94, fret: 19 },
        { note: 'E4', frequency: 329.63, fret: 24 }
      ]
    },
    'halfStepDown': {
      name: '全音降半音',
      strings: [
        { note: 'D#2', frequency: 77.78, fret: 0 },
        { note: 'G#2', frequency: 103.83, fret: 5 },
        { note: 'C#3', frequency: 138.59, fret: 10 },
        { note: 'F#3', frequency: 185.00, fret: 15 },
        { note: 'A#3', frequency: 233.08, fret: 19 },
        { note: 'D#4', frequency: 311.13, fret: 24 }
      ]
    },
    'openG': {
      name: 'Open G',
      strings: [
        { note: 'D2', frequency: 73.42, fret: 0 },
        { note: 'G2', frequency: 98.00, fret: 5 },
        { note: 'D3', frequency: 146.83, fret: 10 },
        { note: 'G3', frequency: 196.00, fret: 15 },
        { note: 'B3', frequency: 246.94, fret: 19 },
        { note: 'D4', frequency: 293.66, fret: 24 }
      ]
    }
  };

  // 钢琴键盘配置
  const pianoKeys = [
    { note: 'C', isBlack: false, frequency: 261.63 },
    { note: 'C#', isBlack: true, frequency: 277.18 },
    { note: 'D', isBlack: false, frequency: 293.66 },
    { note: 'D#', isBlack: true, frequency: 311.13 },
    { note: 'E', isBlack: false, frequency: 329.63 },
    { note: 'F', isBlack: false, frequency: 349.23 },
    { note: 'F#', isBlack: true, frequency: 369.99 },
    { note: 'G', isBlack: false, frequency: 392.00 },
    { note: 'G#', isBlack: true, frequency: 415.30 },
    { note: 'A', isBlack: false, frequency: 440.00 },
    { note: 'A#', isBlack: true, frequency: 466.16 },
    { note: 'B', isBlack: false, frequency: 493.88 }
  ];

  const currentStrings = tuningModes[tuningMode].strings;
  const targetString = currentStrings[selectedString];

  // 启动调音器
  const startTuner = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 4096;
      analyserNode.smoothingTimeConstant = 0.8;
      setAnalyzer(analyserNode);

      const microphone = context.createMediaStreamSource(stream);
      microphone.connect(analyserNode);

      setListening(true);
      setError(null);
      
      analyzeAudio(analyserNode, context);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('无法访问麦克风。您的设备拒绝了我获取音频权限的请求。');
      setListening(false);
    }
  };

  // 停止调音器
  const stopTuner = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setAnalyzer(null);
    }
    setListening(false);
    setCurrentNote(null);
    setFrequency(0);
    setCents(0);
  };

  // 分析音频并检测音高
  const analyzeAudio = (analyserNode, context) => {
    const bufferLength = analyserNode.fftSize;
    const dataArray = new Float32Array(bufferLength);
    
    const detectPitch = () => {
      if (!listening) return;
      
      analyserNode.getFloatTimeDomainData(dataArray);
      
      // 使用YIN算法的简化版本
      const pitch = detectPitchYIN(dataArray, context.sampleRate);
      
      if (pitch > 0) {
        setFrequency(Math.round(pitch * 100) / 100);
        
        // 自动识别最接近的弦
        const closestStringIndex = findClosestString(pitch);
        setSelectedString(closestStringIndex);
        
        const currentString = currentStrings[closestStringIndex];
        setCurrentNote(currentString.note);
        
        // 计算音分差异
        const centsOff = 1200 * Math.log2(pitch / currentString.frequency);
        setCents(Math.round(centsOff * 10) / 10);
      }
      
      requestAnimationFrame(detectPitch);
    };
    
    detectPitch();
  };

  // YIN算法简化版本
  const detectPitchYIN = (buffer, sampleRate) => {
    const threshold = 0.1;
    const yinBuffer = new Float32Array(buffer.length / 2);
    
    // 计算差异函数
    yinBuffer[0] = 1;
    for (let t = 1; t < yinBuffer.length; t++) {
      yinBuffer[t] = 0;
      for (let i = 0; i < yinBuffer.length; i++) {
        const delta = buffer[i] - buffer[i + t];
        yinBuffer[t] += delta * delta;
      }
    }
    
    // 累积平均标准化差异函数
    let runningSum = 0;
    yinBuffer[0] = 1;
    for (let t = 1; t < yinBuffer.length; t++) {
      runningSum += yinBuffer[t];
      yinBuffer[t] *= t / runningSum;
    }
    
    // 寻找第一个小于阈值的点
    let tau = -1;
    for (let t = 2; t < yinBuffer.length; t++) {
      if (yinBuffer[t] < threshold) {
        while (t + 1 < yinBuffer.length && yinBuffer[t + 1] < yinBuffer[t]) {
          t++;
        }
        tau = t;
        break;
      }
    }
    
    return tau !== -1 ? sampleRate / tau : -1;
  };

  // 找到最接近的弦
  const findClosestString = (frequency) => {
    let closestIndex = 0;
    let minDifference = Math.abs(Math.log2(frequency / currentStrings[0].frequency));
    
    for (let i = 1; i < currentStrings.length; i++) {
      const difference = Math.abs(Math.log2(frequency / currentStrings[i].frequency));
      if (difference < minDifference) {
        minDifference = difference;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  };

  // 播放参考音
  const playReferenceNote = () => {
    if (!audioContext || isPlayingReference) return;
    
    setIsPlayingReference(true);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = targetString.frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.5);
    
    oscillatorRef.current = oscillator;
    
    setTimeout(() => {
      setIsPlayingReference(false);
    }, 1500);
  };

  // 调整目标音高
  const adjustPitch = (semitones) => {
    setAdjustModalData({ semitones, stringIndex: selectedString });
    setShowAdjustModal(true);
  };

  // 确认调整音高
  const handleConfirmAdjust = () => {
    const { semitones, stringIndex } = adjustModalData;
    // 这里可以实现实际的调音逻辑
    console.log(`调整第${stringIndex + 1}弦${semitones > 0 ? '升高' : '降低'}${Math.abs(semitones)}个半音`);
    setShowAdjustModal(false);
  };

  // 取消调整
  const handleCancelAdjust = () => {
    setShowAdjustModal(false);
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
    };
  }, [audioContext]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">吉他调音器网页版</h1>
            <p className="text-blue-600 cursor-pointer hover:underline">更多乐器点此访问</p>
          </div>

          {/* 主要调音界面 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* 钢琴键盘 */}
            <div className="mb-8">
              <div className="flex justify-center items-end h-32 mb-4">
                {pianoKeys.map((key, index) => (
                  <div
                    key={index}
                    className={`relative ${key.isBlack ? 'w-8 h-20 bg-gray-900 -mx-1 z-10' : 'w-12 h-32 bg-white border border-gray-300'} 
                    ${currentNote && currentNote.includes(key.note) ? 'bg-green-400' : ''}`}
                  >
                    {!key.isBlack && (
                      <div className="absolute bottom-2 w-full text-center text-xs text-gray-600">
                        {key.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 状态和控制 */}
            <div className="text-center mb-8">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-red-500 text-lg mb-2">
                  {listening ? '请点击下方"立即开始"按钮启动' : '请点击下方"立即开始"按钮启动'}
                </p>
                <p className="text-gray-600">
                  当前状态：{listening ? '已连接' : '未连接'}
                </p>
              </div>

              {listening ? (
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  onClick={stopTuner}
                >
                  停止调音
                </button>
              ) : (
                <button 
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  onClick={startTuner}
                >
                  立即开始
                </button>
              )}
            </div>

            {/* 调音状态显示 */}
            {listening && (
              <div className="text-center mb-8">
                <p className="text-lg mb-2">
                  {error ? '连接失败，您的设备拒绝了我获取音频权限的请求' : '通过 开启麦克风键盘 ，可以享受更自由的调音。'}
                </p>
                <p className="text-xl font-semibold">
                  正在调第{selectedString + 1}弦。对应钢琴第{targetString.fret + 1}键，钢琴音名{targetString.note.toLowerCase()}，频率：{targetString.frequency}Hz。
                </p>
              </div>
            )}

            {/* 调音模式选择 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">调音模式</label>
              <select 
                value={tuningMode} 
                onChange={(e) => setTuningMode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(tuningModes).map(([key, mode]) => (
                  <option key={key} value={key}>{mode.name}</option>
                ))}
              </select>
            </div>

            {/* 吉他指板可视化 */}
            <div className="mb-8">
              <div className="text-center mb-4">
                <p className="text-gray-600 mb-2">点击下方的弦，对点击的弦进行调音</p>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <div className="relative">
                    {/* 吉他指板 */}
                    <div className="w-80 h-48 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg relative overflow-hidden">
                      {/* 品丝 */}
                      {[0, 1, 2, 3, 4, 5].map((fret) => (
                        <div
                          key={fret}
                          className="absolute h-full w-1 bg-gray-300"
                          style={{ left: `${fret * 16}%` }}
                        />
                      ))}
                      
                      {/* 弦 */}
                      {currentStrings.map((string, index) => (
                        <div
                          key={index}
                          className={`absolute w-full h-1 cursor-pointer transition-all ${
                            selectedString === index ? 'bg-green-400' : 'bg-gray-800'
                          } ${listening && selectedString === index ? 'animate-pulse' : ''}`}
                          style={{ top: `${15 + index * 25}%` }}
                          onClick={() => setSelectedString(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 调音指示器 */}
            {listening && currentNote && (
              <div className="mb-8">
                <div className="text-center mb-4">
                  <div className="text-6xl font-bold mb-2">{currentNote}</div>
                  <div className="text-xl text-gray-600">{frequency} Hz</div>
                </div>
                
                {/* 调音指示器 */}
                <div className="relative w-full max-w-md mx-auto mb-4">
                  <div className="h-16 bg-gray-200 rounded-full relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 w-1 h-full bg-gray-600 transform -translate-x-1/2"></div>
                    <div 
                      className={`absolute top-2 h-12 w-6 rounded-full transition-all duration-300 transform -translate-x-1/2 ${
                        Math.abs(cents) < 10 ? 'bg-green-500' : Math.abs(cents) < 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        left: `calc(50% + ${Math.max(-120, Math.min(120, cents))}px)`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>低音 ♭</span>
                    <span className="font-semibold">{cents > 0 ? `+${cents}` : cents} 音分</span>
                    <span>高音 ♯</span>
                  </div>
                </div>
              </div>
            )}

            {/* 弦选择和控制 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {currentStrings.map((string, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedString === index ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedString(index)}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">{string.note}</div>
                    <div className="text-sm text-gray-600">{string.frequency} Hz</div>
                    <div className="text-xs text-gray-500">第{index + 1}弦</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 功能按钮 */}
            <div className="flex justify-center space-x-4 mb-8">
              <button 
                onClick={playReferenceNote}
                disabled={!audioContext || isPlayingReference}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {isPlayingReference ? '播放中...' : '播放参考音'}
              </button>
            </div>

            {/* 微调控制 */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">您也可以 
                <button 
                  onClick={() => adjustPitch(-1)}
                  className="mx-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  降低 -1
                </button> 
                或 
                <button 
                  onClick={() => adjustPitch(1)}
                  className="mx-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  升高 +1
                </button> 
                一个半音
              </p>
              <p className="text-xs text-gray-500">
                请注意：调音升高过多会导致琴弦断裂。的调音降低过多会导致音色效果不理想。
              </p>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">使用说明</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">基本使用</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>选择合适的调音模式</li>
                  <li>点击"立即开始"按钮并允许麦克风访问</li>
                  <li>选择要调的弦（点击指板上的弦或下方的弦按钮）</li>
                  <li>弹奏选中的吉他弦</li>
                  <li>观察调音指示器和数值显示</li>
                  <li>调整琴弦直到指示器居中且变为绿色</li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">高级功能</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>自动弦识别：系统会自动识别你弹奏的弦</li>
                  <li>参考音播放：点击"播放参考音"听标准音高</li>
                  <li>多种调音模式：支持标准、Drop D、降半音等</li>
                  <li>精确调音：显示音分差异，精度可达±1音分</li>
                  <li>实时反馈：指示器颜色变化显示调音状态</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 调音调整确认弹窗 */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">调音确认</h3>
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">
                将第{adjustModalData.stringIndex + 1}弦调整{adjustModalData.semitones > 0 ? '升高' : '降低'}{Math.abs(adjustModalData.semitones)}个半音
              </p>
              <p className="text-sm text-yellow-600">
                ⚠️ 请注意：调音升高过多会导致琴弦断裂，降低过多会导致音色效果不理想
              </p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={handleCancelAdjust}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmAdjust}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TunerPage;