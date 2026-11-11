'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Builder } = require('../ribbon-mesh');

test('continuous ribbon shares exact geometry and UVs across every segment', () => {
  const builder = new Builder();
  const raw = Array.from({ length: 1200 }, (_, i) => ({ x: 1500 - i * 1.86, y: Math.sin(i / 70) * 90 }));
  for (const radius of [10, 16, 32, 65, 100]) {
    const mesh = builder.build(raw, radius);
    assert.ok(mesh.length > 0);
    assert.ok(mesh.every(Number.isFinite));
    const capFloats = 16 * 3 * 4;
    const strips = mesh.subarray(capFloats, mesh.length - capFloats);
    assert.equal(strips.length % 24, 0);
    for (let offset = 0; offset + 48 <= strips.length; offset += 24) {
      // Current head edge is exactly the next strip's tail edge, not a stamped approximation.
      assert.deepEqual(strips.slice(offset + 8, offset + 12), strips.slice(offset + 24, offset + 28));
      assert.deepEqual(strips.slice(offset + 16, offset + 20), strips.slice(offset + 28, offset + 32));
    }
    for (let offset = 0; offset < mesh.length; offset += 4) {
      assert.ok(mesh[offset + 3] >= -1e-6 && mesh[offset + 3] <= 1 + 1e-6);
    }
  }
});

test('arc-length sampling is independent of physics point count', () => {
  const builder = new Builder();
  const a = Array.from({ length: 101 }, (_, i) => ({ x: i, y: 0 }));
  const b = Array.from({ length: 201 }, (_, i) => ({ x: i / 2, y: 0 }));
  assert.deepEqual(Array.from(builder.build(a, 16)), Array.from(builder.build(b, 16)));
  assert.equal(builder.build([{ x: 0, y: 0 }, { x: 0, y: 0 }], 16).length, 0);
});

test('sharp turns, tiny tails and coiled bodies stay finite', () => {
  const builder = new Builder();
  for (const radius of [1, 16, 100]) for (const raw of [
    [{ x: 0, y: 0 }, { x: .01, y: 0 }],
    [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 0 }, { x: -100, y: 0 }],
    Array.from({ length: 1800 }, (_, i) => ({ x: Math.cos(i * .02) * 140, y: Math.sin(i * .02) * 140 }))
  ]) assert.ok(builder.build(raw, radius).every(Number.isFinite));
});

test('actual animation loop advances on every 60/90/120/144 Hz frame without alternating interpolation', () => {
  const source = fs.readFileSync(path.join(__dirname, '../mystake.js'), 'utf8');
  const functionSource = source.slice(source.indexOf('function frame(t)'), source.indexOf("document.addEventListener('visibilitychange'"));
  for (const hz of [60, 90, 120, 144]) {
    const updates = [], renders = [];
    const context = { last: 1000, STEP: 1 / 60, document: { hidden: false }, mode: 'play', paused: false,
      debugFrames: 0, debugTime: 0, frameFPS: 0, qualityMode: 'balanced', diagnostics: {}, coinChecks: 0,
      lastCoinChecks: 0, lastPaint: 0, stillMotion: true, performance: { now: () => 0 },
      requestAnimationFrame() {}, update: dt => updates.push(dt), render: () => renders.push(updates.reduce((a, b) => a + b, 0)) };
    vm.createContext(context); vm.runInContext(functionSource + ';globalThis.tick=frame;', context);
    for (let i = 1; i <= hz * 2; i++) context.tick(1000 + i * 1000 / hz);
    assert.equal(renders.length, hz * 2);
    assert.ok(Math.abs(renders.at(-1) - 2) < 1e-9);
    for (let i = 1; i < renders.length; i++) assert.ok(Math.abs(renders[i] - renders[i - 1] - 1 / hz) < 1e-9);
    assert.ok(updates.every(dt => dt > 0 && dt <= 1 / 60));
  }
});
