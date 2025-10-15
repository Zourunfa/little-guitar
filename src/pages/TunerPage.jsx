import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const TunerPage = () => {
  // 基础状态
  const [isTuning, setIsTuning] = useState(false);
  const [currentNote, setCurrentNote] = useState('--');
  const [frequency, setFrequency] = useState(0);
  const [cents, setCents] = useState(0);
  const [selectedString, setSelectedString] = useState('6'); // 默认选择第6弦E2
  const [error, setError] = useState(null);
  
  // 音频相关状态
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  
  // 调音精度状态
  const [accuracyText, setAccuracyText] = useState('');
  const [accuracyColor, setAccuracyColor] = useState('#4CAF50');
  const [needlePosition, setNeedlePosition] = useState(50);
  const [needleColor, setNeedleColor] = useState('#ffffff');

  // 吉他标准调音频率（Hz）
  const guitarStrings = {
    '1': { note: 'E4', frequency: 329.63 },
    '2': { note: 'B3', frequency: 246.94 },
    '3': { note: 'G3', frequency: 196.00 },
    '4': { note: 'D3', frequency: 146.83 },
    '5': { note: 'A2', frequency: 110.00 },
    '6': { note: 'E2', frequency: 82.41 }
  };
  
  // 音名与频率映射
  const noteFrequencies = {
    'C': 16.35, 'C#': 17.32, 'D': 18.35, 'D#': 19.45,
    'E': 20.60, 'F': 21.83, 'F#': 23.12, 'G': 24.50,
    'G#': 25.96, 'A': 27.50, 'A#': 29.14, 'B': 30.87
  };

  // 切换调音状态
  const toggleTuning = () => {
    if (!isTuning) {
      startTuning();
    } else {
      stopTuning();
    }
  };

  // 开始调音
  const startTuning = async () => {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !window.AudioContext) {
        setError("您的浏览器不支持调音功能，请使用Chrome、Firefox或Edge等现代浏览器");
        return;
      }

      // 请求麦克风权限
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
      }

      setIsTuning(true);
      setError(null);
      
      // 创建音频上下文
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 32768;
      analyserNode.smoothingTimeConstant = 0.8;
      const mic = context.createMediaStreamSource(stream);
      
      // 设置分析器
      setAudioContext(context);
      setAnalyser(analyserNode);
      setMicrophone(mic);
      
      // 连接音频节点
      mic.connect(analyserNode);
      
      console.log('音频节点连接完成，开始音频处理循环');
      
      console.log('音频设置完成');
      
    } catch (err) {
      console.error("麦克风访问错误:", err);
      let errorMessage = '无法访问麦克风。';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '麦克风权限被拒绝。请允许网站访问麦克风权限。';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到麦克风设备。请检查您的麦克风连接。';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '您的浏览器不支持麦克风功能。';
      } else {
        errorMessage = `麦克风错误: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsTuning(false);
    }
  };

  // 停止调音
  const stopTuning = () => {
    console.log('停止调音...');
    
    setIsTuning(false);
    
    // 取消动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (microphone) {
      microphone.disconnect();
      setMicrophone(null);
    }
    
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    
    setAnalyser(null);
    
    // 重置显示
    setCurrentNote("--");
    setFrequency(0);
    setAccuracyText("");
    setNeedlePosition(50);
  };

  // 音频处理循环引用
  const animationFrameRef = useRef(null);

  // 处理音频数据 - 使用FFT频域分析
  const processAudio = useCallback(() => {
    if (!analyser || !isTuning) return;
    
    // 使用频域数据而不是时域数据
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(dataArray);
    
    // 检查是否有音频输入
    const sum = dataArray.reduce((acc, val) => acc + Math.abs(val), 0);
    if (sum === 0) {
      console.log('没有音频输入');
    } else {
      console.log('音频输入正常，总和:', sum);
    }
    
    // 使用FFT检测基频
    const detectedFrequency = findFundamentalFrequency(dataArray, audioContext.sampleRate);
    
    if (detectedFrequency > 0 && detectedFrequency < 1000) {
      console.log('检测到频率:', detectedFrequency);
      // 更新显示
      updateDisplay(detectedFrequency);
    }
    
    // 继续处理音频（重要！）
    if (isTuning) {
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  }, [analyser, isTuning, audioContext, updateDisplay]);

  // 使用FFT频域分析查找基频
  const findFundamentalFrequency = (freqData, sampleRate) => {
    const bufferLength = freqData.length;
    const nyquist = sampleRate / 2;
    
    // 寻找频谱中的峰值
    let maxMagnitude = -Infinity;
    let peakIndex = -1;
    
    // 只搜索可能的吉他频率范围 (50Hz - 500Hz)
    const minIndex = Math.floor(50 * bufferLength / nyquist);
    const maxIndex = Math.floor(500 * bufferLength / nyquist);
    
    for (let i = minIndex; i < maxIndex; i++) {
      if (freqData[i] > maxMagnitude) {
        maxMagnitude = freqData[i];
        peakIndex = i;
      }
    }
    
    // 如果找到明显的峰值
    if (peakIndex !== -1 && maxMagnitude > -100) {
      // 计算精确频率
      const detectedFrequency = peakIndex * nyquist / bufferLength;
      
      // 使用谐波乘积谱方法提高基频检测精度
      return refineFrequencyWithHPS(freqData, detectedFrequency, sampleRate);
    }
    
    return -1;
  };

  // 使用谐波乘积谱方法精炼频率
  const refineFrequencyWithHPS = (freqData, roughFreq, sampleRate) => {
    const bufferLength = freqData.length;
    const nyquist = sampleRate / 2;
    
    // 创建谐波乘积谱
    let hps = new Array(bufferLength).fill(0);
    
    // 计算不同下采样率的乘积
    for (let i = 0; i < bufferLength; i++) {
      let product = 1;
      for (let downsampling = 1; downsampling <= 4; downsampling++) {
        const downsampledIndex = Math.floor(i / downsampling);
        if (downsampledIndex < bufferLength) {
          // 将分贝值转换为幅度
          const magnitude = Math.pow(10, freqData[downsampledIndex] / 20);
          product *= magnitude;
        }
      }
      hps[i] = product;
    }
    
    // 在粗略频率附近寻找HPS峰值
    const searchRange = Math.floor(10 * bufferLength / nyquist); // ±10Hz
    const centerIndex = Math.floor(roughFreq * bufferLength / nyquist);
    const startIndex = Math.max(0, centerIndex - searchRange);
    const endIndex = Math.min(bufferLength - 1, centerIndex + searchRange);
    
    let maxHPS = 0;
    let bestIndex = centerIndex;
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (hps[i] > maxHPS) {
        maxHPS = hps[i];
        bestIndex = i;
      }
    }
    
    return bestIndex * nyquist / bufferLength;
  };

  // 更新显示
  const updateDisplay = useCallback((detectedFrequency) => {
    console.log('更新显示:', detectedFrequency);
    
    // 显示频率
    setFrequency(parseFloat(detectedFrequency.toFixed(2)));
    
    // 找到最接近的音符
    const closestNote = findClosestNote(detectedFrequency);
    setCurrentNote(closestNote.name);
    
    // 计算与目标弦的偏差
    const targetFrequency = guitarStrings[selectedString].frequency;
    const centsOff = calculateCents(detectedFrequency, targetFrequency);
    setCents(parseFloat(centsOff.toFixed(1)));
    
    // 更新调音指针
    updateTuningNeedle(centsOff);
    
    // 更新精度显示
    updateAccuracyDisplay(centsOff);
  }, [selectedString]);

  // 找到最接近的音符
  const findClosestNote = (detectedFrequency) => {
    // 计算C0以上的半音数
    const semitonesFromC0 = 12 * Math.log2(detectedFrequency / noteFrequencies['C']);
    
    // 计算八度和音名索引
    const octave = Math.floor(semitonesFromC0 / 12);
    const noteIndex = Math.round(semitonesFromC0 % 12);
    
    // 获取音名
    const noteNames = Object.keys(noteFrequencies);
    const noteName = noteNames[noteIndex];
    
    return {
      name: noteName + (octave + 1), // +1 因为C0对应八度1
      frequency: noteFrequencies[noteName] * Math.pow(2, octave)
    };
  };

  // 计算音分偏差
  const calculateCents = (detectedFrequency, targetFrequency) => {
    return 1200 * Math.log2(detectedFrequency / targetFrequency);
  };

  // 更新调音指针
  const updateTuningNeedle = (centsOff) => {
    // 限制指针移动范围（±50音分）
    const limitedCents = Math.max(-50, Math.min(50, centsOff));
    
    // 计算指针位置（从-50到+50音分映射到0%到100%）
    const position = 50 + (limitedCents / 50) * 50;
    setNeedlePosition(position);
    
    // 根据偏差改变指针颜色
    if (Math.abs(centsOff) < 5) {
      setNeedleColor("#4CAF50"); // 绿色 - 准确
    } else if (Math.abs(centsOff) < 20) {
      setNeedleColor("#FFC107"); // 黄色 - 接近
    } else {
      setNeedleColor("#F44336"); // 红色 - 偏离
    }
  };

  // 更新精度显示
  const updateAccuracyDisplay = (centsOff) => {
    const absCents = Math.abs(centsOff);
    
    if (absCents < 2) {
      setAccuracyText("完美!");
      setAccuracyColor("#4CAF50");
    } else if (absCents < 5) {
      setAccuracyText("非常接近");
      setAccuracyColor("#8BC34A");
    } else if (absCents < 10) {
      setAccuracyText("接近");
      setAccuracyColor("#FFC107");
    } else if (absCents < 20) {
      setAccuracyText("需要调整");
      setAccuracyColor("#FF9800");
    } else {
      setAccuracyText("偏离太多");
      setAccuracyColor("#F44336");
    }
    
    // 显示具体偏差
    const sign = centsOff > 0 ? '+' : '-';
    setAccuracyText(prev => `${prev} (${sign}${Math.abs(centsOff).toFixed(1)}音分)`);
  };

  // 选择吉他弦
  const handleStringSelect = (stringNumber) => {
    setSelectedString(stringNumber);
  };

  // 启动音频处理循环
  useEffect(() => {
    if (isTuning && analyser && audioContext) {
      console.log('启动音频处理循环');
      processAudio();
    }
  }, [isTuning, analyser, audioContext, processAudio]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
              🎸 吉他调音器
            </h1>
            <p className="text-xl text-gray-300">基于Web Audio API的纯前端调音工具</p>
          </div>

          {/* 主调音容器 */}
          <div className="bg-black/30 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/10">
            {/* 调音显示区域 */}
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
              <div className="text-center mb-6">
                <div className="text-8xl font-bold mb-4 text-yellow-400">
                  {currentNote}
                </div>
                <div className="text-2xl text-gray-300 mb-2">
                  频率: {frequency.toFixed(2)} Hz
                </div>
              </div>
              
              {/* 调音指示器 */}
              <div className="relative mb-6">
                <div className="h-6 bg-white/20 rounded-full relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 w-1 h-full bg-green-500 transform -translate-x-1/2"></div>
                  <div 
                    className="absolute top-1 h-4 w-4 rounded-full transition-all duration-300 transform -translate-x-1/2"
                    style={{ 
                      left: `${needlePosition}%`,
                      backgroundColor: needleColor
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>-50音分</span>
                  <span className="font-semibold text-green-400">准确</span>
                  <span>+50音分</span>
                </div>
              </div>
              
              {/* 精度显示 */}
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: accuracyColor }}
                >
                  {accuracyText}
                </div>
              </div>
            </div>

            {/* 状态显示 */}
            <div className="text-center mb-8">
              <p className="text-lg mb-4">
                {isTuning ? '调音器已启动，请弹响选中的琴弦' : '点击"开始调音"按钮并允许麦克风访问'}
              </p>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
            </div>

            {/* 弦选择区域 */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-center mb-6">选择要调的弦</h3>
              <div className="grid grid-cols-6 gap-4">
                {Object.entries(guitarStrings).map(([stringNum, stringData]) => (
                  <motion.button
                    key={stringNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-6 rounded-2xl transition-all duration-200 ${
                      selectedString === stringNum 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-2xl transform scale-105' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40'
                    }`}
                    onClick={() => handleStringSelect(stringNum)}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        ① {stringData.note}
                      </div>
                      <div className={`text-sm mb-1 ${
                        selectedString === stringNum ? 'text-black/70' : 'text-gray-400'
                      }`}>
                        {stringData.frequency}Hz
                      </div>
                      <div className={`text-xs ${
                        selectedString === stringNum ? 'text-black/60' : 'text-gray-500'
                      }`}>
                        第{stringNum}弦
                      </div>
                    </div>
                    {selectedString === stringNum && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-sm text-black">✓</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center gap-4 mb-8">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isTuning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                onClick={toggleTuning}
              >
                {isTuning ? '停止调音' : '开始调音'}
              </motion.button>
            </div>

            {/* 使用说明 */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-4 text-center">使用说明</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">基本步骤</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>点击"开始调音"按钮并允许浏览器访问您的麦克风</li>
                    <li>选择要调音的吉他弦（默认选择第6弦E2）</li>
                    <li>弹响选中的琴弦，调音器将显示检测到的音高和频率</li>
                    <li>根据指示调整琴弦，直到指针位于中央绿色区域</li>
                    <li>重复此过程，为所有琴弦调音</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">技术特点</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>使用FFT频域分析技术，精确检测音高</li>
                    <li>采用谐波乘积谱(HPS)算法提高检测精度</li>
                    <li>支持±50音分的精确调音指示</li>
                    <li>实时音频处理，响应速度快</li>
                    <li>纯前端实现，无需服务器支持</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TunerPage;
