/**
 * 音频伴奏轨道管理器
 * 用于播放和控制经典音频伴奏，支持速度调节
 */

export type BackingTrackKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

interface BackingTrackConfig {
  key: BackingTrackKey;
  url: string;
  originalBPM: number; // 原始音频的BPM
  startOffset?: number; // 音频起始偏移时间（秒），用于跳过前面的空白或无用部分
  loopStart?: number; // 循环起始点（秒）
  loopEnd?: number; // 循环结束点（秒）
}

class AudioBackingTrack {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private currentKey: BackingTrackKey = 'A';
  private currentBPM: number = 105;
  private volume: number = 0.7;
  private gainNode: GainNode | null = null;
  private preloadedBuffers: Map<BackingTrackKey, AudioBuffer> = new Map(); // 预加载的音频缓存
  private loadingKeys: Set<BackingTrackKey> = new Set(); // 正在加载的调性

  // 12个调的音频配置（目前只有A调，其他调可以后续添加）
  private backingTracks: Record<BackingTrackKey, BackingTrackConfig> = {
    'A': { 
      key: 'A', 
      url: '/blues-mp3/A.mp3', 
      originalBPM: 125,
      startOffset: 5, // 跳过前5秒，从第一小节第一拍开始
    },
    'A#': { key: 'A#', url: '', originalBPM: 105 },
    'B': { key: 'B', url: '', originalBPM: 105 },
    'C': { key: 'C', url: '', originalBPM: 105 },
    'C#': { key: 'C#', url: '', originalBPM: 105 },
    'D': { key: 'D', url: '', originalBPM: 105 },
    'D#': { key: 'D#', url: '', originalBPM: 105 },
    'E': { key: 'E', url: '', originalBPM: 105 },
    'F': { key: 'F', url: '', originalBPM: 105 },
    'F#': { key: 'F#', url: '', originalBPM: 105 },
    'G': { key: 'G', url: '', originalBPM: 105 },
    'G#': { key: 'G#', url: '', originalBPM: 105 },
  };

  /**
   * 初始化音频上下文
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建增益节点用于音量控制
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
      
      this.isInitialized = true;
    } catch (e) {
      console.error('Web Audio API 不支持:', e);
      throw e;
    }
  }

  /**
   * 预加载指定调的音频文件（不会停止当前播放）
   */
  async preloadTrack(key: BackingTrackKey): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('AudioContext 未初始化');
    }

    // 如果已经预加载过，直接返回
    if (this.preloadedBuffers.has(key)) {
      console.log(`✅ ${key} 调音频已在缓存中`);
      return;
    }

    // 如果正在加载，避免重复加载
    if (this.loadingKeys.has(key)) {
      console.log(`⏳ ${key} 调音频正在加载中...`);
      return;
    }

    const trackConfig = this.backingTracks[key];
    if (!trackConfig.url) {
      throw new Error(`调 ${key} 的音频文件暂未配置`);
    }

    this.loadingKeys.add(key);

    try {
      console.log(`🔄 开始预加载 ${key} 调伴奏: ${trackConfig.url}`);

      // 加载音频文件
      const response = await fetch(trackConfig.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('音频文件为空或不存在');
      }

      console.log(`📊 音频文件大小: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`);

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 存入缓存
      this.preloadedBuffers.set(key, audioBuffer);

      console.log(`✅ 成功预加载 ${key} 调伴奏，时长: ${audioBuffer.duration.toFixed(2)}秒，采样率: ${audioBuffer.sampleRate}Hz`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      console.error(`❌ 预加载 ${key} 调伴奏失败:`, errorMessage);

      // 提供更具体的错误信息
      if (errorMessage.includes('decodeAudioData')) {
        throw new Error(`音频文件格式错误或文件损坏: ${errorMessage}`);
      } else if (errorMessage.includes('404')) {
        throw new Error(`音频文件不存在: ${trackConfig.url}`);
      } else {
        throw new Error(`加载失败: ${errorMessage}`);
      }
    } finally {
      this.loadingKeys.delete(key);
    }
  }

  /**
   * 加载指定调的音频文件（兼容旧接口，会使用预加载的缓存）
   */
  async loadTrack(key: BackingTrackKey): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('AudioContext 未初始化');
    }

    const trackConfig = this.backingTracks[key];
    if (!trackConfig.url) {
      throw new Error(`调 ${key} 的音频文件暂未配置`);
    }

    // 停止当前播放
    this.stop();

    // 如果已经预加载，直接使用缓存
    if (this.preloadedBuffers.has(key)) {
      console.log(`⚡ 使用预加载的 ${key} 调音频缓存`);
      this.audioBuffer = this.preloadedBuffers.get(key)!;
      this.currentKey = key;
      return;
    }

    // 否则立即加载
    await this.preloadTrack(key);
    this.audioBuffer = this.preloadedBuffers.get(key)!;
    this.currentKey = key;
  }

  /**
   * 预加载所有可用的音频文件
   */
  async preloadAllTracks(): Promise<void> {
    const availableKeys = this.getAvailableKeys();
    console.log(`🔄 开始预加载所有可用音频: ${availableKeys.join(', ')}`);
    
    const promises = availableKeys.map(key => 
      this.preloadTrack(key).catch(err => {
        console.warn(`⚠️ 预加载 ${key} 调失败:`, err);
      })
    );
    
    await Promise.all(promises);
    console.log(`✅ 所有可用音频预加载完成`);
  }

  /**
   * 播放伴奏
   * @param targetBPM - 目标BPM速度
   */
  play(targetBPM: number): void {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      console.warn('音频未准备好，无法播放');
      throw new Error('音频未准备好，请先加载音频文件');
    }

    // 检查AudioContext状态
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 停止之前的播放
    this.stop();

    try {
      // 创建新的音频源节点
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // 计算播放速率（基于原始BPM和目标BPM）
      const trackConfig = this.backingTracks[this.currentKey];
      const playbackRate = targetBPM / trackConfig.originalBPM;

      // 限制播放速率范围（0.5x - 2.0x）
      const clampedRate = Math.max(0.5, Math.min(2.0, playbackRate));
      this.sourceNode.playbackRate.value = clampedRate;

      // 连接到增益节点
      this.sourceNode.connect(this.gainNode);

      // 获取起始偏移和循环点配置
      const startOffset = trackConfig.startOffset || 0;
      const loopStart = trackConfig.loopStart || startOffset;
      const loopEnd = trackConfig.loopEnd || this.audioBuffer.duration;

      // 设置循环播放
      this.sourceNode.loop = true;
      this.sourceNode.loopStart = loopStart;
      this.sourceNode.loopEnd = loopEnd;

      // 添加结束事件监听器（用于错误处理）
      this.sourceNode.onended = () => {
        if (this.isPlaying && this.sourceNode === this.sourceNode) {
          // 正常循环不会触发这个，但如果意外停止会触发
          console.log('音频播放结束');
          this.isPlaying = false;
        }
      };

      // 从指定偏移位置开始播放
      this.sourceNode.start(0, startOffset);
      this.isPlaying = true;
      this.currentBPM = targetBPM;

      console.log(`🎵 开始播放 ${this.currentKey} 调伴奏，速度: ${targetBPM} BPM (播放速率: ${clampedRate.toFixed(2)}x)`);
      console.log(`📍 播放参数: 起始=${startOffset.toFixed(2)}s, 循环=${loopStart.toFixed(2)}s~${loopEnd.toFixed(2)}s`);

      if (clampedRate !== playbackRate) {
        console.warn(`⚠️ 播放速率已限制为 ${clampedRate.toFixed(2)}x (原始请求: ${playbackRate.toFixed(2)}x)`);
      }
    } catch (error) {
      console.error('❌ 播放失败:', error);
      this.isPlaying = false;
      throw new Error(`播放失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // 忽略已经停止的错误
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  /**
   * 调整播放速度（实时调整）
   */
  adjustSpeed(targetBPM: number): void {
    if (!this.sourceNode || !this.isPlaying) {
      console.warn('音频未在播放，无法调整速度');
      return;
    }

    try {
      const trackConfig = this.backingTracks[this.currentKey];
      const playbackRate = targetBPM / trackConfig.originalBPM;

      // 限制播放速率范围（0.5x - 2.0x）
      const clampedRate = Math.max(0.5, Math.min(2.0, playbackRate));
      this.sourceNode.playbackRate.value = clampedRate;
      this.currentBPM = targetBPM;

      console.log(`⚡ 调整速度: ${targetBPM} BPM (播放速率: ${clampedRate.toFixed(2)}x)`);

      if (clampedRate !== playbackRate) {
        console.warn(`⚠️ 播放速率已限制为 ${clampedRate.toFixed(2)}x (原始请求: ${playbackRate.toFixed(2)}x)`);
      }
    } catch (error) {
      console.error('❌ 调整速度失败:', error);
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * 获取当前播放状态
   */
  getPlayingState(): boolean {
    return this.isPlaying;
  }

  /**
   * 获取当前调
   */
  getCurrentKey(): BackingTrackKey {
    return this.currentKey;
  }

  /**
   * 获取当前BPM
   */
  getCurrentBPM(): number {
    return this.currentBPM;
  }

  /**
   * 检查指定调是否可用
   */
  isTrackAvailable(key: BackingTrackKey): boolean {
    return !!this.backingTracks[key].url;
  }

  /**
   * 检查音频是否已加载（包括预加载缓存）
   */
  isAudioLoaded(): boolean {
    return !!this.audioBuffer || this.preloadedBuffers.has(this.currentKey);
  }

  /**
   * 检查指定调的音频是否已预加载
   */
  isTrackPreloaded(key: BackingTrackKey): boolean {
    return this.preloadedBuffers.has(key);
  }

  /**
   * 检查指定调的音频是否正在加载
   */
  isTrackLoading(key: BackingTrackKey): boolean {
    return this.loadingKeys.has(key);
  }

  /**
   * 获取已预加载的调性列表
   */
  getPreloadedKeys(): BackingTrackKey[] {
    return Array.from(this.preloadedBuffers.keys());
  }

  /**
   * 获取预加载缓存大小（字节）
   */
  getPreloadedCacheSize(): number {
    let totalSize = 0;
    this.preloadedBuffers.forEach(buffer => {
      // AudioBuffer 大小 = 采样数 * 声道数 * 每样本字节数(4字节float32)
      totalSize += buffer.length * buffer.numberOfChannels * 4;
    });
    return totalSize;
  }

  /**
   * 获取所有可用的调
   */
  getAvailableKeys(): BackingTrackKey[] {
    return Object.keys(this.backingTracks).filter(key =>
      this.backingTracks[key as BackingTrackKey].url
    ) as BackingTrackKey[];
  }

  /**
   * 更新指定调的配置
   * @param key - 调性
   * @param config - 部分配置（可以只更新某些字段）
   */
  updateTrackConfig(key: BackingTrackKey, config: Partial<Omit<BackingTrackConfig, 'key'>>): void {
    if (!this.backingTracks[key]) {
      throw new Error(`调 ${key} 不存在`);
    }
    
    this.backingTracks[key] = {
      ...this.backingTracks[key],
      ...config
    };
    
    console.log(`✅ 已更新 ${key} 调配置:`, config);
  }

  /**
   * 获取指定调的配置
   */
  getTrackConfig(key: BackingTrackKey): BackingTrackConfig {
    return { ...this.backingTracks[key] };
  }

  /**
   * 获取当前音频时长（秒）
   */
  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  /**
   * 获取当前播放进度（0-1）
   */
  getProgress(): number {
    // 由于使用循环播放，这里返回一个基于时间的进度
    if (!this.isPlaying || !this.audioBuffer) return 0;

    const now = this.audioContext?.currentTime || 0;
    const duration = this.audioBuffer.duration;
    const playbackRate = this.sourceNode?.playbackRate?.value || 1;

    // 简单的进度计算（从开始播放到现在）
    return ((now * playbackRate) % duration) / duration;
  }

  /**
   * 检查音频上下文是否支持
   */
  static isSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  /**
   * 获取音频上下文状态
   */
  getAudioContextState(): string {
    return this.audioContext?.state || 'uninitialized';
  }

  /**
   * 恢复音频上下文（处理浏览器自动播放策略）
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('🎵 AudioContext 已恢复');
    }
  }

  /**
   * 清除预加载缓存
   */
  clearPreloadCache(): void {
    this.preloadedBuffers.clear();
    this.loadingKeys.clear();
    console.log('🗑️ 已清除所有预加载缓存');
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
    this.clearPreloadCache();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.audioBuffer = null;
    this.gainNode = null;
    this.isInitialized = false;
  }
}

export default AudioBackingTrack;
