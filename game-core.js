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

  // One small rival, one medium, three large, two giants and two titans per batch.
  function rivalRoster(random = Math.random) {
    const tiers = ['small', 'peer', 'large', 'large', 'large', 'giant', 'giant', 'titan', 'titan'];
    for (let i = tiers.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
    }
    return tiers;
  }
  function rivalProfile(stake, tier, elapsed = 0, random = Math.random) {
    const ranges = { small: [.8, 1.8], peer: [2, 4], large: [5, 9], giant: [10, 18], titan: [20, 40] };
    const range = ranges[tier] || ranges.peer;
    const multiple = (range[0] + random() * (range[1] - range[0])) * Math.min(12, 1 + Math.max(0, elapsed) / 90);
    const size = Math.log2(Math.max(1, multiple));
    const minRadius = tier === 'titan' ? 50 : tier === 'giant' ? 44 : tier === 'large' ? 36 : 22;
    return {
      value: Math.max(.01, Math.round(stake * multiple * 100) / 100),
      len: Math.floor(Math.min(650, 260 + random() * 170 + 62 * size)),
      radius: Math.min(54, Math.max(minRadius, 22 + random() * 9 + size * 3.3))
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
