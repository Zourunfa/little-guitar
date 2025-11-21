/**
 * 音频伴奏轨道管理器
 * 用于播放和控制经典音频伴奏，支持速度调节
 * 优化的缓存管理，支持预加载、进度跟踪和错误处理
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
  private audioBuffer: AudioBuffer | null = null; // 当前播放的音频缓冲区
  private sourceNode: AudioBufferSourceNode | null = null; // 当前播放的音频源节点
  private isInitialized: boolean = false; // 是否已初始化音频上下文
  private isPlaying: boolean = false; // 当前是否正在播放
  private currentKey: BackingTrackKey = 'A'; // 当前播放的调性
  private currentBPM: number = 105; // 当前播放的BPM
  private volume: number = 0.7; // 当前音量
  private gainNode: GainNode | null = null; // 音量控制节点
  private preloadedBuffers: Map<BackingTrackKey, AudioBuffer> = new Map(); // 预加载的音频缓存，使用Map提供O(1)的查找性能
  private loadingKeys: Set<BackingTrackKey> = new Set(); // 正在加载的调性集合，防止重复加载
  private trackConfigs: Map<BackingTrackKey, BackingTrackConfig> = new Map(); // 动态配置存储
  private cacheSizeLimit: number = 50 * 1024 * 1024; // 缓存大小限制：50MB，防止内存占用过多
  
  // 智能缓存优化
  private cacheAccessTime: Map<BackingTrackKey, number> = new Map(); // LRU缓存：记录每个音频的最后访问时间
  private cacheAccessCount: Map<BackingTrackKey, number> = new Map(); // 访问频率统计：记录每个音频的访问次数
  private isPreloading: boolean = false; // 是否正在批量预加载
  private preloadAbortController: AbortController | null = null; // 用于取消预加载的控制器

  /**
   * 初始化音频上下文
   * 创建音频处理图，包括音频上下文和增益节点
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 创建音频上下文，兼容旧版浏览器
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建增益节点用于音量控制
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
      
      this.isInitialized = true;
      console.log('🎵 音频上下文初始化成功');
    } catch (e) {
      console.error('❌ Web Audio API 不支持:', e);
      throw e;
    }
  }

  /**
   * 预加载指定调的音频文件（不会停止当前播放）
   * 优化的加载策略：支持进度监控、重复加载防护、错误处理、LRU缓存
   * 
   * @param key - 调性
   * @param url - 音频文件 URL（可选，如果已通过 updateTrackConfig 设置则不需要）
   * @param onProgress - 进度回调函数（0-100）
   * @param signal - AbortSignal 用于取消加载
   */
  async preloadTrack(
    key: BackingTrackKey, 
    url?: string, 
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('❌ AudioContext 未初始化');
    }

    // 检查是否已缓存，更新访问时间和计数
    if (this.preloadedBuffers.has(key)) {
      this.updateCacheAccess(key);
      console.log(`✅ ${key} 调音频已在缓存中 (访问次数: ${this.cacheAccessCount.get(key)})`);
      onProgress?.(100);
      return;
    }

    // 检查是否正在加载，防止重复请求
    if (this.loadingKeys.has(key)) {
      console.log(`⏳ ${key} 调音频正在加载中...`);
      return;
    }

    // 获取配置或使用传入的 URL
    const trackConfig = this.trackConfigs.get(key);
    const audioUrl = url || trackConfig?.url;
    
    if (!audioUrl) {
      throw new Error(`❌ 调 ${key} 的音频文件暂未配置`);
    }

    this.loadingKeys.add(key);

    try {
      console.log(`🔄 开始预加载 ${key} 调伴奏: ${audioUrl}`);
      onProgress?.(5);

      // 优化的流式加载，支持进度监控和取消
      const response = await fetch(audioUrl, {
        signal,
        cache: 'force-cache', // 强制使用浏览器缓存
        mode: 'cors', // 支持跨域
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 获取文件大小以计算准确的下载进度
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('❌ 响应体为空');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // 流式读取，实时更新下载进度（下载占0-70%）
      while (true) {
        // 检查是否被取消
        if (signal?.aborted) {
          reader.cancel();
          throw new Error('加载已取消');
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // 计算并通知下载进度
        if (total > 0) {
          const downloadProgress = Math.min(70, (receivedLength / total) * 70);
          onProgress?.(Math.floor(downloadProgress));
        } else {
          // 如果无法获取总大小，使用估算进度
          const estimatedProgress = Math.min(70, (receivedLength / 5000000) * 70); // 假设5MB
          onProgress?.(Math.floor(estimatedProgress));
        }
      }

      // 合并所有数据块，优化内存使用
      const arrayBuffer = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        arrayBuffer.set(chunk, position);
        position += chunk.length;
      }

      if (arrayBuffer.byteLength === 0) {
        throw new Error('❌ 音频文件为空或不存在');
      }

      console.log(`📊 音频文件大小: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
      onProgress?.(75); // 下载完成，开始解码

      // 解码音频数据（解码进度占75-100%）
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.buffer);
      onProgress?.(95);

      // 智能缓存管理：检查缓存大小并清理
      await this.ensureCacheSpace(audioBuffer);

      // 将音频数据存入缓存并更新访问信息
      this.preloadedBuffers.set(key, audioBuffer);
      this.updateCacheAccess(key);
      onProgress?.(100);

      console.log(`✅ 成功预加载 ${key} 调伴奏，时长: ${audioBuffer.duration.toFixed(2)}秒，采样率: ${audioBuffer.sampleRate}Hz`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      
      // 如果是取消操作，不记录错误
      if (errorMessage.includes('取消') || errorMessage.includes('aborted')) {
        console.log(`⏹️ ${key} 调音频加载已取消`);
        throw new Error('加载已取消');
      }
      
      console.error(`❌ 预加载 ${key} 调伴奏失败:`, errorMessage);

      // 提供更具体的错误信息，帮助用户快速定位问题
      if (errorMessage.includes('decodeAudioData')) {
        throw new Error(`音频文件格式错误或文件损坏: ${errorMessage}`);
      } else if (errorMessage.includes('404')) {
        throw new Error(`音频文件不存在: ${audioUrl}`);
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        throw new Error(`网络错误，请检查网络连接: ${errorMessage}`);
      } else {
        throw new Error(`加载失败: ${errorMessage}`);
      }
    } finally {
      this.loadingKeys.delete(key);
    }
  }

  /**
   * 加载指定调的音频文件（兼容旧接口，会使用预加载的缓存）
   * 优先使用缓存，如果不存在则执行预加载，并触发智能预加载
   * 
   * @param key - 调性
   * @param url - 音频文件 URL（可选）
   */
  async loadTrack(key: BackingTrackKey, url?: string): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('❌ AudioContext 未初始化');
    }

    // 停止当前播放以避免音频冲突
    this.stop();

    // 优先使用已预加载的音频缓存
    if (this.preloadedBuffers.has(key)) {
      console.log(`⚡ 使用预加载的 ${key} 调音频缓存 (访问次数: ${(this.cacheAccessCount.get(key) || 0) + 1})`);
      this.audioBuffer = this.preloadedBuffers.get(key)!;
      this.currentKey = key;
      this.updateCacheAccess(key); // 更新访问信息
      
      // 触发智能预加载相关调性
      this.smartPreload(key);
      return;
    }

    // 如果缓存中不存在，执行预加载
    await this.preloadTrack(key, url);
    this.audioBuffer = this.preloadedBuffers.get(key)!;
    this.currentKey = key;
    
    // 触发智能预加载相关调性
    this.smartPreload(key);
  }

  /**
   * 预加载所有可用的音频文件
   * 智能加载策略：支持优先级排序、并发控制、进度跟踪、取消操作
   * 
   * @param onProgress - 总体进度回调函数（0-100），包含当前处理的调性
   * @param priorityKeys - 优先加载的调性列表（如常用调性）
   * @param concurrency - 并发加载数量（默认2）
   */
  async preloadAllTracks(
    onProgress?: (progress: number, currentKey?: BackingTrackKey) => void,
    priorityKeys: BackingTrackKey[] = ['A', 'E', 'G'],
    concurrency: number = 2
  ): Promise<void> {
    if (this.isPreloading) {
      console.warn('⚠️ 已有预加载任务在进行中');
      return;
    }

    this.isPreloading = true;
    this.preloadAbortController = new AbortController();

    try {
      const availableKeys = this.getAvailableKeys();
      
      // 按优先级排序：优先调性在前
      const sortedKeys = this.sortKeysByPriority(availableKeys, priorityKeys);
      
      console.log(`🔄 开始智能预加载音频 (优先级: ${priorityKeys.join(', ')})`);
      console.log(`📋 加载顺序: ${sortedKeys.join(', ')}`);

      if (sortedKeys.length === 0) {
        onProgress?.(100);
        return;
      }

      let completedCount = 0;
      const totalKeys = sortedKeys.length;

      // 并发加载控制
      for (let i = 0; i < sortedKeys.length; i += concurrency) {
        // 检查是否被取消
        if (this.preloadAbortController.signal.aborted) {
          console.log('⏹️ 预加载已取消');
          break;
        }

        const batch = sortedKeys.slice(i, i + concurrency);
        
        // 并发加载当前批次
        const batchPromises = batch.map(async (key, batchIndex) => {
          try {
            await this.preloadTrack(key, undefined, (keyProgress) => {
              // 计算总体进度
              const batchOffset = i + batchIndex;
              const overallProgress = ((completedCount + (batchOffset - i) + keyProgress / 100) / totalKeys) * 100;
              onProgress?.(Math.floor(overallProgress), key);
            }, this.preloadAbortController?.signal);
            
            completedCount++;
            console.log(`✅ [${completedCount}/${totalKeys}] ${key} 调预加载完成`);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '未知错误';
            if (!errorMsg.includes('取消')) {
              console.warn(`⚠️ 预加载 ${key} 调失败:`, err);
            }
            completedCount++;
          }
        });

        // 等待当前批次完成
        await Promise.allSettled(batchPromises);
      }

      onProgress?.(100);
      console.log(`✅ 音频预加载完成 (${completedCount}/${totalKeys})`);
      this.logCacheStats();
      
    } catch (err) {
      console.error('❌ 预加载过程出错:', err);
    } finally {
      this.isPreloading = false;
      this.preloadAbortController = null;
    }
  }

  /**
   * 取消正在进行的预加载
   */
  cancelPreload(): void {
    if (this.preloadAbortController && this.isPreloading) {
      this.preloadAbortController.abort();
      console.log('🛑 已发送取消预加载信号');
    }
  }

  /**
   * 按优先级排序调性
   * @param keys - 所有调性
   * @param priorityKeys - 优先调性列表
   * @returns 排序后的调性列表
   */
  private sortKeysByPriority(keys: BackingTrackKey[], priorityKeys: BackingTrackKey[]): BackingTrackKey[] {
    const priority: BackingTrackKey[] = [];
    const normal: BackingTrackKey[] = [];
    
    keys.forEach(key => {
      if (priorityKeys.includes(key)) {
        priority.push(key);
      } else {
        normal.push(key);
      }
    });
    
    return [...priority, ...normal];
  }

  /**
   * 播放伴奏
   * 处理音频播放的完整生命周期，包括音频上下文状态管理、循环设置和错误处理
   * 
   * @param targetBPM - 目标BPM速度
   */
  play(targetBPM: number): void {
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
      console.warn('❌ 音频未准备好，无法播放');
      throw new Error('❌ 音频未准备好，请先加载音频文件');
    }

    // 检查并恢复音频上下文状态（浏览器自动播放策略）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 停止之前的播放以避免音频重叠
    this.stop();

    try {
      // 创建新的音频源节点
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // 根据原始BPM和目标BPM计算播放速率
      const trackConfig = this.trackConfigs.get(this.currentKey);
      const originalBPM = trackConfig?.originalBPM || 120; // 默认 120 BPM
      const playbackRate = targetBPM / originalBPM;

      // 限制播放速率在合理范围内（0.5x - 2.0x），确保音频质量
      const clampedRate = Math.max(0.5, Math.min(2.0, playbackRate));
      this.sourceNode.playbackRate.value = clampedRate;

      // 连接到增益节点，用于音量控制
      this.sourceNode.connect(this.gainNode);

      // 获取并应用播放配置（起始偏移和循环点）
      const startOffset = trackConfig?.startOffset || 0;
      const loopStart = trackConfig?.loopStart || startOffset;
      const loopEnd = trackConfig?.loopEnd || this.audioBuffer.duration;

      // 设置循环播放参数
      this.sourceNode.loop = true;
      this.sourceNode.loopStart = loopStart;
      this.sourceNode.loopEnd = loopEnd;

      // 添加播放结束事件监听器（用于错误处理和状态同步）
      this.sourceNode.onended = () => {
        if (this.isPlaying && this.sourceNode === this.sourceNode) {
          // 正常循环不会触发这个，但如果意外停止会触发
          console.log('🎵 音频播放结束');
          this.isPlaying = false;
        }
      };

      // 从指定偏移位置开始播放，跳过开头的空白部分
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
   * 安全地停止当前播放的音频，释放相关资源
   */
  stop(): void {
    if (this.sourceNode) {
      try {
        // 停止音频源播放
        this.sourceNode.stop();
      } catch (e) {
        // 忽略已经停止的错误，这是正常的
        console.debug('音频源可能已经停止');
      }
      // 断开连接并释放引用
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  /**
   * 调整播放速度（实时调整）
   * 动态修改当前播放的音频速度，不影响播放状态
   * 
   * @param targetBPM - 目标BPM速度
   */
  adjustSpeed(targetBPM: number): void {
    if (!this.sourceNode || !this.isPlaying) {
      console.warn('❌ 音频未在播放，无法调整速度');
      return;
    }

    try {
      // 计算新的播放速率
      const trackConfig = this.trackConfigs.get(this.currentKey);
      const originalBPM = trackConfig?.originalBPM || 120; // 默认 120 BPM
      const playbackRate = targetBPM / originalBPM;

      // 限制播放速率在合理范围内
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
   * 动态调整播放音量，范围0-1
   * 
   * @param volume - 音量值（0-1）
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume)); // 确保音量在有效范围内
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
    const config = this.trackConfigs.get(key);
    return !!config?.url;
  }

  /**
   * 检查音频是否已加载（包括预加载缓存）
   */
  isAudioLoaded(): boolean {
    return !!this.audioBuffer || this.preloadedBuffers.has(this.currentKey);
  }

  /**
   * 检查指定调的音频是否已预加载
   * 
   * @param key - 要检查的调性
   * @returns 是否已预加载
   */
  isTrackPreloaded(key: BackingTrackKey): boolean {
    return this.preloadedBuffers.has(key);
  }

  /**
   * 检查指定调的音频是否正在加载
   * 防止重复加载同一音频文件
   * 
   * @param key - 要检查的调性
   * @returns 是否正在加载
   */
  isTrackLoading(key: BackingTrackKey): boolean {
    return this.loadingKeys.has(key);
  }

  /**
   * 获取已预加载的调性列表
   * 
   * @returns 已预加载的调性数组
   */
  getPreloadedKeys(): BackingTrackKey[] {
    return Array.from(this.preloadedBuffers.keys());
  }

  /**
   * 获取预加载缓存大小（字节）
   * 计算当前缓存中所有音频数据的总大小
   * 
   * @returns 缓存总大小（字节）
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
   * 计算当前缓存大小（内部方法）
   * 与 getPreloadedCacheSize 相同，但作为私有方法使用
   * 
   * @returns 当前缓存总大小（字节）
   */
  private calculateCurrentCacheSize(): number {
    let totalSize = 0;
    this.preloadedBuffers.forEach(buffer => {
      // AudioBuffer 大小 = 采样数 * 声道数 * 每样本字节数(4字节float32)
      totalSize += buffer.length * buffer.numberOfChannels * 4;
    });
    return totalSize;
  }

  /**
   * 估算 AudioBuffer 的大小（字节）
   * 用于在添加新缓存前预估内存使用
   * 
   * @param buffer - 要估算的 AudioBuffer
   * @returns 预估大小（字节）
   */
  private estimateAudioBufferSize(buffer: AudioBuffer): number {
    return buffer.length * buffer.numberOfChannels * 4;
  }

  /**
   * 更新缓存访问信息（LRU + LFU混合策略）
   * @param key - 调性
   */
  private updateCacheAccess(key: BackingTrackKey): void {
    this.cacheAccessTime.set(key, Date.now());
    this.cacheAccessCount.set(key, (this.cacheAccessCount.get(key) || 0) + 1);
  }

  /**
   * 确保有足够的缓存空间
   * 智能清理策略：结合LRU（最近最少使用）和LFU（最不常用）
   * @param newBuffer - 即将添加的新音频缓冲区
   */
  private async ensureCacheSpace(newBuffer: AudioBuffer): Promise<void> {
    const newBufferSize = this.estimateAudioBufferSize(newBuffer);
    const currentSize = this.calculateCurrentCacheSize();
    const requiredSpace = currentSize + newBufferSize;

    // 如果不超过限制，直接返回
    if (requiredSpace <= this.cacheSizeLimit) {
      return;
    }

    console.log(`🧹 缓存空间不足，开始智能清理...`);
    console.log(`📊 当前: ${(currentSize / 1024 / 1024).toFixed(2)}MB, 需要: ${(newBufferSize / 1024 / 1024).toFixed(2)}MB, 限制: ${(this.cacheSizeLimit / 1024 / 1024).toFixed(2)}MB`);

    // 计算每个缓存项的优先级分数（分数越低越应该被清理）
    const cacheScores = new Map<BackingTrackKey, number>();
    const now = Date.now();
    
    this.preloadedBuffers.forEach((_, key) => {
      const accessTime = this.cacheAccessTime.get(key) || 0;
      const accessCount = this.cacheAccessCount.get(key) || 0;
      const timeSinceAccess = now - accessTime;
      
      // 综合评分：访问频率权重60%，最近访问时间权重40%
      // 分数越高表示越重要，越不应该被清理
      const frequencyScore = accessCount * 0.6;
      const recencyScore = (1 / (timeSinceAccess + 1)) * 1000000 * 0.4; // 归一化时间分数
      const totalScore = frequencyScore + recencyScore;
      
      cacheScores.set(key, totalScore);
    });

    // 按分数排序，分数低的优先清理
    const sortedKeys = Array.from(cacheScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
      .map(([key]) => key);

    // 清理缓存直到有足够空间（保留20%余量）
    const targetSize = this.cacheSizeLimit * 0.8;
    let freedSpace = 0;
    
    for (const key of sortedKeys) {
      if (currentSize - freedSpace + newBufferSize <= targetSize) {
        break;
      }

      const buffer = this.preloadedBuffers.get(key);
      if (buffer) {
        const bufferSize = this.estimateAudioBufferSize(buffer);
        this.preloadedBuffers.delete(key);
        this.cacheAccessTime.delete(key);
        this.cacheAccessCount.delete(key);
        freedSpace += bufferSize;
        
        console.log(`🗑️ 清理 ${key} 调 (${(bufferSize / 1024 / 1024).toFixed(2)}MB, 访问${this.cacheAccessCount.get(key) || 0}次)`);
      }
    }

    const finalSize = this.calculateCurrentCacheSize();
    console.log(`✅ 缓存清理完成，释放 ${(freedSpace / 1024 / 1024).toFixed(2)}MB，当前 ${(finalSize / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * 清理缓存以释放内存（旧方法，保留向后兼容）
   * 当缓存超过限制时，使用智能策略移除缓存项
   */
  private cleanupCache(): void {
    console.log('🧹 开始清理音频缓存...');
    
    const currentSize = this.calculateCurrentCacheSize();
    if (currentSize <= this.cacheSizeLimit) {
      return;
    }

    // 使用智能清理策略
    const dummyBuffer = this.audioContext?.createBuffer(2, 44100, 44100);
    if (dummyBuffer) {
      this.ensureCacheSpace(dummyBuffer);
    }
  }

  /**
   * 获取所有可用的调
   */
  getAvailableKeys(): BackingTrackKey[] {
    const keys: BackingTrackKey[] = [];
    this.trackConfigs.forEach((config, key) => {
      if (config.url) {
        keys.push(key);
      }
    });
    return keys;
  }

  /**
   * 更新指定调的配置
   * @param key - 调性
   * @param config - 部分配置（可以只更新某些字段）
   */
  updateTrackConfig(key: BackingTrackKey, config: Partial<Omit<BackingTrackConfig, 'key'>>): void {
    const existingConfig = this.trackConfigs.get(key) || { key, url: '', originalBPM: 120 };
    
    this.trackConfigs.set(key, {
      ...existingConfig,
      ...config,
      key, // 确保 key 字段正确
    });
    
    console.log(`✅ 已更新 ${key} 调配置:`, config);
  }

  /**
   * 获取指定调的配置
   */
  getTrackConfig(key: BackingTrackKey): BackingTrackConfig {
    const config = this.trackConfigs.get(key);
    return config ? { ...config } : { key, url: '', originalBPM: 120 };
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
   * 从本地文件加载音频
   */
  async loadFromFile(key: BackingTrackKey, file: File): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      throw new Error('AudioContext 未初始化');
    }

    this.loadingKeys.add(key);

    try {
      console.log(`📁 开始从本地文件加载 ${key} 调: ${file.name}`);

      // 读取文件为 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('文件为空');
      }

      console.log(`📊 文件大小: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

      // 解码音频数据
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 存入缓存
      this.preloadedBuffers.set(key, audioBuffer);
      
      // 更新配置（使用本地文件URL）
      const existingConfig = this.trackConfigs.get(key) || { key, url: '', originalBPM: 120 };
      this.trackConfigs.set(key, {
        ...existingConfig,
        url: URL.createObjectURL(file),
        originalBPM: 120, // 默认BPM，可以后续调整
      });

      console.log(`✅ 成功从本地文件加载 ${key} 调，时长: ${audioBuffer.duration.toFixed(2)}秒`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      console.error(`❌ 从本地文件加载 ${key} 调失败:`, errorMessage);

      if (errorMessage.includes('decodeAudioData')) {
        throw new Error(`音频文件格式不支持或文件损坏`);
      } else {
        throw new Error(`加载失败: ${errorMessage}`);
      }
    } finally {
      this.loadingKeys.delete(key);
    }
  }

  /**
   * 获取缓存统计信息
   * 提供详细的缓存使用情况，用于监控和调试
   */
  getCacheStats(): {
    totalSize: number;
    totalSizeMB: number;
    itemCount: number;
    maxSize: number;
    maxSizeMB: number;
    usage: number;
    items: Array<{
      key: BackingTrackKey;
      sizeMB: number;
      duration: number;
      accessCount: number;
      lastAccess: Date;
    }>;
  } {
    const totalSize = this.calculateCurrentCacheSize();
    const items = Array.from(this.preloadedBuffers.entries()).map(([key, buffer]) => ({
      key,
      sizeMB: this.estimateAudioBufferSize(buffer) / 1024 / 1024,
      duration: buffer.duration,
      accessCount: this.cacheAccessCount.get(key) || 0,
      lastAccess: new Date(this.cacheAccessTime.get(key) || 0)
    }));

    // 按访问次数降序排序
    items.sort((a, b) => b.accessCount - a.accessCount);

    return {
      totalSize,
      totalSizeMB: totalSize / 1024 / 1024,
      itemCount: this.preloadedBuffers.size,
      maxSize: this.cacheSizeLimit,
      maxSizeMB: this.cacheSizeLimit / 1024 / 1024,
      usage: totalSize / this.cacheSizeLimit,
      items
    };
  }

  /**
   * 打印缓存统计信息到控制台
   */
  logCacheStats(): void {
    const stats = this.getCacheStats();
    console.log('📊 ===== 音频缓存统计 =====');
    console.log(`📦 缓存项数: ${stats.itemCount}`);
    console.log(`💾 总大小: ${stats.totalSizeMB.toFixed(2)}MB / ${stats.maxSizeMB}MB`);
    console.log(`📈 使用率: ${(stats.usage * 100).toFixed(1)}%`);
    
    if (stats.items.length > 0) {
      console.log('📋 缓存详情:');
      stats.items.forEach(item => {
        console.log(`  - ${item.key}: ${item.sizeMB.toFixed(2)}MB, ${item.duration.toFixed(1)}s, 访问${item.accessCount}次`);
      });
    }
    console.log('========================');
  }

  /**
   * 设置缓存大小限制
   * @param sizeMB - 缓存大小限制（MB）
   */
  setMaxCacheSize(sizeMB: number): void {
    const oldLimit = this.cacheSizeLimit;
    this.cacheSizeLimit = sizeMB * 1024 * 1024;
    console.log(`📏 缓存限制: ${(oldLimit / 1024 / 1024).toFixed(0)}MB -> ${sizeMB}MB`);
    
    // 如果新限制更小，立即清理
    if (this.cacheSizeLimit < oldLimit) {
      this.cleanupCache();
    }
  }

  /**
   * 预热缓存：预加载常用调性
   * @param keys - 要预热的调性列表
   */
  async warmupCache(keys: BackingTrackKey[] = ['A', 'E', 'G']): Promise<void> {
    console.log(`🔥 开始缓存预热: ${keys.join(', ')}`);
    
    const promises = keys.map(key => 
      this.preloadTrack(key).catch(err => {
        console.warn(`⚠️ 预热 ${key} 调失败:`, err);
      })
    );

    await Promise.allSettled(promises);
    console.log('✅ 缓存预热完成');
    this.logCacheStats();
  }

  /**
   * 智能预加载：根据当前调性预加载相关调性
   * @param currentKey - 当前调性
   */
  async smartPreload(currentKey: BackingTrackKey): Promise<void> {
    const relatedKeys = this.getRelatedKeys(currentKey);
    console.log(`🧠 智能预加载 ${currentKey} 的相关调性: ${relatedKeys.join(', ')}`);
    
    // 后台低优先级加载
    setTimeout(() => {
      relatedKeys.forEach(key => {
        if (!this.preloadedBuffers.has(key) && !this.loadingKeys.has(key)) {
          this.preloadTrack(key).catch(err => {
            console.debug(`智能预加载 ${key} 调失败:`, err);
          });
        }
      });
    }, 1000); // 延迟1秒开始
  }

  /**
   * 获取相关调性（五度圈相邻调性）
   * @param key - 当前调性
   * @returns 相关调性列表
   */
  private getRelatedKeys(key: BackingTrackKey): BackingTrackKey[] {
    const allKeys: BackingTrackKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyIndex = allKeys.indexOf(key);
    const related: BackingTrackKey[] = [];
    
    // 五度圈相邻调性
    related.push(allKeys[(keyIndex + 7) % 12]); // 上五度
    related.push(allKeys[(keyIndex + 5) % 12]); // 下五度
    related.push(allKeys[(keyIndex + 2) % 12]); // 大二度
    
    return related.filter(k => k !== key && this.isTrackAvailable(k));
  }

  /**
   * 清除预加载缓存
   * 释放所有缓存的音频数据，用于内存管理
   */
  clearPreloadCache(): void {
    const stats = this.getCacheStats();
    this.preloadedBuffers.clear();
    this.loadingKeys.clear();
    this.cacheAccessTime.clear();
    this.cacheAccessCount.clear();
    console.log(`🗑️ 已清除所有预加载缓存 (释放 ${stats.totalSizeMB.toFixed(2)}MB)`);
  }

  /**
   * 释放所有资源
   * 清理音频上下文、停止播放、清除缓存，用于组件卸载或应用关闭
   */
  dispose(): void {
    this.stop(); // 停止当前播放
    this.clearPreloadCache(); // 清除所有缓存
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close(); // 关闭音频上下文
    }
    // 清空所有引用以帮助垃圾回收
    this.audioContext = null;
    this.audioBuffer = null;
    this.gainNode = null;
    this.isInitialized = false;
  }
}

export default AudioBackingTrack;
