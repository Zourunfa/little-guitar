import { useState } from 'react';
import { useTuner } from '../hooks/useTuner';
import { centsBetween, closestString, frequencyMidi, midiFrequency, noteName, TUNINGS, type Tuning } from '../utils/tuner';
import './TunerPage.css';

const pianoNotes = Array.from({ length: 36 }, (_, i) => i + 36);
const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

export default function TunerPage() {
  const tuner = useTuner();
  const [tuning, setTuning] = useState<Tuning>('standard');
  const [selected, setSelected] = useState<number | null>(null);
  const [a4, setA4] = useState(440);
  const [keyboard, setKeyboard] = useState(false);
  const [reference, setReference] = useState(0);
  const active = selected ?? (tuner.frequency ? closestString(tuner.frequency, tuning, a4) : reference);
  const targetMidi = TUNINGS[tuning].midi[active];
  const target = midiFrequency(targetMidi, a4);
  const cents = tuner.frequency ? centsBetween(tuner.frequency, target) : null;
  const inTune = cents !== null && Math.abs(cents) <= 5;
  const detectedMidi = tuner.frequency ? Math.round(frequencyMidi(tuner.frequency, a4)) : null;
  const color = cents === null ? '#94a3b8' : inTune ? '#059669' : Math.abs(cents) <= 15 ? '#d97706' : '#e05b4a';
  const direction = cents === null ? (tuner.status === 'listening' ? '轻拨一根空弦，等待识音' : '点击开始，允许麦克风访问') : inTune ? '音准准确，保持这个位置' : cents < 0 ? '音偏低 · 缓慢拧紧琴弦' : '音偏高 · 缓慢放松琴弦';
  const inputHint = tuner.status !== 'listening' ? '' : {
    waiting: '等待麦克风输入…',
    silent: '没有收到音频采样。请切换下方麦克风，并检查系统声音输入、硬件静音和浏览器麦克风权限。',
    weak: '输入声音很小，请靠近麦克风弹弦，或在系统声音设置中提高输入音量。',
    receiving: tuner.frequency ? '正在接收声音' : '已收到声音，请单独拨响一根空弦，并让其他弦静音。',
    muted: '麦克风音轨被系统或浏览器暂停，请检查麦克风权限、硬件静音，或切换输入设备。',
    suspended: '音频引擎被浏览器暂停，请点击「停止调音」后重新开始；也可在 Chrome 或 Safari 中打开本地地址。',
  }[tuner.signal];
  const angle = cents === null ? 0 : Math.max(-50, Math.min(50, cents)) * 1.25;
  const point = (degrees: number, radius: number) => {
    const rad = (degrees - 90) * Math.PI / 180;
    return { x: 300 + Math.cos(rad) * radius, y: 255 + Math.sin(rad) * radius };
  };
  const playReference = () => { setReference(active); void tuner.playTone(target); };

  return (
    <div className="tuner-page">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-7">
          <div className="text-xs font-semibold tracking-[0.25em] text-emerald-700 mb-3">LITTLE GUITAR / TUNER</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">让每一根弦，恰到好处。</h1>
          <p className="text-slate-500 text-sm">吉他在线调音器 · 单弦识音 · 实时音准反馈</p>
        </header>

        <section className="tuner-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-7 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500"><span className={`w-2 h-2 rounded-full ${tuner.status === 'listening' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />{tuner.status === 'listening' ? '麦克风已连接' : tuner.status === 'starting' ? '等待麦克风授权…' : '麦克风未开启'}</div>
            <div className="flex items-center gap-3 text-sm">
              <label className="sr-only" htmlFor="tuning-preset">调弦方式</label>
              <select id="tuning-preset" value={tuning} onChange={e => { setTuning(e.target.value as Tuning); }} className="tuner-select">
                {Object.entries(TUNINGS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
              <label className="flex items-center gap-1 text-slate-500">A4
                <select aria-label="A4 基准频率" className="tuner-select" value={a4} onChange={e => setA4(Number(e.target.value))}>
                  {[432, 438, 439, 440, 441, 442, 443, 444, 445].map(hz => <option key={hz} value={hz}>{hz} Hz</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="px-4 sm:px-10 pt-6">
            <div className="text-center text-xs text-slate-400 tracking-wider">{selected === null ? '自动识别琴弦' : `已锁定第 ${6 - selected} 弦`} · 目标 {noteName(targetMidi)} / {target.toFixed(2)} Hz</div>
            <div className="tuner-dial">
              <svg viewBox="0 0 600 290" role="img" aria-label={`音准指针：${cents === null ? '等待输入' : `${cents.toFixed(1)} 音分`}`}>
                <path d="M 69 147 A 255 255 0 0 1 531 147" fill="none" stroke="#f1f5f9" strokeWidth="24" strokeLinecap="round" />
                <path d="M 279 1 A 255 255 0 0 1 321 1" fill="none" stroke="#a7f3d0" strokeWidth="24" />
                {Array.from({ length: 51 }, (_, i) => {
                  const degrees = (i - 25) * 2.5;
                  const major = i % 5 === 0;
                  const a = point(degrees, 245);
                  const b = point(degrees, major ? 219 : 233);
                  return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={i === 25 ? '#059669' : '#64748b'} strokeWidth={major ? 2.5 : 1} />;
                })}
                {[-50, -25, 0, 25, 50].map(value => { const p = point(value * 1.25, 193); return <text key={value} x={p.x} y={p.y} textAnchor="middle" fill={value === 0 ? '#059669' : '#94a3b8'} fontSize="12">{value > 0 ? '+' : ''}{value}</text>; })}
                <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '300px 255px', transition: 'transform 160ms ease-out' }}>
                  <line x1="300" y1="255" x2="300" y2="43" stroke={color} strokeWidth="3" strokeLinecap="round" opacity={cents === null ? 0.25 : 0.8} />
                  <circle cx="300" cy="255" r="6" fill={color} />
                </g>
              </svg>
              <div className="tuner-readout">
                <div className="text-[11px] tracking-widest text-slate-400 mb-1">当前音高</div>
                <div className="text-6xl sm:text-7xl font-semibold tracking-tight tabular-nums" style={{ color }}>{detectedMidi === null ? '—' : noteName(detectedMidi)}</div>
                <div className="text-sm text-slate-500 tabular-nums mt-2">{tuner.frequency ? `${tuner.frequency.toFixed(2)} Hz` : '等待声音'}</div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 px-5 -mt-3"><span>♭ 偏低 / 拧紧</span><span>偏高 / 放松 ♯</span></div>
            </div>
            <div className="text-center mt-3 mb-6" aria-live="polite">
              <div className="text-xl font-semibold tabular-nums mb-1" style={{ color }}>{cents === null ? (tuner.status === 'listening' ? '正在聆听…' : '准备好了吗？') : inTune ? '✓ 已调准' : `${cents > 0 ? '+' : ''}${cents.toFixed(1)} 音分`}</div>
              <p className="text-sm text-slate-500">{tuner.playing ? '正在播放基准音 · 播放结束后恢复识音' : direction}</p>
              {cents !== null && Math.abs(cents) > 150 && <p className="text-xs text-amber-700 mt-2">偏差较大，请先确认琴弦和目标八度，缓慢调整。</p>}
            </div>

            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-sm font-semibold text-slate-700">选择琴弦</h2>
              <button className={`tuner-mode ${selected === null ? 'is-selected' : ''}`} aria-pressed={selected === null} onClick={() => setSelected(null)}>✦ 自动识弦</button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
              {TUNINGS[tuning].midi.map((midi, i) => <button key={i} className={`tuner-string ${active === i ? 'is-selected' : ''}`} aria-pressed={active === i} aria-label={`锁定第${6 - i}弦 ${noteName(midi)}`} onClick={() => { setSelected(i); setReference(i); }}>
                <span className="text-[10px] sm:text-xs text-slate-400">{6 - i} 弦</span>
                <span className="block text-xl sm:text-2xl font-semibold my-1">{noteName(midi)}</span>
                <span className="hidden sm:block text-[10px] text-slate-400 tabular-nums">{midiFrequency(midi, a4).toFixed(2)} Hz</span>
              </button>)}
            </div>

            <div className="flex flex-wrap justify-center gap-3 my-6">
              <button className="tuner-primary" onClick={() => tuner.status === 'idle' ? void tuner.start() : tuner.stop()}>{tuner.status === 'starting' ? '取消授权等待' : tuner.status === 'listening' ? '■ 停止调音' : '● 开始调音'}</button>
              <button className="tuner-secondary" onClick={playReference} disabled={tuner.playing}>{tuner.playing ? '♫ 播放中…' : `♫ 听 ${noteName(targetMidi)} 基准音`}</button>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4">
              <label htmlFor="tuner-input" className="block text-xs font-semibold text-slate-600 mb-2">麦克风输入</label>
              <select id="tuner-input" className="tuner-select w-full" value={tuner.deviceId} onChange={e => tuner.changeDevice(e.target.value)}>
                <option value="">系统默认麦克风</option>
                {tuner.devices.map((device, i) => <option key={device.deviceId} value={device.deviceId}>{device.label || `麦克风 ${i + 1}`}</option>)}
              </select>
              {tuner.status === 'listening' && <p className="text-xs text-slate-500 mt-2">当前使用：{tuner.inputName}</p>}
              {inputHint && <p role="status" className={`text-xs leading-5 mt-2 ${['silent', 'muted', 'suspended'].includes(tuner.signal) ? 'text-amber-700' : 'text-slate-500'}`}>{inputHint}</p>}
            </div>
            {tuner.error && <div role="alert" className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-4 mb-5">{tuner.error}</div>}
            <div className="flex items-center justify-center gap-3 pb-6 text-[11px] text-slate-400"><span>输入电平</span><div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden" role="meter" aria-label="麦克风输入电平" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tuner.level)}><div className="h-full bg-emerald-400 transition-all" style={{ width: `${tuner.level}%` }} /></div><span className="tabular-nums">{tuner.decibels === null ? '未采样' : tuner.decibels <= -100 ? '无信号' : `${tuner.decibels} dBFS`}</span><span>仅在本机处理</span></div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-4 sm:px-10 py-4">
            <div className="flex justify-between items-center"><span className="text-xs text-slate-500">用琴键听音，辅助校准</span><button className="tuner-mode" aria-expanded={keyboard} onClick={() => setKeyboard(!keyboard)}>{keyboard ? '收起键盘 ↑' : '展开钢琴键盘 ↓'}</button></div>
            {keyboard && <div className="overflow-x-auto mt-4 pb-2"><div className="tuner-keyboard">{pianoNotes.map((midi, index) => {
              const whiteBefore = pianoNotes.slice(0, index).filter(n => !isBlack(n)).length;
              const black = isBlack(midi);
              return <button key={midi} aria-label={`播放 ${noteName(midi)}`} className={`tuner-key ${black ? 'black' : 'white'} ${detectedMidi === midi ? 'sounding' : ''}`} style={black ? { left: whiteBefore * 30 - 9 } : { left: whiteBefore * 30 }} onClick={() => void tuner.playTone(midiFrequency(midi, a4))}><span>{noteName(midi)}</span></button>;
            })}</div></div>}
          </div>
        </section>
        <div className="grid sm:grid-cols-3 gap-5 mt-7 text-sm text-slate-500">
          <div><p className="font-semibold text-slate-700 mb-1">01 / 允许麦克风</p><p className="text-xs leading-6">点击开始，允许浏览器访问麦克风，观察输入电平是否有变化。</p></div>
          <div><p className="font-semibold text-slate-700 mb-1">02 / 一次拨一根弦</p><p className="text-xs leading-6">轻拨空弦，并让其他弦静音。自动识弦不准时，点击琴弦锁定目标。</p></div>
          <div><p className="font-semibold text-slate-700 mb-1">03 / 指针回到中央</p><p className="text-xs leading-6">偏低慢慢拧紧，偏高慢慢放松；绿色表示偏差在 ±5 音分内。</p></div>
        </div>
      </div>
    </div>
  );
}
