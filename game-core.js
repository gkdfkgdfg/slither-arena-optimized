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
    return Math.max(0, Math.min(value - stake * .25, Math.max(stake * .03, value * .025) * dt));
  }

  return { SpatialGrid, removeIndexed, boostCost };
});
