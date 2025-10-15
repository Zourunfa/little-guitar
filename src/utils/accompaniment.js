/**
 * 伴奏音频工具类
 * 使用 Web Audio API 生成口琴和吉他的音色
 */
class Accompaniment {
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
   * 频率映射表 (A4 = 440Hz)
   */
  getNoteFrequency(note, octave = 4) {
    const noteMap = {
      'C': -9, 'C#': -8, 'D': -7, 'D#': -6,
      'E': -5, 'F': -4, 'F#': -3, 'G': -2,
      'G#': -1, 'A': 0, 'A#': 1, 'B': 2
    };
    
    const semitones = noteMap[note] + (octave - 4) * 12;
    return 440 * Math.pow(2, semitones / 12);
  }

  /**
   * 播放口琴音色
   * @param {string} note - 音符名称 (如 'C', 'D#')
   * @param {number} octave - 八度
   * @param {number} duration - 持续时间(秒)
   * @param {number} volume - 音量 (0-1)
   */
  playHarmonica(note, octave = 4, duration = 0.5, volume = 0.4) {
    if (!this.isInitialized) return;

    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const frequency = this.getNoteFrequency(note, octave);
    
    // 验证频率是否有效
    if (!frequency || isNaN(frequency) || !isFinite(frequency)) {
      console.warn(`Invalid frequency for note ${note}${octave}: ${frequency}`);
      return;
    }

    // 口琴音色：使用多个振荡器混合，模拟簧片振动
    const oscillators = [];
    const gains = [];

    // 基频
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.value = frequency;
    gain1.gain.setValueAtTime(volume * 0.5, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    oscillators.push(osc1);
    gains.push(gain1);

    // 二次谐波 (增加明亮度)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.value = frequency * 2;
    gain2.gain.setValueAtTime(volume * 0.2, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    oscillators.push(osc2);
    gains.push(gain2);

    // 三次谐波 (增加金属感)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.value = frequency * 3;
    gain3.gain.setValueAtTime(volume * 0.1, startTime);
    gain3.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    oscillators.push(osc3);
    gains.push(gain3);

    // 添加颤音效果 (LFO)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5; // 5Hz 颤音
    lfoGain.gain.value = 10; // 颤音深度
    lfo.connect(lfoGain);
    oscillators.forEach(osc => {
      lfoGain.connect(osc.frequency);
    });

    // 启动所有振荡器
    oscillators.forEach(osc => {
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    lfo.start(startTime);
    lfo.stop(startTime + duration);
  }

  /**
   * 播放吉他音色
   * @param {string} note - 音符名称
   * @param {number} octave - 八度
   * @param {number} duration - 持续时间(秒)
   * @param {number} volume - 音量 (0-1)
   * @param {boolean} isMuted - 是否闷音
   */
  playGuitar(note, octave = 3, duration = 1.0, volume = 0.5, isMuted = false) {
    if (!this.isInitialized) return;

    const ctx = this.audioContext;
    const startTime = ctx.currentTime;
    const frequency = this.getNoteFrequency(note, octave);
    
    // 验证频率是否有效
    if (!frequency || isNaN(frequency) || !isFinite(frequency)) {
      console.warn(`Invalid frequency for note ${note}${octave}: ${frequency}`);
      return;
    }

    // 吉他音色：使用 Karplus-Strong 算法模拟拨弦
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = frequency;

    // 低通滤波器模拟弦的阻尼
    filter.type = 'lowpass';
    filter.frequency.value = isMuted ? 800 : 3000;
    filter.Q.value = 1;

    // 包络：快速起音，缓慢衰减
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01); // 快速起音
    gain.gain.exponentialRampToValueAtTime(volume * 0.3, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * 播放吉他和弦
   * @param {Array} notes - 和弦音符数组 [{note: 'C', octave: 3}, ...]
   * @param {number} duration - 持续时间
   * @param {number} volume - 音量
   * @param {string} strumPattern - 扫弦模式 ('down' | 'up' | 'muted')
   */
  playGuitarChord(notes, duration = 1.5, volume = 0.4, strumPattern = 'down') {
    if (!this.isInitialized || !notes || notes.length === 0) return;

    const isMuted = strumPattern === 'muted';
    const strumDelay = 0.02; // 扫弦延迟

    notes.forEach((noteObj, index) => {
      const delay = strumPattern === 'up' 
        ? (notes.length - 1 - index) * strumDelay 
        : index * strumDelay;
      
      setTimeout(() => {
        this.playGuitar(noteObj.note, noteObj.octave, duration, volume, isMuted);
      }, delay * 1000);
    });
  }

  /**
   * 播放口琴 Blues Riff
   * @param {string} rootNote - 根音
   * @param {number} volume - 音量
   */
  playHarmonicaBluesRiff(rootNote, volume = 0.4) {
    if (!this.isInitialized) return;

    // 简单的 Blues riff 模式
    const riff = [
      { note: rootNote, octave: 4, duration: 0.3, delay: 0 },
      { note: rootNote, octave: 5, duration: 0.2, delay: 0.3 },
      { note: rootNote, octave: 4, duration: 0.3, delay: 0.5 },
      { note: rootNote, octave: 4, duration: 0.4, delay: 0.8 }
    ];

    riff.forEach(({ note, octave, duration, delay }) => {
      setTimeout(() => {
        this.playHarmonica(note, octave, duration, volume);
      }, delay * 1000);
    });
  }

  /**
   * 播放吉他 Blues 节奏型
   * @param {string} chord - 和弦根音
   * @param {number} beatNumber - 当前拍号 (1-4)
   * @param {number} volume - 音量
   */
  playGuitarBluesRhythm(chord, beatNumber, volume = 0.4) {
    if (!this.isInitialized) return;

    // 根据和弦生成三和弦音符
    const chordNotes = this.getChordNotes(chord);

    switch (beatNumber) {
      case 1: // 第一拍: 完整和弦，向下扫弦
        this.playGuitarChord(chordNotes, 0.8, volume, 'down');
        break;
      case 2: // 第二拍: 闷音
        this.playGuitarChord(chordNotes, 0.3, volume * 0.6, 'muted');
        break;
      case 3: // 第三拍: 完整和弦，向下扫弦
        this.playGuitarChord(chordNotes, 0.8, volume, 'down');
        break;
      case 4: // 第四拍: 闷音
        this.playGuitarChord(chordNotes, 0.3, volume * 0.6, 'muted');
        break;
    }
  }

  /**
   * 根据根音生成属七和弦音符
   * @param {string} rootNote - 根音
   * @returns {Array} 和弦音符数组
   */
  getChordNotes(rootNote) {
    const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteMap.indexOf(rootNote);
    
    if (rootIndex === -1) return [];

    // 属七和弦: 根音, 大三度, 纯五度, 小七度
    const intervals = [0, 4, 7, 10];
    
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      const octave = 3 + Math.floor((rootIndex + interval) / 12);
      return {
        note: noteMap[noteIndex],
        octave: octave
      };
    });
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

export default Accompaniment;
