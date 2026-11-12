'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SpatialGrid, removeIndexed, boostCost, foodValue, EXIT_MULTIPLIERS, normalizeExitMultiplier, cashoutTarget, rivalRoster, rivalProfile } = require('../game-core');

test('spatial queries retain every nearby item after moving, deleting and crossing zero', () => {
  const grid = new SpatialGrid(96), items = [];
  let seed = 41;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 3200; i++) {
    const item = { x: random() * 4400 - 2200, y: random() * 4400 - 2200, slot: items.length };
    items.push(item); grid.insert(item);
  }
  for (let iteration = 0; iteration < 120; iteration++) {
    const item = items[Math.floor(random() * items.length)];
    item.x = random() * 4400 - 2200; item.y = random() * 4400 - 2200; grid.move(item);
    if (iteration % 3 === 0) { grid.remove(item); removeIndexed(items, item); }
    const x = random() * 4000 - 2000, y = random() * 4000 - 2000, radius = random() * 220;
    const actual = grid.query(x, y, radius);
    assert.equal(new Set(actual).size, actual.length, 'query cannot duplicate coins');
    const expected = items.filter(p => (p.x - x) ** 2 + (p.y - y) ** 2 <= radius ** 2);
    for (const nearby of expected) assert.ok(actual.includes(nearby), 'nearby coin was lost');
  }
  const atOrigin = { x: -.1, y: -.1 }; grid.insert(atOrigin);
  assert.ok(grid.query(0, 0, 1).includes(atOrigin));
  atOrigin.x = .1; atOrigin.y = .1; grid.move(atOrigin);
  assert.ok(grid.query(0, 0, 1).includes(atOrigin));
  grid.clear(); assert.equal(grid.cells.size, 0);
});

test('constant-time deletion maintains slots and is safe when repeated', () => {
  const items = Array.from({ length: 200 }, (_, slot) => ({ slot }));
  const removed = items[4];
  assert.equal(removeIndexed(items, removed), true);
  assert.equal(removeIndexed(items, removed), false);
  while (items.length) {
    removeIndexed(items, items[Math.floor(items.length / 2)]);
    items.forEach((item, slot) => assert.equal(item.slot, slot));
  }
});

test('boost has a small fixed cost, conserves dropped value and never crosses the floor', () => {
  let value = 100, spent = 0;
  for (let i = 0; i < 6000; i++) {
    const cost = boostCost(value, 100, 1 / 60);
    assert.ok(cost >= 0 && cost <= value);
    value -= cost; spent += cost;
    assert.ok(value >= 25 - 1e-9);
  }
  assert.ok(Math.abs(value - 88) < 1e-8);
  assert.ok(Math.abs(value + spent - 100) < 1e-8);
  assert.equal(boostCost(25, 100, 1), 0);
  assert.equal(boostCost(100, 100, 5), .6);
  assert.equal(boostCost(10000, 100, 5), .6, 'large loot must not multiply the boost charge');
  assert.equal(boostCost(25.1, 100, 1000), 25.1 - 25);
  assert.equal(boostCost(100, 100, -1), 0);
});

test('ordinary food gives a visible early gain, exceeding a short boost charge', () => {
  const stake = 100, gains = [0, .25, .5, .75, 1].map(r => foodValue(stake, () => r));
  assert.ok(gains.every(value => value >= .3 && value <= .7 + 1e-12));
  const twentyCoins = 20 * foodValue(stake, () => .5);
  assert.equal(twentyCoins, 10);
  assert.ok(twentyCoins > boostCost(stake, stake, 5) * 10);
});

test('exit multiplier is selectable, validated and applied to the round target', () => {
  assert.deepEqual(EXIT_MULTIPLIERS, [10, 20, 37.5, 60, 100]);
  assert.equal(normalizeExitMultiplier('60'), 60);
  assert.equal(normalizeExitMultiplier('37,5'), 37.5, 'Russian decimal comma is accepted');
  assert.equal(normalizeExitMultiplier('999'), 37.5);
  assert.equal(cashoutTarget(10, 100), 1000);
  assert.equal(cashoutTarget(10, 60), 600);
  assert.equal(cashoutTarget(.01, 37.5), .375);
});

test('rival slots keep three weak, four medium and two fat worms', () => {
  for (const r of [0, .3, .75, .999]) {
    const roster = rivalRoster(() => r);
    assert.equal(roster.length, 9);
    assert.equal(roster.filter(t => t === 'small').length, 3);
    assert.equal(roster.filter(t => ['peer', 'large'].includes(t)).length, 4);
    assert.equal(roster.filter(t => ['giant', 'titan'].includes(t)).length, 2);
  }
});

test('rivals have moderate sizes and always spawn below the selected exit goal', () => {
  const tiers = ['small', 'peer', 'large', 'giant', 'titan'];
  for (const stake of [.01, 500, 1e9]) for (const x of EXIT_MULTIPLIERS) for (const tier of tiers) {
    for (const r of [0, .5, .999]) {
      const profile = rivalProfile(stake, tier, x, () => r);
      assert.ok(profile.value > 0 && profile.value <= cashoutTarget(stake, x) * .9);
      assert.ok(profile.radius >= 17 && profile.radius <= 42);
      assert.equal(profile.tier, tier);
    }
  }
  assert.equal(rivalProfile(500, 'small', 20, () => 0).value, 175);
  assert.equal(rivalProfile(500, 'titan', 20, () => .5).value, 6000);
  assert.equal(rivalProfile(500, 'titan', 20, () => 1).value, 8000);
  assert.equal(rivalProfile(500, 'titan', 10, () => 1).value, 4500);
});
