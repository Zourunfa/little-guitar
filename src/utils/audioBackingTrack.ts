import type { SoundTouchNode } from '@soundtouchjs/audio-worklet';

/**
 * 音频伴奏轨道管理器
 * 用于播放和控制经典音频伴奏，支持保音高变速
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
  private soundTouchNode: SoundTouchNode | null = null;
  private soundTouchNodeConstructor: typeof SoundTouchNode | null = null;
  private isInitialized: boolean = false;
  private isPitchPreservingReady: boolean = false;
  private processorLoadError: string | null = null;
  private isPlaying: boolean = false;
  private currentKey: BackingTrackKey = 'A';
  private currentBPM: number = 105;
  private volume: number = 0.7;
  private gainNode: GainNode | null = null;
  private preloadedBuffers: Map<BackingTrackKey, AudioBuffer> = new Map(); // 预加载的音频缓存
  private loadingTracks: Map<BackingTrackKey, Promise<void>> = new Map(); // 相同调性的调用共享同一次加载
  private loadControllers: Set<AbortController> = new Set();
  private isDisposed: boolean = false;

  // 12个调的音频配置（目前只有A调，其他调可以后续添加）
  private backingTracks: Record<BackingTrackKey, BackingTrackConfig> = {
    'A': { 
      key: 'A', 
      url: `${import.meta.env.BASE_URL}blues-mp3/A.mp3`,
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

    this.isDisposed = false;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioContext = audioContext;
      
      // 创建增益节点用于音量控制
      this.gainNode = audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(audioContext.destination);

      if (!audioContext.audioWorklet) {
        this.processorLoadError = '当前浏览器不支持 AudioWorklet';
      } else {
        try {
          const [{ SoundTouchNode: SoundTouchNodeClass }, { default: processorUrl }] = await Promise.all([
            import('@soundtouchjs/audio-worklet'),
            import('@soundtouchjs/audio-worklet/processor?url'),
          ]);
          // React StrictMode 可在动态导入期间清理组件并释放此实例。
          if (!this.isCurrentAudioContext(audioContext)) return;
          await SoundTouchNodeClass.register(audioContext, processorUrl);
          if (!this.isCurrentAudioContext(audioContext)) return;
          this.soundTouchNodeConstructor = SoundTouchNodeClass;
          this.isPitchPreservingReady = true;
        } catch (error) {
          if (!this.isCurrentAudioContext(audioContext)) return;
          this.processorLoadError = error instanceof Error ? error.message : 'AudioWorklet 加载失败';
          console.error('❌ 保音高变速处理器加载失败:', this.processorLoadError);
        }
      }
      
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

    // 预加载和用户点击可能同时发生；所有调用必须等待同一个 Promise，不能提前返回。
    const pending = this.loadingTracks.get(key);
    if (pending) {
      console.log(`⏳ ${key} 调音频正在加载中，等待本次加载完成...`);
      return pending;
    }

    const trackConfig = this.backingTracks[key];
    if (!trackConfig.url) {
      throw new Error(`调 ${key} 的音频文件暂未配置`);
    }

    const loading = this.fetchAndDecodeTrack(key, trackConfig.url);
    this.loadingTracks.set(key, loading);
    try {
      await loading;
    } finally {
      if (this.loadingTracks.get(key) === loading) this.loadingTracks.delete(key);
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

    // 否则立即加载（若后台正在预加载，会等待同一个任务完成）
    await this.preloadTrack(key);
    const buffer = this.preloadedBuffers.get(key);
    if (!buffer) throw new Error('音频加载未完成，请重新加载');
    this.audioBuffer = buffer;
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
    if (!this.isPitchPreservingReady) {
      throw new Error(`当前浏览器无法启用保音高变速：${this.processorLoadError || '音频处理器未就绪'}`);
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
      if (!this.soundTouchNodeConstructor) {
        throw new Error('保音高变速处理器未初始化');
      }
      this.soundTouchNode = new this.soundTouchNodeConstructor({ context: this.audioContext });

      // 速度由 BufferSource 提供，SoundTouch 根据相同速率补偿音高。
      const trackConfig = this.backingTracks[this.currentKey];
      const playbackRate = targetBPM / trackConfig.originalBPM;
      const rate = this.clampPlaybackRate(playbackRate);
      this.setPlaybackRate(rate);
      this.soundTouchNode.pitch.value = 1;
      this.soundTouchNode.pitchSemitones.value = 0;

      // 连接保音高处理器和增益节点
      this.sourceNode.connect(this.soundTouchNode);
      this.soundTouchNode.connect(this.gainNode);

      // 获取起始偏移和循环点配置
      const startOffset = trackConfig.startOffset || 0;
      const loopStart = trackConfig.loopStart || startOffset;
      const loopEnd = trackConfig.loopEnd || this.audioBuffer.duration;

      // 设置循环播放
      this.sourceNode.loop = true;
      this.sourceNode.loopStart = loopStart;
      this.sourceNode.loopEnd = loopEnd;

      // 添加结束事件监听器（用于错误处理）
      const sourceNode = this.sourceNode;
      sourceNode.onended = () => {
        if (this.isPlaying && this.sourceNode === sourceNode) {
          // 正常循环不会触发这个，但如果意外停止会触发
          console.log('音频播放结束');
          this.isPlaying = false;
        }
      };

      // 从指定偏移位置开始播放
      this.sourceNode.start(0, startOffset);
      this.isPlaying = true;
      this.currentBPM = targetBPM;

      console.log(`🎵 开始播放 ${this.currentKey} 调伴奏，速度: ${targetBPM} BPM (播放速率: ${rate.toFixed(2)}x，保留原调)`);
      console.log(`📍 播放参数: 起始=${startOffset.toFixed(2)}s, 循环=${loopStart.toFixed(2)}s~${loopEnd.toFixed(2)}s`);

      if (rate !== playbackRate) {
        console.warn(`⚠️ 播放速率已限制为 ${rate.toFixed(2)}x (原始请求: ${playbackRate.toFixed(2)}x)`);
      }
    } catch (error) {
      console.error('❌ 播放失败:', error);
      this.isPlaying = false;
      this.disconnectPlaybackNodes();
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
    if (this.soundTouchNode) {
      this.soundTouchNode.disconnect();
      this.soundTouchNode = null;
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
      const rate = this.clampPlaybackRate(playbackRate);
      this.setPlaybackRate(rate);
      this.currentBPM = targetBPM;

      console.log(`⚡ 调整速度: ${targetBPM} BPM (播放速率: ${rate.toFixed(2)}x，保留原调)`);

      if (rate !== playbackRate) {
        console.warn(`⚠️ 播放速率已限制为 ${rate.toFixed(2)}x (原始请求: ${playbackRate.toFixed(2)}x)`);
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
    return this.audioBuffer !== null && this.preloadedBuffers.get(this.currentKey) === this.audioBuffer;
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
    return this.loadingTracks.has(key);
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
    console.log('🗑️ 已清除所有预加载缓存');
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.isDisposed = true;
    this.stop();
    this.loadControllers.forEach(controller => controller.abort());
    this.loadControllers.clear();
    this.loadingTracks.clear();
    this.clearPreloadCache();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.audioBuffer = null;
    this.gainNode = null;
    this.isPitchPreservingReady = false;
    this.soundTouchNodeConstructor = null;
    this.processorLoadError = null;
    this.isInitialized = false;
  }

  private async fetchAndDecodeTrack(key: BackingTrackKey, url: string): Promise<void> {
    const context = this.audioContext;
    if (!context) throw new Error('AudioContext 未初始化');

    try {
      console.log(`🔄 开始加载 ${key} 调伴奏: ${url}`);
      const arrayBuffer = await this.fetchWithRetry(url);
      if (this.isDisposed || !this.isCurrentAudioContext(context)) throw new Error('音频加载已取消');
      if (arrayBuffer.byteLength === 0) throw new Error('音频文件为空或不存在');

      console.log(`📊 音频文件大小: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB`);
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      if (this.isDisposed || !this.isCurrentAudioContext(context)) return;

      this.preloadedBuffers.set(key, audioBuffer);
      console.log(`✅ 成功预加载 ${key} 调伴奏，时长: ${audioBuffer.duration.toFixed(2)}秒，采样率: ${audioBuffer.sampleRate}Hz`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.error(`❌ 加载 ${key} 调伴奏失败:`, message);
      if (this.isDisposed || message === '音频加载已取消') throw error;
      if (message.includes('404')) throw new Error(`音频文件不存在: ${url}`);
      if (message.includes('超时')) throw new Error('音频加载超时，请检查网络后点击重新加载');
      if (message.includes('decode') || message.includes('Decode')) {
        throw new Error(`音频文件格式错误或文件损坏: ${message}`);
      }
      throw new Error(`音频加载失败: ${message}`);
    }
  }

  private async fetchWithRetry(url: string): Promise<ArrayBuffer> {
    let lastError: unknown;

    // 首次下载约 4.6MB。弱网失败后自动再试一次，避免请求永久挂起。
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      this.loadControllers.add(controller);

      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.arrayBuffer();
      } catch (error) {
        lastError = error;
        if (this.isDisposed) throw new Error('音频加载已取消');
        if (controller.signal.aborted) lastError = new Error('音频加载超时');
        // 404 等客户端错误重试也不会恢复，直接反馈。
        if (lastError instanceof Error && /^HTTP 4\d\d/.test(lastError.message)) throw lastError;
        if (attempt === 0) console.warn(`⚠️ 音频下载失败，正在自动重试: ${url}`);
      } finally {
        window.clearTimeout(timeout);
        this.loadControllers.delete(controller);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('音频下载失败');
  }

  private clampPlaybackRate(rate: number): number {
    // SoundTouchJS 处理器参数范围为 0.1–8.0；限制在当前 UI 的音乐使用范围内。
    return Math.max(0.48, Math.min(1.44, rate));
  }

  private isCurrentAudioContext(context: AudioContext): boolean {
    return this.audioContext === context && context.state !== 'closed';
  }

  private setPlaybackRate(rate: number): void {
    if (!this.audioContext || !this.sourceNode || !this.soundTouchNode) return;

    // 两个参数在同一 AudioContext 时间点平滑更新，保持处理器与输入源同步。
    const now = this.audioContext.currentTime;
    const timeConstant = 0.03;
    this.sourceNode.playbackRate.cancelScheduledValues(now);
    this.soundTouchNode.playbackRate.cancelScheduledValues(now);
    this.sourceNode.playbackRate.setTargetAtTime(rate, now, timeConstant);
    this.soundTouchNode.playbackRate.setTargetAtTime(rate, now, timeConstant);
  }

  private disconnectPlaybackNodes(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.soundTouchNode) {
      this.soundTouchNode.disconnect();
      this.soundTouchNode = null;
    }
  }
}

export default AudioBackingTrack;
