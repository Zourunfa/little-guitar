/**
 * 鼓组音频工具类
 * 使用 Web Audio API 生成不同的鼓声音色
 */
class DrumKit {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  /**
   * 初始化音频上下文
   */
  init() {
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
   * @param {number} time - 播放时间
   * @param {number} volume - 音量 (0-1)
   */
  playKick(time = 0, volume = 0.8) {
    if (!this.isInitialized) return;

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
   * @param {number} time - 播放时间
   * @param {number} volume - 音量 (0-1)
   */
  playSnare(time = 0, volume = 0.6) {
    if (!this.isInitialized) return;

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
   * @param {number} time - 播放时间
   * @param {number} volume - 音量 (0-1)
   * @param {boolean} isOpen - 是否为开镲
   */
  playHiHat(time = 0, volume = 0.3, isOpen = false) {
    if (!this.isInitialized) return;

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
   * @param {number} beatNumber - 当前拍号 (1-4)
   * @param {number} volume - 整体音量
   */
  playBluesShuffle(beatNumber, volume = 0.7) {
    switch (beatNumber) {
      case 1: // 第一拍: 底鼓 + 踩镲
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4);
        break;
      case 2: // 第二拍: 军鼓 + 踩镲
        this.playSnare(0, volume * 0.7);
        this.playHiHat(0, volume * 0.4);
        break;
      case 3: // 第三拍: 底鼓 + 踩镲
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4);
        break;
      case 4: // 第四拍: 军鼓 + 踩镲
        this.playSnare(0, volume * 0.7);
        this.playHiHat(0, volume * 0.4);
        break;
    }
  }

  /**
   * 播放标准四四拍节奏
   * @param {number} beatNumber - 当前拍号 (1-4)
   * @param {number} volume - 整体音量
   */
  playStandardBeat(beatNumber, volume = 0.7) {
    switch (beatNumber) {
      case 1: // 第一拍: 底鼓 + 踩镲(重音)
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.5);
        break;
      case 2: // 第二拍: 军鼓 + 踩镲
        this.playSnare(0, volume * 0.8);
        this.playHiHat(0, volume * 0.3);
        break;
      case 3: // 第三拍: 底鼓 + 踩镲
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4);
        break;
      case 4: // 第四拍: 军鼓 + 踩镲
        this.playSnare(0, volume * 0.8);
        this.playHiHat(0, volume * 0.3);
        break;
    }
  }

  /**
   * 播放慢速 Blues 节奏
   * @param {number} beatNumber - 当前拍号 (1-4)
   * @param {number} volume - 整体音量
   */
  playSlowBlues(beatNumber, volume = 0.7) {
    switch (beatNumber) {
      case 1: // 第一拍: 底鼓 + 开镲
        this.playKick(0, volume * 0.9);
        this.playHiHat(0, volume * 0.4, true); // 开镲
        break;
      case 2: // 第二拍: 踩镲
        this.playHiHat(0, volume * 0.3);
        break;
      case 3: // 第三拍: 军鼓 + 踩镲
        this.playSnare(0, volume * 0.7);
        this.playHiHat(0, volume * 0.3);
        break;
      case 4: // 第四拍: 踩镲
        this.playHiHat(0, volume * 0.3);
        break;
    }
  }

  /**
   * 释放音频资源
   */
  dispose() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isInitialized = false;
    this.audioContext = null;
  }
}

export default DrumKit;
