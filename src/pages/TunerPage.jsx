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
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [waveformData, setWaveformData] = useState(new Uint8Array(256));
  const pitchCanvasRef = useRef(null);
  const [pitchHistory, setPitchHistory] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const volumeAnimationRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState({ rms: 0, pitch1: 0, pitch2: 0 });
  const [rawAudioData, setRawAudioData] = useState({ sum: 0, max: 0, nonZero: 0 });

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
      // 更好的 AudioContext 配置
      const context = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
      
      // 确保 AudioContext 处于运行状态
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      setAudioContext(context);

      // 先尝试简单配置（和测试麦克风一样）
      let stream;
      try {
        console.log('尝试简单麦克风配置...');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('简单配置成功');
      } catch (err) {
        console.log('简单配置失败，尝试详细配置...', err);
        // 如果简单配置失败，尝试详细配置
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,  // 关闭回声消除
            noiseSuppression: false,  // 关闭噪音抑制
            autoGainControl: false,   // 关闭自动增益控制
            sampleRate: 44100,        // 设置采样率
            channelCount: 1,          // 单声道
            volume: 1.0               // 最大音量
          }
        });
      }
      
      console.log('麦克风流获取成功:', stream);
      console.log('音频轨道:', stream.getAudioTracks());
      
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 4096;
      analyserNode.smoothingTimeConstant = 0.3;  // 降低平滑度以提高响应性
      analyserNode.minDecibels = -90;            // 设置最小分贝
      analyserNode.maxDecibels = -10;            // 设置最大分贝
      setAnalyzer(analyserNode);

      const microphone = context.createMediaStreamSource(stream);
      
      // 先试试直接连接（不用增益节点）
      console.log('直接连接麦克风到分析器...');
      microphone.connect(analyserNode);
      
      // 验证连接
      console.log('音频节点连接信息:', {
        microphone: microphone,
        analyser: analyserNode,
        context: context,
        contextState: context.state,
        sampleRate: context.sampleRate
      });

      setListening(true);
      setError(null);
      
      console.log('开始音频分析...');
      analyzeAudio(analyserNode, context);
      startVisualization(analyserNode);
      startVolumeMonitoring(analyserNode);
      
      // 测试音频输入 - 多次测试
      let testCount = 0;
      const testAudioInput = () => {
        const freqArray = new Uint8Array(analyserNode.frequencyBinCount);
        const timeArray = new Float32Array(analyserNode.fftSize);
        
        analyserNode.getByteFrequencyData(freqArray);
        analyserNode.getFloatTimeDomainData(timeArray);
        
        const freqSum = freqArray.reduce((a, b) => a + b, 0);
        let rms = 0;
        for (let i = 0; i < timeArray.length; i++) {
          rms += timeArray[i] * timeArray[i];
        }
        rms = Math.sqrt(rms / timeArray.length);
        
        console.log(`音频测试 ${testCount + 1}:`, {
          freqSum: freqSum,
          freqAvg: (freqSum / freqArray.length).toFixed(2),
          rms: rms.toFixed(6),
          maxFreq: Math.max(...freqArray),
          maxTime: Math.max(...timeArray.map(Math.abs))
        });
        
        testCount++;
        if (testCount < 5) {
          setTimeout(testAudioInput, 500);
        } else {
          console.log('音频测试完成。如果所有值都是0，说明音频流有问题。');
        }
      };
      
      setTimeout(testAudioInput, 500);
      
    } catch (err) {
      console.error('麦克风访问错误:', err);
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
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }
    setListening(false);
    setCurrentNote(null);
    setFrequency(0);
    setCents(0);
    setPitchHistory([]);
    setAudioLevel(0);
    setPeakLevel(0);
    setDebugInfo({ rms: 0, pitch1: 0, pitch2: 0 });
  };

  // 分析音频并检测音高
  const analyzeAudio = (analyserNode, context) => {
    const bufferLength = analyserNode.fftSize;
    const timeData = new Float32Array(bufferLength);
    const freqData = new Uint8Array(analyserNode.frequencyBinCount);
    
    const detectPitch = () => {
      if (!listening) return;
      
      // 获取时域和频域数据
      analyserNode.getFloatTimeDomainData(timeData);
      analyserNode.getByteFrequencyData(freqData);
      
      // 检查是否有足够的音频信号
      let rmsLevel = 0;
      for (let i = 0; i < timeData.length; i++) {
        rmsLevel += timeData[i] * timeData[i];
      }
      rmsLevel = Math.sqrt(rmsLevel / timeData.length);
      
      // 如果信号太弱，跳过音高检测
      if (rmsLevel < 0.01) {
        console.log('信号太弱，跳过音高检测, RMS:', rmsLevel);
        requestAnimationFrame(detectPitch);
        return;
      }
      
      // 使用多种方法检测音高
      const pitch1 = detectPitchFFT(freqData, context.sampleRate, analyserNode.frequencyBinCount);
      const pitch2 = detectPitchAutocorrelation(timeData, context.sampleRate);
      
      // 选择最可靠的音高
      let pitch = 0;
      if (pitch1 > 0 && pitch2 > 0) {
        // 如果两个结果相近，取平均值
        const ratio = Math.max(pitch1, pitch2) / Math.min(pitch1, pitch2);
        if (ratio < 1.1) { // 相差不超过10%
          pitch = (pitch1 + pitch2) / 2;
        } else {
          pitch = pitch1; // FFT方法通常更准确
        }
      } else if (pitch1 > 0) {
        pitch = pitch1;
      } else if (pitch2 > 0) {
        pitch = pitch2;
      }
      
      // 更新调试信息
      setDebugInfo({
        rms: rmsLevel,
        pitch1: pitch1 || 0,
        pitch2: pitch2 || 0
      });
      
      console.log('音高检测结果:', {
        rms: rmsLevel.toFixed(4),
        fft: pitch1 ? pitch1.toFixed(2) : 'none',
        autocorr: pitch2 ? pitch2.toFixed(2) : 'none',
        final: pitch ? pitch.toFixed(2) : 'none'
      });
      
      // 音高范围过滤 (吉他音高范围: 80-400Hz)
      if (pitch > 70 && pitch < 500) {
        setFrequency(Math.round(pitch * 100) / 100);
        
        // 自动识别最接近的弦
        const closestStringIndex = findClosestString(pitch);
        setSelectedString(closestStringIndex);
        
        const currentString = currentStrings[closestStringIndex];
        setCurrentNote(currentString.note);
        
        // 计算音分差异
        const centsOff = 1200 * Math.log2(pitch / currentString.frequency);
        setCents(Math.round(centsOff * 10) / 10);
        
        console.log('更新音高信息:', {
          frequency: pitch.toFixed(2),
          note: currentString.note,
          cents: centsOff.toFixed(1)
        });
        
        // 添加到音高历史记录
        setPitchHistory(prev => {
          const newHistory = [...prev, { 
            frequency: pitch, 
            cents: centsOff, 
            targetFreq: currentString.frequency,
            stringIndex: closestStringIndex,
            timestamp: Date.now()
          }];
          // 只保留最近50个数据点
          return newHistory.slice(-50);
        });
      }
      
      requestAnimationFrame(detectPitch);
    };
    
    detectPitch();
  };

  // FFT 方法检测音高（找到最强的频率峰值）
  const detectPitchFFT = (freqData, sampleRate, freqBinCount) => {
    // 找到最大峰值
    let maxIndex = 0;
    let maxValue = 0;
    
    // 只检查吉他频率范围对应的bin (大约80-500Hz)
    const minBin = Math.floor(80 * freqBinCount / (sampleRate / 2));
    const maxBin = Math.floor(500 * freqBinCount / (sampleRate / 2));
    
    for (let i = minBin; i < Math.min(maxBin, freqData.length); i++) {
      if (freqData[i] > maxValue) {
        maxValue = freqData[i];
        maxIndex = i;
      }
    }
    
    // 如果峰值不够强，返回0
    if (maxValue < 50) { // 阈值可以调整
      return 0;
    }
    
    // 转换bin索引到频率
    const frequency = maxIndex * sampleRate / 2 / freqBinCount;
    return frequency;
  };

  // 自相关方法检测音高
  const detectPitchAutocorrelation = (buffer, sampleRate) => {
    // 寻找周期性模式
    const bufferSize = buffer.length;
    const autocorrelation = new Array(bufferSize);
    
    // 计算自相关
    for (let t = 0; t < bufferSize; t++) {
      let sum = 0;
      for (let i = 0; i < bufferSize - t; i++) {
        sum += buffer[i] * buffer[i + t];
      }
      autocorrelation[t] = sum;
    }
    
    // 找到第一个局部最大值（跳过t=0）
    const minT = Math.floor(sampleRate / 500); // 对应500Hz
    const maxT = Math.floor(sampleRate / 80);  // 对应80Hz
    
    let maxValue = autocorrelation[minT];
    let maxIndex = minT;
    
    for (let t = minT; t < Math.min(maxT, autocorrelation.length); t++) {
      if (autocorrelation[t] > maxValue) {
        maxValue = autocorrelation[t];
        maxIndex = t;
      }
    }
    
    // 检查是否找到了清晰的周期
    if (maxValue < autocorrelation[0] * 0.3) { // 相关性阈值
      return 0;
    }
    
    return sampleRate / maxIndex;
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

  // 开始音频可视化
  const startVisualization = (analyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!listening) return;

      animationRef.current = requestAnimationFrame(draw);
      
      analyserNode.getByteFrequencyData(dataArray);
      setWaveformData(new Uint8Array(dataArray));

      // 清空画布
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制频谱
      const barWidth = canvas.width / bufferLength * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // 根据频率范围设置颜色
        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      // 绘制波形
      analyserNode.getByteTimeDomainData(dataArray);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff88';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
    };

    draw();
  };

  // 开始音量监测（简化版，和测试麦克风相同的方法）
  const startVolumeMonitoring = (analyserNode) => {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitorVolume = () => {
      if (!listening) return;

      volumeAnimationRef.current = requestAnimationFrame(monitorVolume);
      
      // 使用和测试麦克风相同的方法
      analyserNode.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / bufferLength;
      const currentLevel = (average / 255) * 100;
      
      // 更新原始音频数据状态
      setRawAudioData({
        sum: sum,
        max: Math.max(...dataArray),
        nonZero: dataArray.filter(x => x > 0).length
      });
      
      // 调试输出 - 每秒输出一次
      if (Math.random() < 0.02) { // 大约每秒输出一次
        console.log('音量监测数据:', {
          sum: sum,
          average: average.toFixed(2),
          level: currentLevel.toFixed(2),
          maxValue: Math.max(...dataArray),
          nonZeroCount: dataArray.filter(x => x > 0).length
        });
      }
      
      // 更新当前音量
      setAudioLevel(currentLevel);
      
      // 更新峰值音量（逐渐衰减）
      setPeakLevel(prev => {
        if (currentLevel > prev) {
          return currentLevel;
        } else {
          return Math.max(0, prev - 0.3);
        }
      });
    };

    monitorVolume();
  };

  // 绘制音高和调音关系图
  const drawPitchVisualization = () => {
    const canvas = pitchCanvasRef.current;
    if (!canvas || pitchHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 绘制背景网格
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // 水平网格线 (音分刻度)
    for (let i = -50; i <= 50; i += 10) {
      const y = height/2 - (i * height/100);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // 标记音分值
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${i > 0 ? '+' : ''}${i}分`, 5, y - 5);
    }

    // 绘制6根弦的目标频率线
    currentStrings.forEach((string, index) => {
      const color = index === selectedString ? '#ef4444' : '#94a3b8';
      ctx.strokeStyle = color;
      ctx.lineWidth = index === selectedString ? 3 : 1;
      
      // 计算弦的y位置 (基于标准调音)
      const baseFreq = 82.41; // E2 最低弦
      const semitones = Math.log2(string.frequency / baseFreq) * 12;
      const y = height - (semitones / 30 * height);
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // 标记弦信息
      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${string.note} (${string.frequency}Hz)`, width - 120, y - 5);
    });

    // 绘制当前音高历史曲线
    if (pitchHistory.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();

      pitchHistory.forEach((point, index) => {
        const x = (index / (pitchHistory.length - 1)) * width;
        const y = height/2 - (point.cents * height/100);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();

      // 绘制当前音高点
      const lastPoint = pitchHistory[pitchHistory.length - 1];
      const lastX = width - 10;
      const lastY = height/2 - (lastPoint.cents * height/100);
      
      ctx.fillStyle = Math.abs(lastPoint.cents) < 10 ? '#10b981' : 
                      Math.abs(lastPoint.cents) < 30 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // 显示当前频率和音分信息
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${lastPoint.frequency.toFixed(2)} Hz`, lastX - 70, lastY - 15);
      ctx.fillText(`${lastPoint.cents > 0 ? '+' : ''}${lastPoint.cents.toFixed(1)} 音分`, lastX - 70, lastY + 25);
    }

    // 绘制中心线 (完美调音线)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制标题和说明
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('实时音高调音图', 20, 30);
    
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('绿色曲线: 当前音高  |  红色线: 当前选中弦  |  灰色线: 其他弦', 20, 50);
    ctx.fillText('绿色虚线: 完美调音 (0音分)  |  上方: 音高偏高  |  下方: 音高偏低', 20, 65);
  };

  // 更新音高可视化
  useEffect(() => {
    if (listening && pitchHistory.length > 0) {
      drawPitchVisualization();
    }
  }, [pitchHistory, selectedString, tuningMode, listening]);

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

  // 测试麦克风功能
  const testMicrophone = async () => {
    try {
      console.log('开始麦克风测试...');
      
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('您的浏览器不支持麦克风访问功能');
        return;
      }
      
      // 获取可用的音频设备
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('可用音频输入设备:', audioInputs);
      
      if (audioInputs.length === 0) {
        alert('未找到任何麦克风设备');
        return;
      }
      
      // 测试基本麦克风访问
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('麦克风权限获取成功');
      
      // 创建简单的音频分析器
      const testContext = new AudioContext();
      const testAnalyser = testContext.createAnalyser();
      const testSource = testContext.createMediaStreamSource(stream);
      testSource.connect(testAnalyser);
      
      // 测试音频数据
      const testData = new Uint8Array(testAnalyser.frequencyBinCount);
      
      let testCount = 0;
      const testInterval = setInterval(() => {
        testAnalyser.getByteFrequencyData(testData);
        const sum = testData.reduce((a, b) => a + b, 0);
        console.log(`测试 ${testCount + 1}: 音频数据总和 = ${sum}`);
        
        testCount++;
        if (testCount >= 5) {
          clearInterval(testInterval);
          stream.getTracks().forEach(track => track.stop());
          testContext.close();
          
          if (sum > 0) {
            alert('麦克风测试成功！检测到音频输入。');
          } else {
            alert('麦克风测试失败：未检测到音频输入。请检查麦克风设置或尝试说话。');
          }
        }
      }, 500);
      
    } catch (error) {
      console.error('麦克风测试失败:', error);
      alert(`麦克风测试失败: ${error.message}`);
    }
  };

  // 即时诊断音频流（只在调音器运行时可用）
  const diagnoseAudioStream = () => {
    if (!analyzer || !listening) {
      alert('请先启动调音器');
      return;
    }

    console.log('=== 即时音频流诊断 ===');
    
    // 检查分析器状态
    console.log('分析器状态:', {
      fftSize: analyzer.fftSize,
      frequencyBinCount: analyzer.frequencyBinCount,
      sampleRate: audioContext.sampleRate,
      state: audioContext.state
    });

    // 获取实时数据
    const freqData = new Uint8Array(analyzer.frequencyBinCount);
    const timeData = new Float32Array(analyzer.fftSize);
    
    analyzer.getByteFrequencyData(freqData);
    analyzer.getFloatTimeDomainData(timeData);
    
    const freqSum = freqData.reduce((a, b) => a + b, 0);
    const freqMax = Math.max(...freqData);
    const freqNonZero = freqData.filter(x => x > 0).length;
    
    const timeMax = Math.max(...timeData.map(Math.abs));
    let timeRms = 0;
    for (let i = 0; i < timeData.length; i++) {
      timeRms += timeData[i] * timeData[i];
    }
    timeRms = Math.sqrt(timeRms / timeData.length);

    const diagnosis = {
      频域数据: {
        总和: freqSum,
        最大值: freqMax,
        非零数量: freqNonZero,
        平均值: (freqSum / freqData.length).toFixed(2)
      },
      时域数据: {
        RMS: timeRms.toFixed(6),
        最大幅度: timeMax.toFixed(6),
        样本数: timeData.length
      },
      状态: {
        音频上下文: audioContext.state,
        采样率: audioContext.sampleRate,
        当前时间: audioContext.currentTime.toFixed(2)
      }
    };

    console.log('诊断结果:', diagnosis);
    
    if (freqSum === 0 && timeRms < 0.0001) {
      alert('❌ 没有检测到音频信号！\n\n可能原因：\n1. 麦克风静音\n2. 音频流连接问题\n3. 分析器配置问题\n\n请检查控制台的详细信息。');
    } else {
      alert('✅ 检测到音频信号！\n\n频域总和: ' + freqSum + '\nRMS: ' + timeRms.toFixed(6) + '\n\n请查看控制台的详细信息。');
    }
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (volumeAnimationRef.current) {
        cancelAnimationFrame(volumeAnimationRef.current);
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

            {/* 音频可视化 */}
            {listening && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">音频可视化</h3>
                <div className="flex justify-center">
                  <div className="bg-black rounded-lg p-4 shadow-lg">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="rounded border-2 border-gray-600"
                    />
                    <div className="text-center mt-2">
                      <p className="text-white text-sm">
                        彩色条形图: 频谱分析 | 绿色波形: 时域波形
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 音高调音关系图 */}
            {listening && pitchHistory.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">实时音高与调音关系图</h3>
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-gray-200">
                    <canvas
                      ref={pitchCanvasRef}
                      width={800}
                      height={300}
                      className="rounded"
                    />
                    <div className="text-center mt-2">
                      <div className="flex justify-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className="w-4 h-1 bg-green-500 mr-2"></div>
                          <span>当前音高曲线</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-1 bg-red-500 mr-2"></div>
                          <span>选中弦目标</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-1 bg-gray-400 mr-2"></div>
                          <span>其他弦</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-1 bg-green-500 border-dashed border-t-2 border-green-500 mr-2"></div>
                          <span>完美调音</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 麦克风音量监测 */}
            {listening && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">麦克风音量监测</h3>
                <div className="max-w-md mx-auto">
                  {/* 音量条 */}
                  <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-2">
                    {/* 当前音量条 */}
                    <div 
                      className={`h-full transition-all duration-100 ${
                        audioLevel > 50 ? 'bg-red-500' : 
                        audioLevel > 25 ? 'bg-yellow-500' : 
                        audioLevel > 10 ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(100, audioLevel)}%` }}
                    ></div>
                    {/* 峰值指示器 */}
                    <div 
                      className="absolute top-0 w-1 h-full bg-white border-l-2 border-gray-800 transition-all duration-200"
                      style={{ left: `${Math.min(99, peakLevel)}%` }}
                    ></div>
                  </div>
                  
                  {/* 音量数值显示 */}
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>当前: {audioLevel.toFixed(1)}%</span>
                    <span>峰值: {peakLevel.toFixed(1)}%</span>
                  </div>
                  
                  {/* 音量状态提示 */}
                  <div className="text-center">
                    {audioLevel < 5 ? (
                      <p className="text-red-600 font-semibold">
                        🔇 检测不到声音 - 请检查麦克风或弹奏吉他
                      </p>
                    ) : audioLevel < 15 ? (
                      <p className="text-yellow-600 font-semibold">
                        🔉 音量较低 - 可以弹奏得更用力一些
                      </p>
                    ) : audioLevel < 50 ? (
                      <p className="text-green-600 font-semibold">
                        🔊 音量良好 - 适合进行调音
                      </p>
                    ) : (
                      <p className="text-red-600 font-semibold">
                        📢 音量过大 - 可能影响调音精度
                      </p>
                    )}
                  </div>
                  
                  {/* 音量刻度 */}
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  
                  {/* 调试信息 */}
                  <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">调试信息:</h4>
                      <button 
                        onClick={diagnoseAudioStream}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        深度诊断
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>信号强度: {(debugInfo.rms * 1000).toFixed(1)}</div>
                      <div>FFT音高: {debugInfo.pitch1 ? debugInfo.pitch1.toFixed(1) + 'Hz' : '无'}</div>
                      <div>相关性音高: {debugInfo.pitch2 ? debugInfo.pitch2.toFixed(1) + 'Hz' : '无'}</div>
                      <div>检测状态: {debugInfo.rms > 0.01 ? '正在分析' : '信号太弱'}</div>
                      <div>数据总和: {rawAudioData.sum}</div>
                      <div>最大值: {rawAudioData.max}</div>
                      <div>非零数: {rawAudioData.nonZero}</div>
                      <div>状态: {rawAudioData.sum > 0 ? '有数据' : '无数据'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

              <div className="flex gap-4 justify-center">
                {listening ? (
                  <button 
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                    onClick={stopTuner}
                  >
                    停止调音
                  </button>
                ) : (
                  <>
                    <button 
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                      onClick={startTuner}
                    >
                      立即开始
                    </button>
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      onClick={testMicrophone}
                    >
                      测试麦克风
                    </button>
                  </>
                )}
              </div>
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