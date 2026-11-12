(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArenaCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class SpatialGrid {
    constructor(size = 96) {
      this.size = size;
      this.cells = new Map();
    }
    key(x, y) {
      return (x + 32768) * 65536 + y + 32768;
    }
    insert(item) {
      const key = this.key(Math.floor(item.x / this.size), Math.floor(item.y / this.size));
      let cell = this.cells.get(key);
      if (!cell) this.cells.set(key, cell = new Set());
      cell.add(item);
      item.gridKey = key;
    }
    remove(item) {
      const cell = this.cells.get(item.gridKey);
      if (cell) {
        cell.delete(item);
        if (!cell.size) this.cells.delete(item.gridKey);
      }
      item.gridKey = undefined;
    }
    move(item) {
      const key = this.key(Math.floor(item.x / this.size), Math.floor(item.y / this.size));
      if (key !== item.gridKey) {
        this.remove(item);
        this.insert(item);
      }
    }
    query(x, y, radius, out = []) {
      out.length = 0;
      const x0 = Math.floor((x - radius) / this.size), x1 = Math.floor((x + radius) / this.size);
      const y0 = Math.floor((y - radius) / this.size), y1 = Math.floor((y + radius) / this.size);
      for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
        const cell = this.cells.get(this.key(cx, cy));
        if (cell) for (const item of cell) out.push(item);
      }
      return out;
    }
    clear() { this.cells.clear(); }
  }

  function removeIndexed(items, item) {
    const index = item.slot;
    if (index < 0 || index >= items.length || items[index] !== item) return false;
    const last = items.pop();
    if (last !== item) {
      items[index] = last;
      last.slot = index;
    }
    item.slot = -1;
    return true;
  }

  function boostCost(value, stake, dt) {
    // A small, fixed share of the entry amount, even after collecting large loot.
    return Math.max(0, Math.min(value - stake * .25, stake * .0012 * dt));
  }

  function foodValue(stake, random = Math.random) {
    return stake * (.003 + random() * .004);
  }

  const EXIT_MULTIPLIERS = Object.freeze([10, 20, 37.5, 60, 100]);
  const DEFAULT_EXIT_MULTIPLIER = 37.5;
  function normalizeExitMultiplier(value) {
    const n = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
    return EXIT_MULTIPLIERS.includes(n) ? n : DEFAULT_EXIT_MULTIPLIER;
  }
  function cashoutTarget(stake, multiplier) {
    const n = Number(stake);
    return Number.isFinite(n) && n >= 0 ? n * normalizeExitMultiplier(multiplier) : 0;
  }

  // Keep every round mixed: weak, medium and fat rivals all have a slot.
  function rivalRoster(random = Math.random) {
    const tiers = ['small', 'small', 'small', 'peer', 'peer', 'large', 'large', 'giant', 'titan'];
    for (let i = tiers.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
    }
    return tiers;
  }
  function rivalProfile(stake, tier, exitMultiplier = DEFAULT_EXIT_MULTIPLIER, random = Math.random) {
    const profiles = {
      small: { value: [.35, .8], radius: [17, 21], length: [100, 170] },
      peer: { value: [.8, 1.8], radius: [22, 26], length: [180, 260] },
      large: { value: [1.8, 4], radius: [27, 33], length: [260, 360] },
      giant: { value: [4, 8], radius: [34, 38], length: [350, 440] },
      titan: { value: [8, 16], radius: [39, 42], length: [430, 520] }
    };
    if (!profiles[tier]) tier = 'peer';
    const p = profiles[tier], range = values => values[0] + random() * (values[1] - values[0]);
    return {
      tier,
      value: Math.min(cashoutTarget(stake, exitMultiplier) * .9, Math.max(.01, Math.round(stake * range(p.value) * 100) / 100)),
      len: Math.floor(range(p.length)),
      radius: range(p.radius)
    };
  }

  return {
    SpatialGrid,
    removeIndexed,
    boostCost,
    foodValue,
    EXIT_MULTIPLIERS,
    DEFAULT_EXIT_MULTIPLIER,
    normalizeExitMultiplier,
    cashoutTarget,
    rivalRoster,
    rivalProfile
  };
});
