(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RibbonMesh = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Equal arc-length samples avoid vertices jumping between discrete physics points.
  // Every joint shares the same two vertices and UVs; there are no rounded texture stamps.
  class Builder {
    constructor() {
      this.points = [];
      this.vertices = new Float32Array(8192);
      this.count = 0;
    }
    point(index, x, y, distance) {
      const p = this.points[index] || (this.points[index] = {});
      p.x = x; p.y = y; p.distance = distance;
    }
    vertex(x, y, u, v) {
      if (this.count + 4 > this.vertices.length) {
        const next = new Float32Array(this.vertices.length * 2);
        next.set(this.vertices); this.vertices = next;
      }
      this.vertices[this.count++] = x; this.vertices[this.count++] = y;
      this.vertices[this.count++] = u; this.vertices[this.count++] = v;
    }
    build(raw, radius) {
      this.count = 0;
      if (raw.length < 2 || !Number.isFinite(radius) || radius <= 0) return this.vertices.subarray(0, 0);
      const pitch = Math.max(3, Math.min(10, radius * .2));
      let used = 1, distance = 0, next = pitch;
      this.point(0, raw[0].x, raw[0].y, 0);
      for (let i = 1; i < raw.length; i++) {
        const a = raw[i - 1], b = raw[i], length = Math.hypot(b.x - a.x, b.y - a.y);
        if (length < 1e-8) continue;
        while (next <= distance + length) {
          const t = (next - distance) / length;
          this.point(used++, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, next);
          next += pitch;
        }
        distance += length;
      }
      const tail = raw[raw.length - 1], last = this.points[used - 1];
      if (distance - last.distance > 1e-5) this.point(used++, tail.x, tail.y, distance);
      if (used < 2) return this.vertices.subarray(0, 0);
      const points = this.points, uScale = 1 / (12 * radius), u0 = 1 / 12;
      for (let i = 0; i < used; i++) {
        const p = points[i], a = points[Math.max(0, i - 1)], b = points[Math.min(used - 1, i + 1)];
        let ax = p.x - a.x, ay = p.y - a.y, bx = b.x - p.x, by = b.y - p.y;
        let ad = Math.hypot(ax, ay), bd = Math.hypot(bx, by);
        if (ad < 1e-8) { ax = bx; ay = by; ad = bd; }
        if (bd < 1e-8) { bx = ax; by = ay; bd = ad; }
        ax /= ad || 1; ay /= ad || 1; bx /= bd || 1; by /= bd || 1;
        let nx = -ay - by, ny = ax + bx, nd = Math.hypot(nx, ny);
        if (nd < 1e-5) { nx = -by; ny = bx; nd = 1; }
        nx /= nd; ny /= nd;
        const miter = Math.min(radius * 1.4, radius / Math.max(.1, nx * -by + ny * bx));
        p.lx = p.x - nx * miter; p.ly = p.y - ny * miter;
        p.rx = p.x + nx * miter; p.ry = p.y + ny * miter;
        p.u = u0 + p.distance * uScale;
      }
      // Paint tail to head, including both end caps, so self crossings stay consistent.
      this.cap(points[used - 1], points[used - 2], radius, true, uScale);
      for (let i = used - 1; i > 0; i--) {
        const p = points[i - 1], q = points[i];
        this.vertex(q.lx, q.ly, q.u, 0); this.vertex(q.rx, q.ry, q.u, 1); this.vertex(p.lx, p.ly, p.u, 0);
        this.vertex(q.rx, q.ry, q.u, 1); this.vertex(p.rx, p.ry, p.u, 1); this.vertex(p.lx, p.ly, p.u, 0);
      }
      this.cap(points[0], points[1], radius, false, uScale);
      return this.vertices.subarray(0, this.count);
    }
    cap(p, neighbor, radius, tail, uScale) {
      // Tangent always points from head towards tail. A head cap extends backwards.
      let tx = tail ? p.x - neighbor.x : neighbor.x - p.x;
      let ty = tail ? p.y - neighbor.y : neighbor.y - p.y;
      const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
      const nx = -ty, ny = tx, sign = tail ? 1 : -1, parts = 16;
      for (let j = 0; j < parts; j++) {
        this.vertex(p.x, p.y, p.u, .5);
        for (const i of [j, j + 1]) {
          const angle = -Math.PI / 2 + i * Math.PI / parts;
          const along = sign * Math.cos(angle) * radius, across = Math.sin(angle) * radius;
          this.vertex(p.x + tx * along + nx * across, p.y + ty * along + ny * across,
            p.u + along * uScale, .5 + across / (2 * radius));
        }
      }
    }
  }
  return { Builder };
});
