'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const BotAI = require('../bot-ai');
const FX = require('../arena-effects');
const { World } = require('../snake-collision');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('personalities choose distinct goals and react to a moving player without instant turns', () => {
  const player = { alive: true, x: 400, y: 0, a: Math.PI / 2, velocity: 370, radius: 30, points: [] };
  const intents = [];
  for (const personality of ['forager', 'hunter', 'ambusher', 'shy', 'wanderer', 'scavenger']) {
    const s = { alive: true, x: 0, y: 0, a: 0, radius: 15, velocity: 245, points: [], tacticsEnabled: true,
      routeAngle: 0, routeTimer: 10, weavePhase: 0, brain: BotAI.createBrain('smart', () => .5) };
    Object.assign(s.brain, { personality, intentLeft: 0, burstCooldown: 0 });
    const angle = BotAI.heading(s, .12, { snakes: [s], player, coins: [{ x: 220, y: 100 }], radius: 2200, playing: true, random: () => .5 });
    assert.ok(Number.isFinite(angle));
    assert.equal(s.a, 0, 'AI supplies a goal; physics controls actual turning');
    intents.push(s.brain.intent);
    if (personality === 'hunter' || personality === 'ambusher') assert.ok(s.brain.burstLeft > 0);
    if (personality === 'shy') assert.ok(Math.abs(angle) > 2, 'a pressured shy bot retreats');
  }
  assert.deepEqual(intents, ['forage', 'flank', 'intercept', 'retreat', 'roam', 'forage']);
});

test('new tactics preserve traffic avoidance with real acceleration and turn limits', () => {
  const physics = { player: null };
  vm.createContext(physics); vm.runInContext(read('mystake-physics.js') + ';this.advance=physStepHead;', physics);
  for (const kind of ['rookie', 'regular', 'smart']) for (const crossing of [false, true]) {
    const make = (id, x, y, a) => ({ id, alive: true, x, y, a, radius: 20, velocity: 245, tacticsEnabled: true,
      brain: BotAI.createBrain(kind, () => .5), routeAngle: a, routeTimer: 10, weavePhase: 0,
      points: Array.from({ length: 120 }, (_, i) => ({ x: x - Math.cos(a) * i * 2, y: y - Math.sin(a) * i * 2 })) });
    const bots = [make(1, -400, 0, 0), make(2, crossing ? 0 : 400, crossing ? -400 : 0, crossing ? Math.PI / 2 : Math.PI)];
    const collisions = new World();
    for (let frame = 0; frame < 1200; frame++) {
      for (const s of bots) {
        const dt = 1 / 120;
        s.think = (s.think || 0) - dt; s.sinceThink = (s.sinceThink || 0) + dt;
        if (s.think <= 0) {
          s.goal = BotAI.heading(s, s.sinceThink, { snakes: bots, player: null, coins: [], playing: true, radius: 2200, random: () => .5 });
          s.sinceThink = 0; s.think = s.brain.reaction;
        }
        s.collisionX = s.x; s.collisionY = s.y;
        physics.advance(s, s.goal, s.brain.boosting, dt);
        s.points.unshift({ x: s.x, y: s.y }); s.points.length = 120;
      }
      assert.equal(collisions.headDeaths(bots).size, 0, kind + (crossing ? ' crossing' : ' head-on') + ' frame ' + frame);
    }
  }
});

test('effects remain bounded during dense loot and expire between highlights', () => {
  const effects = FX.create(), player = { alive: true };
  for (let i = 0; i < 500; i++) { effects.kill(i, 0, 100, 10); effects.pickup(i, 0, 10, 10); effects.update(.01, player, true); }
  assert.ok(effects.diagnostics().rings <= 14); assert.ok(effects.diagnostics().labels <= 8);
  effects.progress(20, true); effects.progress(30, true);
  assert.equal(effects.diagnostics().unlocked, true);
  for (let i = 0; i < 300; i++) effects.update(.01, player, false);
  assert.equal(effects.diagnostics().rings, 0); assert.equal(effects.diagnostics().labels, 0);
  effects.reset(); assert.equal(effects.diagnostics().combo, 0); assert.equal(effects.diagnostics().unlocked, false);
});

function startFixture(prepare) {
  const nodes = new Map();
  const $ = id => { if (!nodes.has(id)) nodes.set(id, { value: id === 'stake' ? '10' : '', textContent: '', close() {} }); return nodes.get(id); };
  const state = { $, prefs: { balance: 100, difficulty: 'easy', exitX: 20 }, BotAI, ArenaCore: require('../game-core'),
    touchPoints: new Map(), viewZoom: () => .5, performance: { now: () => 100 }, bodyPoints: () => 10,
    PHYS: { pitch: 2 }, prepareSnakeAppearances: prepare, canvasOnly: true, save() {}, tone() {}, renderHUD() {},
    arenaFX: FX.create(), mode: 'menu', starting: false, player: null, snakes: [],
    seed() { state.player = { a: 0 }; state.snakes = [state.player]; } };
  vm.createContext(state);
  const source = read('mystake.js');
  vm.runInContext(source.slice(source.indexOf('async function start()'), source.indexOf('function home()')), state);
  return { state, $ };
}

test('round waits for decoded skins, blocks duplicate starts and debits only once after success', async () => {
  let resolve;
  const ready = new Promise(r => resolve = r), { state, $ } = startFixture(() => ready);
  const start = state.start();
  assert.equal(state.mode, 'loading'); assert.equal(state.prefs.balance, 100);
  assert.equal($('play').disabled, true); assert.equal($('lobby').inert, true);
  assert.equal(await state.start(), false);
  resolve(); assert.equal(await start, true);
  assert.equal(state.mode, 'play'); assert.equal(state.prefs.balance, 90);
  assert.equal($('play').disabled, false); assert.equal($('lobby').inert, false);
});

test('failed skin loading keeps the balance and restores a usable retry button', async () => {
  const { state, $ } = startFixture(async () => { throw Error('Connection failed'); });
  assert.equal(await state.start(), false);
  assert.equal(state.mode, 'menu'); assert.equal(state.prefs.balance, 100);
  assert.equal($('play').disabled, false); assert.equal($('lobby').inert, false);
  assert.equal($('error').textContent, 'Connection failed');
});

test('appearance readiness waits for both real body and decorative-head decode paths', async () => {
  const images = [], decodes = [];
  const context = { URLSearchParams, location: { search: '' }, performance, setTimeout,
    Image: class { constructor() { images.push(this); } },
    createImageBitmap: image => new Promise(resolve => decodes.push(() => resolve(image))),
    document: { querySelectorAll: () => [], createElement: () => ({ getContext: () => ({
      createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}
    }) }) } };
  vm.createContext(context); vm.runInContext(read('mystake-art.js'), context);
  const snake = { skin: 'la_maya', color: '#a39a85' };
  assert.equal(context.snakeAppearanceState(snake), 'loading'); assert.equal(images.length, 2);
  for (const image of images) image.onload();
  assert.equal(context.snakeAppearanceState(snake), 'loading', 'downloaded is not yet decoded');
  decodes[0](); await Promise.resolve();
  assert.equal(context.snakeAppearanceState(snake), 'loading', 'head still pending');
  decodes[1](); await Promise.resolve();
  assert.equal(context.snakeAppearanceState(snake), 'ready');
  await context.prepareSnakeAppearances([snake]);
});
