/**
 * 鼓组音频工具类
 * 使用 Web Audio API 生成不同的鼓声音色
 */
import type { IDrumKit } from '../types/utils';

class DrumKit implements IDrumKit {
  audioContext: AudioContext | null = null;
  isInitialized: boolean = false;

  /**
   * 初始化音频上下文
   */
  init(): void {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
    } catch (e) {
      console.error('Web Audio API 不支持:', e);
    }
  }

  /**
   * 播放底鼓 (Kick Drum)
   * @param time - 播放时间
   * @param volume - 音量 (0-1)
   */
  playKick(time: number = 0, volume: number = 0.8): void {
    if (!this.isInitialized || !this.audioContext) return;

    const ctx = this.audioContext;
    const startTime = ctx.currentTime + time;

    // 使用振荡器生成低频音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  }

  /**
   * 播放军鼓 (Snare Drum)
   * @param time - 播放时间
   * @param volume - 音量 (0-1)
   */
  playSnare(time: number = 0, volume: number = 0.6): void {
    if (!this.isInitialized || !this.audioContext) return;

    const ctx = this.audioContext;
    const startTime = ctx.currentTime + time;

    // 噪声部分 (使用白噪声模拟军鼓的沙沙声)
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + 0.2);

    // 音调部分 (给军鼓增加一些音调)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, startTime);
    osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);

    oscGain.gain.setValueAtTime(volume * 0.3, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }

  /**
   * 播放踩镲 (Hi-Hat)
   * @param time - 播放时间
   * @param volume - 音量 (0-1)
   * @param isOpen - 是否为开镲
   */
  playHiHat(time: number = 0, volume: number = 0.3, isOpen: boolean = false): void {
    if (!this.isInitialized || !this.audioContext) return;

    const ctx = this.audioContext;
    const startTime = ctx.currentTime + time;
    const duration = isOpen ? 0.3 : 0.05;

    // 使用多个高频振荡器混合产生金属感
    const fundamental = 40;
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];

    ratios.forEach(ratio => {
      const osc = ctx.createOscillator();
      const bandpass = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = fundamental * ratio;

      bandpass.type = 'bandpass';
      bandpass.frequency.value = 10000;
      bandpass.Q.value = 0.5;

      gain.gain.setValueAtTime(volume / ratios.length, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * 播放 Blues Shuffle 节奏型
   * @param beatNumber - 当前拍号
   * @param volume - 整体音量
   * @param beatsPerBar - 每小节拍数（默认4）
   */
  playBluesShuffle(beatNumber: number, volume: number = 0.7, beatsPerBar: number = 4): void {
    // 将拍号映射到4拍循环模式 (1,2,3,4,1,2,3,4...)
    const normalizedBeat = ((beatNumber - 1) % 4) + 1;
      
    switch (normalizedBeat) {
      case 1: // 第一拍: 底鼓 + 踩镸
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4);
        break;
      case 2: // 第二拍: 军鼓 + 踩镸
        this.playSnare(0, volume * 0.7);
        this.playHiHat(0, volume * 0.4);
        break;
      case 3: // 第三拍: 底鼓 + 踩镸
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4);
        break;
      case 4: // 第四拍: 军鼓 + 踩镸
        this.playSnare(0, volume * 0.7);
        this.playHiHat(0, volume * 0.4);
        break;
    }
  }

  /**
   * 播放标准四四拍节奏
   * @param beatNumber - 当前拍号
   * @param volume - 整体音量
   * @param beatsPerBar - 每小节拍数（默认4）
   */
  playStandardBeat(beatNumber: number, volume: number = 0.7, beatsPerBar: number = 4): void {
    // 将拍号映射到4拍循环模式
    const normalizedBeat = ((beatNumber - 1) % 4) + 1;
      
    switch (normalizedBeat) {
      case 1: // 第一拍: 底鼓 + 踩镸(重音)
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.5);
        break;
      case 2: // 第二拍: 军鼓 + 踩镸
        this.playSnare(0, volume * 0.8);
        this.playHiHat(0, volume * 0.3);
        break;
      case 3: // 第三拍: 底鼓 + 踩镸
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4);
        break;
      case 4: // 第四拍: 军鼓 + 踩镸
        this.playSnare(0, volume * 0.8);
        this.playHiHat(0, volume * 0.3);
        break;
    }
  }

  /**
   * 播放慢速 Blues 节奏
   * @param beatNumber - 当前拍号
   * @param volume - 整体音量
   * @param beatsPerBar - 每小节拍数（默认4）
   */
  playSlowBlues(beatNumber: number, volume: number = 0.7, beatsPerBar: number = 4): void {
    // 将拍号映射到4拍循环模式
    const normalizedBeat = ((beatNumber - 1) % 4) + 1;
      
    switch (normalizedBeat) {
      case 1: // 第一拍: 底鼓 + 开镸
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4, true); // 开镸
        break;
      case 2: // 第二拍: 踩镸
        this.playHiHat(0, volume * 0.3);
        break;
      case 3: // 第三拍: 军鼓 + 踩镸
        this.playSnare(0, volume * 0.7);
        this.playHiHat(0, volume * 0.3);
        break;
      case 4: // 第四拍: 踩镸
        this.playHiHat(0, volume * 0.3);
        break;
    }
  }

  /**
   * 释放音频资源
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isInitialized = false;
    this.audioContext = null;
  }
}

export default DrumKit;
