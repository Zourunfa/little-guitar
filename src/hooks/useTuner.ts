import { useCallback, useEffect, useRef, useState } from 'react';
import { GuitarPitchDetector } from '../utils/tuner';

type AudioResources = { context: AudioContext; stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; frame: number; sink?: GainNode; analyser?: AnalyserNode; oscillator?: OscillatorNode };
const dispose = (audio: AudioResources) => {
  cancelAnimationFrame(audio.frame);
  audio.stream?.getTracks().forEach(track => track.stop());
  audio.source?.disconnect();
  audio.analyser?.disconnect();
  audio.sink?.disconnect();
  try { audio.oscillator?.stop(); } catch { /* Already ended. */ }
  if (audio.context.state !== 'closed') void audio.context.close().catch(() => {});
};

export function useTuner() {
  const [status, setStatus] = useState<'idle' | 'starting' | 'listening'>('idle');
  const [frequency, setFrequency] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [inputName, setInputName] = useState('');
  const [signal, setSignal] = useState<'waiting' | 'silent' | 'weak' | 'receiving' | 'muted' | 'suspended'>('waiting');
  const [decibels, setDecibels] = useState<number | null>(null);
  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices?.enumerateDevices();
      setDevices((list || []).filter(device => device.kind === 'audioinput' && device.deviceId !== 'default'));
    } catch { /* Device selection is optional; a denied enumeration must not stop recording. */ }
  }, []);
  const audioRef = useRef<AudioResources | null>(null);
  const toneRef = useRef<AudioResources | null>(null);
  const generation = useRef(0);
  const mutedUntil = useRef(0);

  const stopTone = useCallback(() => {
    if (toneRef.current) dispose(toneRef.current);
    toneRef.current = null;
    setPlaying(false);
  }, []);
  const stop = useCallback(() => {
    generation.current++;
    if (audioRef.current) dispose(audioRef.current);
    audioRef.current = null;
    stopTone();
    setStatus('idle');
    setFrequency(null);
    setLevel(0);
    setDecibels(null);
    setSignal('waiting');
  }, [stopTone]);

  const start = useCallback(async (inputDevice = deviceId) => {
    if (audioRef.current) return;
    const id = ++generation.current;
    setError('');
    setStatus('starting');
    setSignal('waiting');
    let resources: AudioResources | null = null;
    try {
      if (!window.isSecureContext) throw new Error('麦克风需要 HTTPS 或 localhost，请使用本地预览地址。');
      const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context || !navigator.mediaDevices?.getUserMedia) throw new Error('当前浏览器不支持麦克风调音，请使用新版 Chrome、Edge 或 Safari。');
      const context = new Context();
      resources = { context, stream: null, source: null, frame: 0 };
      audioRef.current = resources;
      await context.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        ...(inputDevice ? { deviceId: { exact: inputDevice } } : {}),
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      } });
      if (id !== generation.current) { stream.getTracks().forEach(track => track.stop()); dispose(resources); return; }
      resources.stream = stream;
      // The permission dialog can interrupt the context after the initial user gesture.
      if (context.state !== 'running') await context.resume();
      if (id !== generation.current) { dispose(resources); return; }
      const track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== 'live') throw new Error('麦克风没有提供有效音轨，请选择其他输入设备。');
      setInputName(track.label || '系统默认麦克风');
      void refreshDevices();
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      const source = context.createMediaStreamSource(stream);
      resources.source = source;
      resources.analyser = analyser;
      // Keep the audio graph rendering on browsers that stop pulling a disconnected branch.
      // A zero gain output keeps microphone monitoring inaudible and prevents feedback.
      const sink = context.createGain();
      sink.gain.value = 0;
      resources.sink = sink;
      source.connect(analyser);
      analyser.connect(sink);
      sink.connect(context.destination);
      const samples = new Float32Array(analyser.fftSize);
      const detector = new GuitarPitchDetector(samples.length);
      let lastFrame = 0;
      let lastPitch = 0;
      let lastInput = performance.now();
      setStatus('listening');
      const process = (now: number) => {
        if (id !== generation.current) return;
        if (now - lastFrame >= 45) {
          lastFrame = now;
          analyser.getFloatTimeDomainData(samples);
          const result = detector.detect(samples, context.sampleRate);
          const db = 20 * Math.log10(Math.max(result.rms, 0.000001));
          setDecibels(Math.round(db));
          setLevel(Math.min(100, Math.max(0, (db + 90) / 90 * 100)));
          if (result.rms > 0.00001) lastInput = now;
          setSignal(context.state !== 'running' ? 'suspended' : track.muted ? 'muted' : now - lastInput > 2000 ? 'silent' : result.rms < 0.003 ? 'weak' : 'receiving');
          if (context.state !== 'running' || track.muted || performance.now() < mutedUntil.current) { detector.reset(); setFrequency(null); }
          else if (result.frequency) { setFrequency(result.frequency); lastPitch = now; }
          else if (now - lastPitch > 350) setFrequency(null);
        }
        if (resources) resources.frame = requestAnimationFrame(process);
      };
      resources.frame = requestAnimationFrame(process);
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (id === generation.current) { stop(); setError('麦克风已断开，请检查设备后重新开始。'); }
      });
    } catch (err) {
      if (resources) dispose(resources);
      if (id !== generation.current) return;
      audioRef.current = null;
      setStatus('idle');
      const cause = err as Error;
      const messages: Record<string, string> = {
        NotAllowedError: '麦克风权限被拒绝，请在地址栏的网站设置中允许麦克风，然后重试。',
        NotFoundError: '没有找到麦克风，请连接输入设备后重试。',
        NotReadableError: '麦克风被其他程序占用或无法读取，请检查系统音频输入。',
        OverconstrainedError: '选中的麦克风不可用，请切换到系统默认或其他输入设备。',
      };
      setError(messages[cause.name] || cause.message || '麦克风启动失败，请重试。');
    }
  }, [stop, deviceId, refreshDevices]);

  const changeDevice = useCallback((id: string) => {
    const restart = audioRef.current !== null;
    stop();
    setDeviceId(id);
    if (restart) void start(id);
  }, [start, stop]);

  const playTone = useCallback(async (hz: number) => {
    stopTone();
    let tone: AudioResources | null = null;
    try {
      const context = new AudioContext();
      tone = { context, stream: null, source: null, frame: 0 };
      toneRef.current = tone;
      await context.resume();
      if (toneRef.current !== tone) return;
      const oscillator = context.createOscillator();
      tone.oscillator = oscillator;
      const gain = context.createGain();
      oscillator.frequency.value = hz;
      oscillator.type = 'triangle';
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.16, context.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
      oscillator.connect(gain).connect(context.destination);
      mutedUntil.current = performance.now() + 1900;
      setFrequency(null);
      setPlaying(true);
      oscillator.onended = () => {
        if (toneRef.current === tone) { toneRef.current = null; setPlaying(false); }
        if (context.state !== 'closed') void context.close().catch(() => {});
      };
      oscillator.start();
      oscillator.stop(context.currentTime + 1.6);
    } catch {
      if (tone) dispose(tone);
      toneRef.current = null;
      setPlaying(false);
      setError('基准音播放失败，请检查浏览器音频设置后重试。');
    }
  }, [stopTone]);

  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => {
    const onHide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); stop(); };
  }, [stop]);

  return { status, frequency, level, error, playing, start, stop, playTone, devices, deviceId, inputName, signal, decibels, changeDevice };
}
