'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const BotAI = require('../bot-ai');
const { World } = require('../snake-collision');
const seeded = value => () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
const bot = (kind, random = () => .5) => ({ id: 1, alive: true, x: 0, y: 0, a: 0, radius: 15,
  points: [{ x: 0, y: 0 }, { x: -80, y: 0 }], velocity: 245, brain: BotAI.createBrain(kind, random),
  behavior: 'cruiser', routeAngle: 0, routeTimer: 100, weavePhase: 0, coilCooldown: 0 });
const wall = (x, y = 0) => ({ id: 2, alive: true, x, y: y - 350, a: Math.PI / 2, radius: 15,
  points: [{ x, y: y - 350 }, { x, y: y + 350 }] });
const worldFor = (s, others = [], random = () => .5) => ({ snakes: [s, ...others], player: others[0] || null, coins: [], radius: 2200, playing: true, boost: false, random });

test('both difficulty modes always contain smart and careless bots, with the intended balance', () => {
  for (let seed = 1; seed <= 50; seed++) for (const level of ['easy', 'hard']) {
    const roster = BotAI.roster(level, seeded(seed));
    const counts = roster.reduce((o, id) => (o[id] = (o[id] || 0) + 1, o), {});
    assert.equal(roster.length, 9);
    assert.deepEqual(counts, level === 'easy' ? { rookie: 6, regular: 2, smart: 1 } : { rookie: 2, regular: 2, smart: 5 });
  }
  assert.equal(BotAI.normalize('hard'), 'hard');
  for (const value of [undefined, null, 'invalid', 'easy']) assert.equal(BotAI.normalize(value), 'easy');
});

test('bots keep their route when another body is beside or behind them', () => {
  for (const kind of ['rookie', 'regular', 'smart']) {
    const s = bot(kind);
    const side = { ...wall(0), points: [{ x: -250, y: 120 }, { x: 350, y: 120 }] };
    assert.equal(BotAI.heading(s, .1, worldFor(s, [side, wall(-120)])), 0);
    assert.equal(s.brain.avoiding, false);
  }
});

test('smart bots see a cut-off earlier while rookies commit to their route', () => {
  const rookie = bot('rookie'), smart = bot('smart'), obstacle = wall(210);
  assert.equal(BotAI.heading(rookie, .1, worldFor(rookie, [obstacle])), 0);
  assert.ok(Math.abs(BotAI.heading(smart, .1, worldFor(smart, [obstacle]))) > .2);
  assert.ok(rookie.brain.reaction > smart.brain.reaction * 3);
});

test('attention lapses allow mistakes, but never suppress boundary avoidance', () => {
  const s = bot('rookie'), obstacle = wall(60);
  s.brain.lapseLeft = .8;
  assert.equal(BotAI.heading(s, .1, worldFor(s, [obstacle])), 0);
  assert.equal(s.brain.avoiding, false);
  s.x = 2100;
  assert.equal(Math.abs(BotAI.heading(s, .1, worldFor(s, [obstacle]))), Math.PI);
});

test('even distracted rookies avoid ordinary bot traffic early', () => {
  const s = bot('rookie'), obstacle = wall(340), world = worldFor(s, [obstacle]);
  world.player = null;
  s.brain.lapseLeft = .8;
  assert.ok(Math.abs(BotAI.heading(s, .1, world)) > .1);
  assert.equal(s.brain.avoiding, true);
  const detour = s.routeAngle;
  assert.equal(BotAI.heading(s, .1, worldFor(s)), detour, 'hold a detour instead of turning back into traffic');
});

test('moving bots avoid head-on and crossing traffic with real turn limits', () => {
  const context = { player: null };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../mystake-physics.js'), 'utf8') + ';globalThis.advance=physStepHead;', context);
  for (const kind of ['rookie', 'regular', 'smart']) for (const crossing of [false, true]) {
    const a = bot(kind), b = bot(kind), collisions = new World();
    a.x = -400; b.x = crossing ? 0 : 400; b.y = crossing ? -400 : 0; b.a = crossing ? Math.PI / 2 : Math.PI; b.id = 2; b.routeAngle = b.a;
    for (const s of [a, b]) s.points = Array.from({ length: 100 }, (_, i) => ({ x: s.x - Math.cos(s.a) * i * 2, y: s.y - Math.sin(s.a) * i * 2 }));
    for (let frame = 0; frame < 480; frame++) {
      for (const s of [a, b]) {
        const dt = 1 / 120;
        s.think = (s.think || 0) - dt; s.sinceThink = (s.sinceThink || 0) + dt;
        if (s.think <= 0) {
          s.targetAngle = BotAI.heading(s, s.sinceThink, { ...worldFor(s), snakes: [a, b], player: null });
          s.sinceThink = 0; s.think = s.brain.reaction;
        }
        s.collisionX = s.x; s.collisionY = s.y; context.advance(s, s.targetAngle, false, dt);
        s.points.unshift({ x: s.x, y: s.y }); s.points.length = 100;
      }
      assert.equal(collisions.headDeaths([a, b]).size, 0, kind + (crossing ? ' crossing' : ' head-on'));
    }
  }
});

test('a real cut-off kills rookies while smart bots escape using the same head physics and solid collisions', t => {
  const context = { player: null };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../mystake-physics.js'), 'utf8') + ';globalThis.advance=physStepHead;', context);
  const results = { rookie: 0, smart: 0 };
  for (const kind of Object.keys(results)) for (let seed = 1; seed <= 20; seed++) {
    const random = seeded(seed * 982451653), s = bot(kind, random), obstacle = wall(135), world = worldFor(s, [obstacle], random), collisions = new World();
    let think = 0, sinceThink = 0, angle = 0;
    for (let frame = 0; frame < 240; frame++) {
      const dt = 1 / 120; think -= dt; sinceThink += dt;
      if (think <= 0) { angle = BotAI.heading(s, sinceThink, world); sinceThink = 0; think = s.brain.reaction; }
      s.collisionX = s.x; s.collisionY = s.y; context.advance(s, angle, false, dt);
      s.points[0] = { x: s.x, y: s.y }; s.points[1] = { x: s.x - Math.cos(s.a) * 10, y: s.y - Math.sin(s.a) * 10 };
      if (collisions.headDeaths([s, obstacle]).has(s)) { results[kind]++; break; }
    }
  }
  assert.ok(results.rookie >= 18, JSON.stringify(results));
  assert.ok(results.smart <= 2, JSON.stringify(results));
  t.diagnostic('Deaths in 20 identical cut-offs per kind: ' + JSON.stringify(results));
});
