import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Exercise the actual TypeScript module without adding a test runtime dependency.
const require = createRequire(import.meta.url);
const source = await readFile(new URL('../src/utils/tuner.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText
  .replace("from 'pitchy'", `from '${pathToFileURL(require.resolve('pitchy')).href}'`);
const { GuitarPitchDetector, midiFrequency, frequencyMidi, noteName, centsBetween, closestString, TUNINGS } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
let cases = 0;
function checkPitch(hz, rate, harmonics, noise = 0) {
  const detector = new GuitarPitchDetector();
  let result;
  let seed = 42;
  for (let frame = 0; frame < 7; frame++) {
    const data = Float32Array.from({ length: 4096 }, (_, i) => {
      const time = (i + frame * 2048) / rate;
      seed = (1664525 * seed + 1013904223) >>> 0;
      return harmonics.reduce((sum, amplitude, h) => sum + amplitude * Math.sin(2 * Math.PI * hz * (h + 1) * time), 0) + noise * (seed / 4294967296 - 0.5) + 0.02;
    });
    result = detector.detect(data, rate);
  }
  assert.ok(result.frequency, `No pitch for ${hz} Hz at ${rate}`);
  assert.ok(Math.abs(centsBetween(result.frequency, hz)) < 2, `${hz}: detected ${result.frequency}`);
  cases++;
}
for (const rate of [44100, 48000]) {
  for (const [key, preset] of Object.entries(TUNINGS)) {
    for (const [i, midi] of preset.midi.entries()) {
      const hz = midiFrequency(midi);
      for (const detune of [-35, 0, 27]) {
        const actual = hz * 2 ** (detune / 1200);
        checkPitch(actual, rate, [0.2]);
        checkPitch(actual, rate, [0.05, 0.22, 0.13, 0.06], 0.015);
        assert.equal(closestString(actual, key, 440), i);
      }
    }
  }
}
assert.equal(noteName(40), 'E2');
assert.equal(noteName(64), 'E4');
assert.equal(noteName(59.9), 'C4');
assert.equal(midiFrequency(69, 432), 432);
assert.equal(Math.round(frequencyMidi(440)), 69);
const detector = new GuitarPitchDetector();
assert.equal(detector.detect(new Float32Array(4096), 48000).frequency, null);
assert.equal(detector.detect(new Float32Array(4096).fill(0.3), 48000).frequency, null);
let seed = 17;
for (let i = 0; i < 10; i++) {
  const noise = Float32Array.from({length: 4096}, () => { seed = (1664525 * seed + 1013904223) >>> 0; return (seed / 4294967296 - 0.5) * 0.15; });
  assert.equal(detector.detect(noise, 48000).frequency, null);
}
for (const midi of [40, 64, 45, 59]) {
  const hz = midiFrequency(midi);
  let result;
  for (let i = 0; i < 5; i++) result = detector.detect(Float32Array.from({ length: 4096 }, (_, n) => 0.1 * Math.sin(2 * Math.PI * hz * n / 48000)), 48000);
  assert.ok(Math.abs(centsBetween(result.frequency, hz)) < 2);
}
assert.equal(detector.detect(new Float32Array(4096), 48000).frequency, null);
console.log(`✓ ${cases} pitch cases: all strings / 3 tunings / detuning / strong harmonics / noise / 44.1 & 48 kHz`);
console.log('✓ MIDI octave boundaries, A4 calibration, silence, DC offset, noise rejection and string changes');
