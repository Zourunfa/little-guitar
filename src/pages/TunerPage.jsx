import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import teoria from 'teoria';
import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';

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
  
  // 新增状态用于精确调音
  const [pitchDetector, setPitchDetector] = useState(null);
  const [correctProgress, setCorrectProgress] = useState(0);
  const [firstCorrectTimestamp, setFirstCorrectTimestamp] = useState(0);
  const [sampler, setSampler] = useState(null);

  // 使用 teoria 库计算精确频率的调音模式配置
  const createTuningMode = (noteNames) => {
    return noteNames.map((noteName, index) => {
      const note = teoria.note(noteName);
      return {
        note: noteName,
        frequency: parseFloat(note.fq().toFixed(2)),
        fret: index * 5, // 简化的品格位置
        teoriaNote: note // 保存 teoria 音符对象用于播放
      };
    });
  };

  const tuningModes = {
    'standard': {
      name: '标准调音',
      strings: createTuningMode(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'])
    },
    'dropD': {
      name: 'Drop D',
      strings: createTuningMode(['D2', 'A2', 'D3', 'G3', 'B3', 'E4'])
    },
    'halfStepDown': {
      name: '全音降半音',
      strings: createTuningMode(['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'])
    },
    'openG': {
      name: 'Open G',
      strings: createTuningMode(['D2', 'G2', 'D3', 'G3', 'B3', 'D4'])
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
      analyserNode.fftSize = 2048;              // 适中的FFT大小
      analyserNode.smoothingTimeConstant = 0.1; // 低平滑度提高响应性
      analyserNode.minDecibels = -100;          // 更敏感的最小分贝
      analyserNode.maxDecibels = -10;           // 设置最大分贝
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

  // 使用 pitchy 库进行精确音高检测
  const analyzeAudio = (analyserNode, context) => {
    // 创建 pitchy 检测器
    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    const inputArray = new Float32Array(detector.inputLength);
    setPitchDetector(detector);
    
    console.log('Pitchy 音高检测器已初始化:', {
      fftSize: analyserNode.fftSize,
      inputLength: detector.inputLength,
      sampleRate: context.sampleRate
    });
    
    const updatePitch = () => {
      if (!listening) return;
      
      // 获取音频数据
      analyserNode.getFloatTimeDomainData(inputArray);
      
      // 计算 RMS 音量
      let rms = 0;
      for (let i = 0; i < inputArray.length; i++) {
        rms += inputArray[i] * inputArray[i];
      }
      rms = Math.sqrt(rms / inputArray.length);
      
      // 设置 RMS 阈值
      const rmsThreshold = 0.005; // 适中的阈值
      
      if (rms < rmsThreshold) {
        // 信号太弱，继续下一次检测
        setTimeout(() => updatePitch(), 100);
        return;
      }
      
      // 使用 pitchy 检测音高
      const [pitch, clarity] = detector.findPitch(inputArray, context.sampleRate);
      
      // 更新调试信息
      setDebugInfo({
        rms: rms,
        pitch1: pitch || 0,
        pitch2: clarity || 0
      });
      
      // 调试输出
      if (Math.random() < 0.05) { // 5%概率输出
        console.log('Pitchy 检测结果:', {
          pitch: pitch ? pitch.toFixed(2) + 'Hz' : 'none',
          clarity: clarity ? clarity.toFixed(3) : 'none',
          rms: rms.toFixed(6)
        });
      }
      
      // 检查音高是否有效且在吉他频率范围内
      if (pitch && pitch > 70 && pitch < 500 && clarity > 0.8) {
        const roundedPitch = Math.round(pitch * 100) / 100;
        setFrequency(roundedPitch);
        
        // 自动识别最接近的弦
        const closestStringIndex = findClosestString(pitch);
        setSelectedString(closestStringIndex);
        
        const currentString = currentStrings[closestStringIndex];
        setCurrentNote(currentString.note);
        
        // 计算音分差异
        const centsOff = 1200 * Math.log2(pitch / currentString.frequency);
        const roundedCents = Math.round(centsOff * 10) / 10;
        setCents(roundedCents);
        
        // 添加到音高历史记录
        setPitchHistory(prev => {
          const newHistory = [...prev, { 
            frequency: roundedPitch, 
            cents: roundedCents, 
            targetFreq: currentString.frequency,
            stringIndex: closestStringIndex,
            timestamp: Date.now(),
            clarity: clarity
          }];
          return newHistory.slice(-50); // 保留最近50个数据点
        });
        
        // 调音准确性判断
        const delta = Math.abs(pitch - currentString.frequency);
        if (delta < 2) { // 频率差值小于2Hz
          if (firstCorrectTimestamp === 0) {
            setFirstCorrectTimestamp(Date.now());
          } else {
            const elapsed = (Date.now() - firstCorrectTimestamp) / 1000;
            const progress = Math.min(100, (elapsed / 2) * 100); // 2秒达到100%
            setCorrectProgress(progress);
            
            if (progress >= 100) {
              console.log(`🎯 ${currentString.note} 弦调音完成！`);
              // 可以在这里添加成功提示或自动切换到下一根弦
            }
          }
        } else {
          setFirstCorrectTimestamp(0);
          setCorrectProgress(0);
        }
      } else {
        // 没有检测到有效音高，重置一些状态
        if (Math.random() < 0.01) { // 降低日志频率
          console.log('未检测到有效音高:', {
            pitch: pitch ? pitch.toFixed(2) : 'none',
            clarity: clarity ? clarity.toFixed(3) : 'none',
            pitchInRange: pitch ? (pitch > 70 && pitch < 500) : false,
            clarityGood: clarity ? clarity > 0.8 : false
          });
        }
      }
      
      // 继续下一次检测 (200ms间隔，如文章建议)
      setTimeout(() => updatePitch(), 200);
    };
    
    // 开始音高检测
    updatePitch();
  };

  // 改进的FFT音高检测算法
  const detectPitchFFT = (freqData, sampleRate, freqBinCount) => {
    // 定义吉他频率范围 (80-1000Hz，扩大范围以包含泛音)
    const minFreq = 80;
    const maxFreq = 1000;
    const minBin = Math.floor(minFreq * freqBinCount / (sampleRate / 2));
    const maxBin = Math.floor(maxFreq * freqBinCount / (sampleRate / 2));
    
    // 寻找频谱峰值
    const peaks = [];
    const threshold = Math.max(20, Math.max(...freqData) * 0.1); // 动态阈值
    
    for (let i = minBin + 1; i < Math.min(maxBin - 1, freqData.length - 1); i++) {
      // 检测局部峰值
      if (freqData[i] > freqData[i-1] && 
          freqData[i] > freqData[i+1] && 
          freqData[i] > threshold) {
        
        // 使用抛物线插值提高精度
        const y1 = freqData[i-1];
        const y2 = freqData[i];
        const y3 = freqData[i+1];
        
        const a = (y1 - 2*y2 + y3) / 2;
        const b = (y3 - y1) / 2;
        
        let peakIndex = i;
        if (a !== 0) {
          const offset = -b / (2 * a);
          peakIndex = i + offset;
        }
        
        const frequency = peakIndex * sampleRate / 2 / freqBinCount;
        const magnitude = y2;
        
        peaks.push({ frequency, magnitude, bin: i });
      }
    }
    
    if (peaks.length === 0) return 0;
    
    // 排序峰值按幅度
    peaks.sort((a, b) => b.magnitude - a.magnitude);
    
    // 寻找基频（最强的低频峰值）
    let fundamentalFreq = 0;
    
    for (const peak of peaks) {
      // 检查是否在吉他基频范围内 (80-400Hz)
      if (peak.frequency >= 80 && peak.frequency <= 400) {
        fundamentalFreq = peak.frequency;
        break;
      }
    }
    
    // 如果没找到基频，检查泛音
    if (fundamentalFreq === 0) {
      for (const peak of peaks) {
        // 检查是否是某个基频的泛音
        for (let harmonic = 2; harmonic <= 4; harmonic++) {
          const possibleFundamental = peak.frequency / harmonic;
          if (possibleFundamental >= 80 && possibleFundamental <= 400) {
            fundamentalFreq = possibleFundamental;
            break;
          }
        }
        if (fundamentalFreq > 0) break;
      }
    }
    
    return fundamentalFreq;
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

  // 开始音频可视化 - 改进版
  const startVisualization = (analyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas 引用未找到');
      return;
    }

    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    console.log('音频可视化启动，FFT大小:', analyserNode.fftSize, '频率仓数量:', bufferLength);

    const draw = () => {
      if (!listening) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
      
      // 获取实时音频数据
      const freqData = new Uint8Array(bufferLength);
      const timeData = new Float32Array(analyserNode.fftSize);
      
      analyserNode.getByteFrequencyData(freqData);
      analyserNode.getFloatTimeDomainData(timeData);

      // 清空画布
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. 绘制频谱 (条形图)
      const barWidth = canvas.width / (bufferLength * 0.3); // 只显示前30%的频率
      const maxBars = Math.floor(bufferLength * 0.3);
      
      for (let i = 0; i < maxBars; i++) {
        const barHeight = (freqData[i] / 255) * canvas.height * 0.7;
        
        if (barHeight > 1) {
          // 彩虹渐变色
          const hue = (i / maxBars) * 280; // 从紫色到红色
          const saturation = 70 + (freqData[i] / 255) * 30;
          const lightness = 40 + (freqData[i] / 255) * 40;
          
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
        }
      }

      // 2. 绘制时域波形
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff88';
      ctx.beginPath();

      const sliceWidth = canvas.width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        // 将音频数据从 [-1, 1] 映射到画布高度
        const y = ((timeData[i] + 1) / 2) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // 3. 添加中线参考
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // 4. 显示当前音量和频率信息
      const rms = Math.sqrt(timeData.reduce((sum, val) => sum + val * val, 0) / timeData.length);
      const volume = Math.min(100, rms * 1000);
      
      if (volume > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`音量: ${volume.toFixed(1)}%`, 10, 20);
        
        if (frequency > 0) {
          ctx.fillText(`频率: ${frequency.toFixed(1)}Hz`, 10, 35);
          ctx.fillText(`音分: ${cents > 0 ? '+' : ''}${cents.toFixed(1)}`, 10, 50);
        }
      }

      // 调试信息（减少频率）
      if (Math.random() < 0.01) {
        const freqSum = freqData.reduce((a, b) => a + b, 0);
        console.log('可视化数据:', {
          volume: volume.toFixed(1),
          freqSum: freqSum,
          maxFreq: Math.max(...freqData),
          rms: rms.toFixed(6)
        });
      }
    };

    // 启动绘制循环
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

  // 使用 tone.js 播放参考音
  const playReferenceNote = async () => {
    if (isPlayingReference) return;
    
    try {
      setIsPlayingReference(true);
      
      // 确保 Tone.js 音频上下文已启动
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Tone.js 音频上下文已启动');
      }
      
      // 如果还没有创建采样器，创建一个
      if (!sampler) {
        // 创建一个简单的合成器代替采样器（因为我们没有音频文件）
        const synth = new Tone.Synth({
          oscillator: {
            type: 'triangle' // 使用三角波获得更温暖的音色
          },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.7,
            release: 1.2
          }
        }).toDestination();
        
        setSampler(synth);
        
        // 播放音符
        const noteString = targetString.teoriaNote.toString();
        console.log('播放参考音:', noteString, targetString.frequency + 'Hz');
        
        synth.triggerAttackRelease(noteString, '1.5n');
        
        // 1.5秒后停止播放状态
        setTimeout(() => {
          setIsPlayingReference(false);
        }, 1500);
        
      } else {
        // 如果采样器已存在，直接播放
        const noteString = targetString.teoriaNote.toString();
        console.log('播放参考音:', noteString, targetString.frequency + 'Hz');
        
        if (sampler.triggerAttackRelease) {
          sampler.triggerAttackRelease(noteString, '1.5n');
        }
        
        setTimeout(() => {
          setIsPlayingReference(false);
        }, 1500);
      }
      
    } catch (error) {
      console.error('播放参考音失败:', error);
      setIsPlayingReference(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          {/* 主调音界面 - 顶部集中设计 */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            {/* 标题栏 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                吉他调音器
              </h1>
              <p className="text-gray-600">专业级在线调音工具</p>
            </div>

            {/* 核心调音区域 */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mb-6">
              {/* 圆形调音指示器 */}
              {listening && currentNote ? (
                <div className="text-center mb-8">
                  <div className="flex justify-center items-center gap-8">
                    {/* 左侧音符信息 */}
                    <div className="text-center">
                      <div className="text-6xl font-bold text-gray-800 mb-2">{currentNote}</div>
                      <div className="text-xl text-gray-600 mb-1">{frequency} Hz</div>
                      <div className="text-sm text-blue-600 font-medium">第{selectedString + 1}弦</div>
                    </div>
                    
                    {/* 中间圆形调音表 */}
                    <div className="relative">
                      <svg width="200" height="200" className="transform -rotate-90">
                        {/* 外圈背景 */}
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        
                        {/* 调音区域指示 */}
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.PI * 2 * 90 * 0.1} ${Math.PI * 2 * 90 * 0.9}`}
                          strokeDashoffset={-Math.PI * 2 * 90 * 0.45}
                          opacity="0.3"
                        />
                        
                        {/* 当前音高位置 */}
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke={Math.abs(cents) < 5 ? '#10b981' : Math.abs(cents) < 15 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.PI * 2 * 90 * 0.02} ${Math.PI * 2 * 90 * 0.98}`}
                          strokeDashoffset={-Math.PI * 2 * 90 * (0.5 + Math.max(-0.25, Math.min(0.25, cents / 200)))}
                          className="transition-all duration-300"
                        />
                        
                        {/* 中心点 */}
                        <circle cx="100" cy="100" r="4" fill="#374151" />
                      </svg>
                      
                      {/* 指针 */}
                      <div 
                        className="absolute top-1/2 left-1/2 w-1 h-16 bg-gray-800 origin-bottom transition-transform duration-300"
                        style={{
                          transform: `translate(-50%, -100%) rotate(${Math.max(-45, Math.min(45, cents * 0.9))}deg)`
                        }}
                      />
                      
                      {/* 中心圆点 */}
                      <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      
                      {/* 刻度标记 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute text-xs text-gray-500 font-medium" style={{transform: 'translateY(-85px)'}}>0</div>
                        <div className="absolute text-xs text-gray-400" style={{transform: 'translateX(-85px)'}}>-50</div>
                        <div className="absolute text-xs text-gray-400" style={{transform: 'translateX(85px)'}}>+50</div>
                      </div>
                    </div>
                    
                    {/* 右侧状态信息 */}
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${
                        Math.abs(cents) < 5 ? 'text-green-500' :
                        Math.abs(cents) < 15 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {cents > 0 ? `+${cents.toFixed(1)}` : cents.toFixed(1)}
                      </div>
                      <div className="text-lg text-gray-600 mb-2">音分</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                        Math.abs(cents) < 5 ? 'bg-green-100 text-green-800' :
                        Math.abs(cents) < 15 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.abs(cents) < 5 ? '✓ 已调准' :
                         Math.abs(cents) < 15 ? '接近调准' : 
                         cents > 0 ? '音高偏高' : '音高偏低'}
                      </div>
                      
                      {/* 调音准确性进度条 */}
                      <div className="mt-4">
                        <div className="relative w-20 h-20 mx-auto">
                          {/* 背景圆环 */}
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="#e5e7eb"
                              strokeWidth="8"
                              fill="none"
                            />
                            {/* 进度圆环 */}
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke={correctProgress > 80 ? '#10b981' : correctProgress > 40 ? '#f59e0b' : '#6b7280'}
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${Math.PI * 2 * 32}`}
                              strokeDashoffset={`${Math.PI * 2 * 32 * (1 - correctProgress / 100)}`}
                              className="transition-all duration-300"
                            />
                          </svg>
                          {/* 中心文字 */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-800">
                                {Math.round(correctProgress)}%
                              </div>
                              {correctProgress >= 100 && (
                                <div className="text-green-600 text-xs font-medium">完成</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {correctProgress > 0 ? '保持稳定中...' : '调音精度检测'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-8">
                  <div className="inline-flex items-center bg-white rounded-2xl px-8 py-6 shadow-lg border border-dashed border-gray-300">
                    <div className="text-gray-400">
                      <div className="text-4xl mb-2">🎸</div>
                      <div className="text-lg">请弹奏吉他弦</div>
                      <div className="text-sm">目标：{targetString.note} ({targetString.frequency}Hz)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 弦选择区域 */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-center mb-6 text-gray-800">选择要调的弦</h3>
                <div className="grid grid-cols-6 gap-4">
                  {currentStrings.map((string, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-200 ${
                        selectedString === index 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl transform scale-105' 
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl'
                      }`}
                      onClick={() => setSelectedString(index)}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2">{string.note}</div>
                        <div className={`text-sm mb-1 ${selectedString === index ? 'text-blue-100' : 'text-gray-600'}`}>
                          {string.frequency}Hz
                        </div>
                        <div className={`text-xs ${selectedString === index ? 'text-blue-200' : 'text-gray-500'}`}>
                          第{index + 1}弦
                        </div>
                      </div>
                      {selectedString === index && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-sm text-gray-800">✓</span>
                        </div>
                      )}
                      {listening && selectedString === index && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400 animate-pulse" />
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="text-center text-gray-600 mt-4">
                  点击上方的弦按钮选择要调音的弦，系统也会自动识别你弹奏的弦
                </p>
              </div>

            {/* 简化音频可视化 */}
            {listening && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">音频波形</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">音频信号</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">频谱</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={120}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-500">
                    实时音频频谱分析 · 波形显示
                  </p>
                </div>
              </div>
            )}

            {/* 音高趋势图 */}
            {listening && pitchHistory.length > 5 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">调音精度趋势</h3>
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-gray-600">音高轨迹</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      <span className="text-gray-600">目标值</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <canvas
                    ref={pitchCanvasRef}
                    width={700}
                    height={150}
                    className="rounded-lg border border-gray-200"
                  />
                </div>
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-500">
                    显示最近音高变化轨迹，帮助你更精确地调音
                  </p>
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

            {/* 智能调音模式选择 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-center mb-6 text-gray-800">调音模式</h3>
              
              {/* 推荐模式提示 */}
              {frequency > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-600 text-lg mr-2">💡</span>
                    <span className="text-blue-800 font-semibold">智能推荐</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    检测到频率 {frequency.toFixed(1)}Hz，系统推荐使用 <strong>{tuningModes[tuningMode].name}</strong> 模式
                  </p>
                </div>
              )}
              
              {/* 模式选择网格 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {Object.entries(tuningModes).map(([key, mode]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      tuningMode === key
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setTuningMode(key)}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{mode.name}</div>
                      <div className={`text-sm ${tuningMode === key ? 'text-blue-100' : 'text-gray-600'}`}>
                        {mode.strings[0].note} - {mode.strings[5].note}
                      </div>
                    </div>
                    {tuningMode === key && (
                      <div className="absolute top-2 right-2 text-yellow-300">
                        <span className="text-lg">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 当前模式详情 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">当前模式：{tuningModes[tuningMode].name}</h4>
                <div className="grid grid-cols-6 gap-2">
                  {tuningModes[tuningMode].strings.map((string, index) => (
                    <div key={index} className="text-center text-sm">
                      <div className="font-medium text-gray-700">{string.note}</div>
                      <div className="text-xs text-gray-500">{string.frequency}Hz</div>
                    </div>
                  ))}
                </div>
              </div>
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