import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const compile = text => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const detectorUrl = moduleUrl(compile(await readFile(new URL('../src/utils/tuner.ts', import.meta.url), 'utf8')).replace("from 'pitchy'", `from '${pathToFileURL(require.resolve('pitchy')).href}'`));
const states = [];
const effects = [];
const slots = [];
let cursor = 0;
globalThis.__tunerTestHooks = {
  useState(value) { const i = cursor++; states[i] = value; return [value, next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; },
  useRef(value) { const i = cursor++; return slots[i] = { current: value }; },
  useCallback(fn) { return fn; },
  useEffect(fn) { effects.push(fn); },
};
const reactUrl = moduleUrl('export const {useState,useRef,useCallback,useEffect} = globalThis.__tunerTestHooks;');
const hookUrl = moduleUrl(compile(await readFile(new URL('../src/hooks/useTuner.ts', import.meta.url), 'utf8')).replace("from 'react'", `from '${reactUrl}'`).replace("from '../utils/tuner'", `from '${detectorUrl}'`));
let now = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const frames = new Map();
let frameId = 0;
globalThis.requestAnimationFrame = fn => { frames.set(++frameId, fn); return frameId; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
let amplitude = 0;
let sampleIndex = 0;
const contexts = [];
class Node {
  gain = { value: 1 };
  links = [];
  connect(node) { this.links.push(node); return node; }
  disconnect() { this.links = []; }
  getFloatTimeDomainData(buffer) {
    for (let i = 0; i < buffer.length; i++) buffer[i] = amplitude * Math.sin(2 * Math.PI * 110 * (sampleIndex + i) / 48000);
    sampleIndex += 2048;
  }
}
class Context {
  state = 'suspended'; sampleRate = 48000; destination = {}; resumes = 0;
  constructor() { contexts.push(this); }
  async resume() { this.resumes++; this.state = 'running'; }
  async close() { this.state = 'closed'; }
  createAnalyser() { return this.analyser = new Node(); }
  createMediaStreamSource() { return this.source = new Node(); }
  createGain() { return this.sink = new Node(); }
}
const tracks = [];
const constraints = [];
let deny = false;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: {
  async getUserMedia(options) {
    constraints.push(options);
    if (deny) throw Object.assign(new Error('Denied'), { name: 'NotAllowedError' });
    // Simulate an audio context interrupted by the browser's permission dialog.
    contexts.at(-1).state = 'suspended';
    const track = { label: 'Test Microphone', readyState: 'live', muted: false, stopped: false, stop() { this.stopped = true; }, addEventListener() {} };
    tracks.push(track);
    return { getTracks: () => [track], getAudioTracks: () => [track] };
  },
  async enumerateDevices() { return [{ deviceId: 'mic-1', kind: 'audioinput', label: 'Test Microphone' }]; },
  addEventListener() {}, removeEventListener() {},
} } });
globalThis.window = { isSecureContext: true, AudioContext: Context };
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
const { useTuner } = await import(hookUrl);
const tuner = useTuner();
const cleanups = effects.map(fn => fn());
await tuner.start();
assert.equal(states[0], 'listening');
assert.equal(contexts[0].resumes, 2, 'resume again after permission interruption');
assert.equal(contexts[0].source.links[0], contexts[0].analyser);
assert.equal(contexts[0].analyser.links[0], contexts[0].sink);
assert.equal(contexts[0].sink.links[0], contexts[0].destination);
assert.equal(contexts[0].sink.gain.value, 0, 'never monitor microphone through speakers');
assert.equal(states[7], 'Test Microphone');
function tick() {
  now += 50;
  const [id, fn] = frames.entries().next().value;
  frames.delete(id);
  fn(now);
}
for (let i = 0; i < 45; i++) tick();
assert.equal(states[8], 'silent', 'zero samples should be explained');
assert.equal(states[2], 0);
amplitude = 0.0005;
for (let i = 0; i < 5; i++) tick();
assert.equal(states[8], 'weak');
assert.ok(states[2] > 0, 'quiet audio should still move the input meter');
amplitude = 0.15;
for (let i = 0; i < 7; i++) tick();
assert.equal(states[8], 'receiving');
assert.ok(Math.abs(states[1] - 110) < 0.2, 'microphone frames reach actual pitch detector');
tracks[0].muted = true;
tick();
assert.equal(states[8], 'muted');
contexts[0].state = 'suspended';
tick();
assert.equal(states[8], 'suspended');
tuner.changeDevice('mic-1');
await new Promise(resolve => setImmediate(resolve));
assert.equal(tracks[0].stopped, true);
assert.equal(contexts[0].state, 'closed');
assert.equal(constraints.at(-1).audio.deviceId.exact, 'mic-1');
assert.equal(states[0], 'listening');
tuner.stop();
assert.equal(tracks.at(-1).stopped, true);
assert.equal(frames.size, 0);
assert.equal(states[0], 'idle');
deny = true;
await tuner.start();
assert.equal(states[0], 'idle');
assert.match(states[3], /权限被拒绝/);
assert.equal(contexts.at(-1).state, 'closed');
cleanups.forEach(fn => fn?.());
console.log('✓ Microphone → analyser → silent output graph; resumes after permission interruption');
console.log('✓ Silent/quiet/muted/suspended diagnostics, real detector receives microphone frames');
console.log('✓ Input device switch, permission rejection, recording and animation cleanup');
