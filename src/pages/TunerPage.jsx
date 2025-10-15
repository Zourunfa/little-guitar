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

  // 音频历史数据 - 用于绘制时间轴波形
  const [pitchHistory, setPitchHistory] = useState([]);
  const maxHistoryLength = 100; // 最多保存100个历史数据点

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
    setPitchHistory([]); // 清空历史数据
  };

  // 音频处理循环引用
  const animationFrameRef = useRef(null);
  const isTuningRef = useRef(false);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  // 更新 refs
  useEffect(() => {
    isTuningRef.current = isTuning;
  }, [isTuning]);

  useEffect(() => {
    analyserRef.current = analyser;
  }, [analyser]);

  useEffect(() => {
    audioContextRef.current = audioContext;
  }, [audioContext]);

  // 使用FFT频域分析查找基频
  const findFundamentalFrequency = useCallback((freqData, sampleRate) => {
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
  }, []);

  // 使用谐波乘积谱方法精炼频率
  const refineFrequencyWithHPS = useCallback((freqData, roughFreq, sampleRate) => {
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
  }, []);

  // 找到最接近的音符
  const findClosestNote = useCallback((detectedFrequency) => {
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
  }, []);

  // 计算音分偏差
  const calculateCents = useCallback((detectedFrequency, targetFrequency) => {
    return 1200 * Math.log2(detectedFrequency / targetFrequency);
  }, []);

  // 更新调音指针
  const updateTuningNeedle = useCallback((centsOff) => {
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
  }, []);

  // 更新精度显示
  const updateAccuracyDisplay = useCallback((centsOff) => {
    const absCents = Math.abs(centsOff);

    let text = '';
    let color = '';

    if (absCents < 2) {
      text = "完美!";
      color = "#4CAF50";
    } else if (absCents < 5) {
      text = "非常接近";
      color = "#8BC34A";
    } else if (absCents < 10) {
      text = "接近";
      color = "#FFC107";
    } else if (absCents < 20) {
      text = "需要调整";
      color = "#FF9800";
    } else {
      text = "偏离太多";
      color = "#F44336";
    }

    // 显示具体偏差
    const sign = centsOff > 0 ? '+' : '-';
    text = `${text} (${sign}${Math.abs(centsOff).toFixed(1)}音分)`;

    setAccuracyText(text);
    setAccuracyColor(color);
  }, []);

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

    // 添加到历史数据
    setPitchHistory(prev => {
      const newHistory = [...prev, {
        cents: centsOff,
        frequency: detectedFrequency,
        timestamp: Date.now()
      }];
      // 保持最多100个数据点
      if (newHistory.length > maxHistoryLength) {
        return newHistory.slice(-maxHistoryLength);
      }
      return newHistory;
    });
  }, [selectedString, findClosestNote, calculateCents, updateTuningNeedle, updateAccuracyDisplay]);

  // 处理音频数据 - 使用FFT频域分析
  const processAudio = useCallback(() => {
    const currentAnalyser = analyserRef.current;
    const currentAudioContext = audioContextRef.current;
    const currentIsTuning = isTuningRef.current;

    if (!currentAnalyser || !currentAudioContext || !currentIsTuning) {
      return;
    }

    // 使用频域数据而不是时域数据
    const bufferLength = currentAnalyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    currentAnalyser.getFloatFrequencyData(dataArray);

    // 检查是否有音频输入
    const sum = dataArray.reduce((acc, val) => acc + Math.abs(val), 0);
    if (sum === 0) {
      console.log('没有音频输入');
    } else {
      console.log('音频输入正常，总和:', sum);
    }

    // 使用FFT检测基频
    const detectedFrequency = findFundamentalFrequency(dataArray, currentAudioContext.sampleRate);

    if (detectedFrequency > 0 && detectedFrequency < 1000) {
      console.log('检测到频率:', detectedFrequency);
      // 更新显示
      updateDisplay(detectedFrequency);
    }

    // 继续处理音频（重要！）
    if (currentIsTuning) {
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  }, [findFundamentalFrequency, updateDisplay]);

  // 选择吉他弦
  const handleStringSelect = (stringNumber) => {
    setSelectedString(stringNumber);
  };

  // 启动音频处理循环
  useEffect(() => {
    if (isTuning && analyser && audioContext) {
      console.log('启动音频处理循环');
      // 启动处理循环
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }

    // 清理函数：停止音频处理
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
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
            {/* 实时音频波形展示区域 - 扩大显示 */}
            <div className="bg-black/50 rounded-2xl p-6 mb-8 border-2 border-green-500/30">
              {/* 顶部信息栏 */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-left">
                  <div className="text-6xl font-bold text-yellow-400 mb-2">
                    {currentNote}
                  </div>
                  <div className="text-xl text-gray-300">
                    频率: {frequency.toFixed(2)} Hz
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold mb-2" style={{ color: accuracyColor }}>
                    {accuracyText}
                  </div>
                  <div className="text-lg text-gray-400">
                    目标: {guitarStrings[selectedString].note} ({guitarStrings[selectedString].frequency.toFixed(2)} Hz)
                  </div>
                </div>
              </div>

              {/* 实时音高波形图 - 横轴表示音高偏差,纵轴表示时间 */}
              <div className="relative bg-black/70 rounded-xl p-4 border border-green-500/20" style={{ height: '500px' }}>
                {/* 中心线 - 标准音高 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-green-500 transform -translate-x-1/2 z-10">
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    标准音高
                  </div>
                </div>

                {/* 偏差区域标记 */}
                <div className="absolute inset-0 flex">
                  {/* 左侧偏低区域 */}
                  <div className="flex-1 bg-red-500/5 border-r-2 border-red-500/20">
                    <div className="absolute left-2 top-2 text-red-400 text-sm">偏低</div>
                  </div>
                  {/* 中央准确区域 */}
                  <div className="w-32 bg-green-500/10">
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-2 text-green-400 text-sm">准确区域</div>
                  </div>
                  {/* 右侧偏高区域 */}
                  <div className="flex-1 bg-blue-500/5 border-l-2 border-blue-500/20">
                    <div className="absolute right-2 top-2 text-blue-400 text-sm">偏高</div>
                  </div>
                </div>

                {/* 刻度标记 */}
                <div className="absolute inset-x-0 top-12 flex justify-between px-4 text-xs text-gray-500">
                  <span>-50音分</span>
                  <span>-25</span>
                  <span className="text-green-400 font-bold">0</span>
                  <span>+25</span>
                  <span>+50音分</span>
                </div>

                {/* SVG 波形绘制 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 20 }}>
                  {pitchHistory.length > 1 && pitchHistory.map((point, index) => {
                    if (index === 0) return null;

                    const prevPoint = pitchHistory[index - 1];

                    // 计算位置
                    // X轴: cents 从 -50 到 +50 映射到 0% 到 100%
                    const getX = (cents) => {
                      const limitedCents = Math.max(-50, Math.min(50, cents));
                      return ((limitedCents + 50) / 100) * 100; // 转换为百分比
                    };

                    // Y轴: 从底部往上,最新的数据在底部
                    const getY = (idx) => {
                      const progress = (pitchHistory.length - idx) / maxHistoryLength;
                      return 100 - (progress * 90 + 5); // 5% 边距
                    };

                    const x1 = getX(prevPoint.cents);
                    const y1 = getY(index - 1);
                    const x2 = getX(point.cents);
                    const y2 = getY(index);

                    // 根据偏差程度设置颜色
                    const getColor = (cents) => {
                      const absCents = Math.abs(cents);
                      if (absCents < 5) return '#4CAF50'; // 绿色 - 准确
                      if (absCents < 20) return '#FFC107'; // 黄色 - 接近
                      return '#F44336'; // 红色 - 偏离
                    };

                    return (
                      <line
                        key={index}
                        x1={`${x1}%`}
                        y1={`${y1}%`}
                        x2={`${x2}%`}
                        y2={`${y2}%`}
                        stroke={getColor(point.cents)}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    );
                  })}

                  {/* 当前点 */}
                  {pitchHistory.length > 0 && (() => {
                    const lastPoint = pitchHistory[pitchHistory.length - 1];
                    const getX = (cents) => {
                      const limitedCents = Math.max(-50, Math.min(50, cents));
                      return ((limitedCents + 50) / 100) * 100;
                    };
                    const x = getX(lastPoint.cents);
                    const getColor = (cents) => {
                      const absCents = Math.abs(cents);
                      if (absCents < 5) return '#4CAF50';
                      if (absCents < 20) return '#FFC107';
                      return '#F44336';
                    };

                    return (
                      <circle
                        cx={`${x}%`}
                        cy="95%"
                        r="6"
                        fill={getColor(lastPoint.cents)}
                        stroke="white"
                        strokeWidth="2"
                      >
                        <animate
                          attributeName="r"
                          values="6;8;6"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    );
                  })()}
                </svg>

                {/* 无数据提示 */}
                {pitchHistory.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-500 text-xl">
                      {isTuning ? '等待音频输入...' : '点击"开始调音"查看实时波形'}
                    </div>
                  </div>
                )}
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

            {/* 弦选择区域 - 紧凑版 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-300">选择要调的弦</h3>
              <div className="grid grid-cols-6 gap-3">
                {Object.entries(guitarStrings).map(([stringNum, stringData]) => (
                  <motion.button
                    key={stringNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 rounded-xl transition-all duration-200 ${
                      selectedString === stringNum
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/50'
                        : 'bg-white/10 hover:bg-white/15 border border-white/20 hover:border-green-400/50'
                    }`}
                    onClick={() => handleStringSelect(stringNum)}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {stringData.note}
                      </div>
                      <div className={`text-xs ${
                        selectedString === stringNum ? 'text-white/90' : 'text-gray-400'
                      }`}>
                        第{stringNum}弦
                      </div>
                    </div>
                    {selectedString === stringNum && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-black font-bold">✓</span>
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

            {/* 使用说明 - 简洁版 */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4 text-center text-yellow-400">📖 使用说明</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-semibold mb-3 text-green-400">🎯 调音步骤</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>点击"开始调音"并允许麦克风访问</li>
                    <li>选择要调的琴弦</li>
                    <li>弹响琴弦,观察波形图</li>
                    <li>调整琴弦至波形线在中央绿色区域</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-3 text-blue-400">💡 波形说明</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li><span className="text-green-400">●</span> 绿色波形 = 音准准确</li>
                    <li><span className="text-yellow-400">●</span> 黄色波形 = 接近目标</li>
                    <li><span className="text-red-400">●</span> 红色波形 = 需要调整</li>
                    <li>波形从下往上滚动显示时间变化</li>
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
