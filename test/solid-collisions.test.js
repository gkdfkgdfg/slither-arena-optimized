'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { World, segmentDistance2 } = require('../snake-collision');
const snake = (points, radius = 5, extra = {}) => ({ alive: true, x: points[0].x, y: points[0].y, radius, points, ...extra });

test('head hits continuous body, neck, exact outer surface and rounded tail', () => {
  const world = new World(80), wall = snake([{ x: -200, y: 0 }, { x: 200, y: 0 }], 20);
  world.rebuild([wall]);
  assert.equal(world.hitSegment(0, 25, 0, 25, 5), wall);
  assert.equal(world.hitSegment(0, 25.01, 0, 25.01, 5), null);
  assert.equal(world.hitSegment(-199, 20, -199, 20, 5), wall);
  assert.equal(world.hitSegment(223, 0, 223, 0, 5), wall);
  assert.equal(world.hitSegment(226, 0, 226, 0, 5), null);
});

test('swept head cannot tunnel through a body even when endpoints miss', () => {
  const world = new World(), wall = snake([{ x: -200, y: 0 }, { x: 200, y: 0 }]);
  const moving = snake([{ x: 0, y: 90 }, { x: 0, y: 100 }], 5, { collisionX: 0, collisionY: -90 });
  const deaths = world.headDeaths([moving, wall]);
  assert.equal(deaths.get(moving), wall); assert.equal(deaths.has(wall), false);
});

test('spawning grace cannot disable solid-body collisions; self tail remains safe', () => {
  const world = new World(), wall = snake([{ x: -100, y: 0 }, { x: 100, y: 0 }], 15, { grace: 1000 });
  const moving = snake([{ x: 0, y: 20 }, { x: 0, y: 40 }], 10, { grace: 1000 });
  assert.equal(world.headDeaths([moving, wall]).get(moving), wall);
  assert.equal(world.headDeaths([snake([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 0 }])]).size, 0);
});

test('opposing moving heads both die when they exchange sides in a step', () => {
  const world = new World();
  const a = snake([{ x: 80, y: 0 }], 5, { collisionX: -80, collisionY: 0 });
  const b = snake([{ x: -80, y: 0 }], 5, { collisionX: 80, collisionY: 0 });
  const deaths = world.headDeaths([a, b]);
  assert.equal(deaths.get(a), b); assert.equal(deaths.get(b), a);
});

test('capsule grid matches a complete scan across random radii, long segments and cell boundaries', () => {
  let seed = 8513;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const objects = Array.from({ length: 16 }, () => snake(Array.from({ length: 12 }, () => ({ x: random() * 1600 - 800, y: random() * 1600 - 800 })), 1 + random() * 100));
  const world = new World(); world.rebuild(objects);
  for (let i = 0; i < 1500; i++) {
    const ax = random() * 2400 - 1200, ay = random() * 2400 - 1200, bx = ax + random() * 200 - 100, by = ay + random() * 200 - 100, r = random() * 110;
    const expected = objects.some(s => s.points.slice(1).some((p, j) => segmentDistance2(ax, ay, bx, by, s.points[j].x, s.points[j].y, p.x, p.y) <= (r + s.radius) ** 2));
    assert.equal(Boolean(world.hitSegment(ax, ay, bx, by, r)), expected);
  }
});

test('actual spawn code rejects a clear head whose long tail crosses another snake', () => {
  const source = fs.readFileSync(path.join(__dirname, '../mystake.js'), 'utf8');
  const code = source.slice(source.indexOf('function commitSpawn('), source.indexOf('function maintainCrowd('));
  const collisionWorld = new World();
  collisionWorld.rebuild([snake([{ x: 0, y: -150 }, { x: 0, y: 150 }], 15)]);
  const context = { collisionWorld, mode: 'menu', elapsed: 0, R: 2200, PHYS: { pitch: 2 }, bodyPoints: () => 301, rand: () => 5, player: { x: 0, y: 0 } };
  vm.createContext(context); vm.runInContext(code + ';globalThis.attempt=trySpawn;', context);
  assert.equal(context.attempt({ radius: 15 }, 300, 0, 0), false);
  const s = { radius: 15 };
  assert.equal(context.attempt(s, 300, 300, 0), true);
  assert.equal(s.grace, 0); assert.equal(s.points.length, 301);
});

test('initial rival tails leave a clear opening ahead of the player without collision immunity', () => {
  const source = fs.readFileSync(path.join(__dirname, '../mystake.js'), 'utf8');
  const code = source.slice(source.indexOf('function commitSpawn('), source.indexOf('function maintainCrowd('));
  const context = { collisionWorld: new World(), SnakeCollision: { segmentDistance2 }, mode: 'play', elapsed: 0,
    R: 2200, PHYS: { pitch: 2 }, bodyPoints: () => 301, rand: () => 5, player: { x: 0, y: 0, radius: 15 } };
  vm.createContext(context); vm.runInContext(code + ';globalThis.attempt=trySpawn;', context);
  assert.equal(context.attempt({ radius: 50 }, 550, 100, 0), false, 'long thick tail would block the opening');
  const rival = { radius: 50 };
  assert.equal(context.attempt(rival, 550, 450, 0), true);
  assert.equal(rival.grace, 0, 'safe placement must not make rivals intangible');
});

test('a rival cashout releases pulled coins without dying, dropping loot or crediting the player', () => {
  const source = fs.readFileSync(path.join(__dirname, '../mystake.js'), 'utf8');
  const code = source.slice(source.indexOf('function cashoutRival('), source.indexOf('function dropBoostPellet('));
  const player = { alive: true, value: 500 }, coin = { pull: null };
  const rival = { alive: true, value: 10000, pulledCoins: new Set([coin]) }; coin.pull = rival;
  let released = 0;
  const context = { player, rand: () => 3, releaseCoins(s) { released++; for (const c of s.pulledCoins) c.pull = null; s.pulledCoins.clear(); } };
  vm.createContext(context); vm.runInContext(code + ';globalThis.bank=cashoutRival;', context);
  assert.equal(context.bank(rival), true);
  assert.equal(rival.alive, false); assert.equal(rival.cashedOut, true); assert.equal(rival.respawn, 3);
  assert.equal(player.value, 500); assert.equal(coin.pull, null); assert.equal(released, 1);
  assert.equal(context.bank(rival), false, 'bank once only');
  assert.equal(context.bank(player), false, 'NPC cashout must never remove the player');
});
