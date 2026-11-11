(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SnakeCollision = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function pointSegmentDistance2(x, y, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    const t = length > 1e-12 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
    return (x - ax - dx * t) ** 2 + (y - ay - dy * t) ** 2;
  }
  function segmentDistance2(ax, ay, bx, by, cx, cy, dx, dy) {
    const ux = bx - ax, uy = by - ay, vx = dx - cx, vy = dy - cy;
    const cross = ux * vy - uy * vx;
    if (Math.abs(cross) > 1e-12) {
      const wx = cx - ax, wy = cy - ay;
      const t = (wx * vy - wy * vx) / cross, u = (wx * uy - wy * ux) / cross;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
    }
    return Math.min(pointSegmentDistance2(ax, ay, cx, cy, dx, dy), pointSegmentDistance2(bx, by, cx, cy, dx, dy),
      pointSegmentDistance2(cx, cy, ax, ay, bx, by), pointSegmentDistance2(dx, dy, ax, ay, bx, by));
  }
  class World {
    constructor(size = 80) { this.size = size; this.cells = new Map(); this.segments = []; this.used = 0; this.stamp = 0; }
    key(x, y) { return (x + 32768) * 65536 + y + 32768; }
    clear() { this.cells.clear(); this.used = 0; }
    insert(snake, ax, ay, bx, by) {
      const r = snake.radius;
      let segment = this.segments[this.used];
      if (!segment) this.segments[this.used] = segment = {};
      this.used++;
      segment.snake = snake; segment.ax = ax; segment.ay = ay; segment.bx = bx; segment.by = by;
      segment.r = r; segment.stamp = 0;
      const minX = Math.floor((Math.min(ax, bx) - r) / this.size), maxX = Math.floor((Math.max(ax, bx) + r) / this.size);
      const minY = Math.floor((Math.min(ay, by) - r) / this.size), maxY = Math.floor((Math.max(ay, by) + r) / this.size);
      for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
        const key = this.key(x, y); let cell = this.cells.get(key);
        if (!cell) this.cells.set(key, cell = []);
        cell.push(segment);
      }
    }
    rebuild(snakes) {
      for (const cell of this.cells.values()) cell.length = 0;
      this.used = 0;
      for (const s of snakes) {
        if (!s.alive || !s.points.length) continue;
        const first = s.points[0];
        if (s.x !== first.x || s.y !== first.y) this.insert(s, s.x, s.y, first.x, first.y);
        // Every segment is a continuous capsule, including the head, neck and tail.
        for (let i = 0; i < s.points.length - 1; i++) {
          const a = s.points[i], b = s.points[i + 1]; this.insert(s, a.x, a.y, b.x, b.y);
        }
        if (s.points.length === 1) this.insert(s, s.x, s.y, s.x, s.y);
      }
    }
    hitSegment(ax, ay, bx, by, radius, ignore) {
      const stamp = ++this.stamp;
      const minX = Math.floor((Math.min(ax, bx) - radius) / this.size), maxX = Math.floor((Math.max(ax, bx) + radius) / this.size);
      const minY = Math.floor((Math.min(ay, by) - radius) / this.size), maxY = Math.floor((Math.max(ay, by) + radius) / this.size);
      for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
        const cell = this.cells.get(this.key(x, y)); if (!cell) continue;
        for (const p of cell) {
          if (p.stamp === stamp || p.snake === ignore) continue;
          p.stamp = stamp;
          if (segmentDistance2(ax, ay, bx, by, p.ax, p.ay, p.bx, p.by) <= (radius + p.r) ** 2) return p.snake;
        }
      }
      return null;
    }
    headDeaths(snakes) {
      this.rebuild(snakes);
      const deaths = new Map();
      for (let i = 0; i < snakes.length; i++) {
        const a = snakes[i]; if (!a.alive) continue;
        const ax = a.collisionX ?? a.x, ay = a.collisionY ?? a.y;
        for (let j = i + 1; j < snakes.length; j++) {
          const b = snakes[j]; if (!b.alive) continue;
          // Relative head motion catches heads swapping sides within one step.
          if (pointSegmentDistance2(0, 0, ax - (b.collisionX ?? b.x), ay - (b.collisionY ?? b.y), a.x - b.x, a.y - b.y) <= (a.radius + b.radius) ** 2) {
            deaths.set(a, b); deaths.set(b, a);
          }
        }
        const hit = this.hitSegment(ax, ay, a.x, a.y, a.radius, a);
        if (hit && !deaths.has(a)) deaths.set(a, hit);
      }
      return deaths;
    }
  }
  return { World, pointSegmentDistance2, segmentDistance2 };
});
