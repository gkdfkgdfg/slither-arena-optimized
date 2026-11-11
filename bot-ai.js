(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./snake-collision') : root.SnakeCollision);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BotAI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (geometry) {
  'use strict';
  const profiles = Object.freeze({
    rookie: Object.freeze({ reaction: .5, horizon: .32, margin: 2, speed: .92, turn: .72,
      offsets: [0, .35, -.35, .7, -.7, 1, -1], predict: 0, wobble: .17, focus: [2.5, 5], lapse: [.5, .95] }),
    regular: Object.freeze({ reaction: .26, horizon: .65, margin: 7, speed: 1, turn: .95,
      offsets: [0, .3, -.3, .6, -.6, 1, -1, 1.35, -1.35], predict: 0, wobble: .26, focus: [7, 11], lapse: [.2, .4] }),
    smart: Object.freeze({ reaction: .11, horizon: 1.12, margin: 15, speed: 1.03, turn: 1.1,
      offsets: [0, .28, -.28, .55, -.55, .9, -.9, 1.25, -1.25, 1.7, -1.7, 2.2, -2.2], predict: .25, wobble: .22 })
  });
  const mixes = Object.freeze({
    easy: ['rookie', 'rookie', 'rookie', 'rookie', 'rookie', 'rookie', 'regular', 'regular', 'smart'],
    hard: ['rookie', 'rookie', 'regular', 'regular', 'smart', 'smart', 'smart', 'smart', 'smart']
  });
  const normalize = value => value === 'hard' ? 'hard' : 'easy';
  const range = (random, a, b) => a + random() * (b - a);
  const angleGap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  function roster(level, random = Math.random) {
    const result = mixes[normalize(level)].slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function createBrain(kind = 'regular', random = Math.random) {
    if (!profiles[kind]) kind = 'regular';
    const p = profiles[kind];
    return { kind, reaction: p.reaction * range(random, .9, 1.1),
      speedScale: p.speed * range(random, .97, 1.03), turnScale: p.turn,
      focusLeft: p.focus ? range(random, ...p.focus) : Infinity, lapseLeft: 0, avoiding: false };
  }
  function heading(s, dt, world) {
    const random = world.random || Math.random, limit = world.radius || 2200;
    const brain = s.brain || (s.brain = createBrain('regular', random)), p = profiles[brain.kind];
    s.routeTimer -= dt; s.weavePhase += dt * 1.3;
    s.coilCooldown = Math.max(0, (s.coilCooldown || 0) - dt);
    brain.avoiding = false;
    if (brain.lapseLeft > 0) brain.lapseLeft = Math.max(0, brain.lapseLeft - dt);
    else if (p.focus && (brain.focusLeft -= dt) <= 0) {
      brain.lapseLeft = range(random, ...p.lapse); brain.focusLeft = range(random, ...p.focus);
    }
    // Even distracted bots see the arena boundary; a lapse only weakens traffic awareness.
    if (Math.max(Math.abs(s.x), Math.abs(s.y)) > limit - s.radius - 220) {
      s.coilTime = 0; s.routeAngle = Math.atan2(-s.y, -s.x); s.routeTimer = 3;
      return s.routeAngle;
    }
    if (s.behavior === 'square') {
      s.squareTimer = (s.squareTimer ?? range(random, 1, 2)) - dt;
      if (s.squareTimer <= 0) {
        s.squareTimer = range(random, 1.4, 3); s.routeAngle = s.a + (random() < .5 ? 1 : -1) * Math.PI / 2;
        s.routeTimer = Math.max(s.routeTimer, 3);
      }
    }
    const player = world.player;
    if (brain.kind === 'smart' && s.behavior === 'coiler' && player?.alive && world.playing && world.boost &&
        !s.coilCooldown && !s.coilTime) {
      const dx = player.x - s.x, dy = player.y - s.y;
      const along = dx * Math.cos(s.a) + dy * Math.sin(s.a), side = -dx * Math.sin(s.a) + dy * Math.cos(s.a);
      if (along < 15 && along > -190 && Math.abs(side) < 95 && Math.cos(player.a - s.a) > .5) {
        s.coilTime = 3; s.coilCooldown = 18; s.coilDir = side > 0 ? -1 : 1;
        s.coilCenter = { x: s.x - Math.sin(s.a) * 90 * s.coilDir, y: s.y + Math.cos(s.a) * 90 * s.coilDir };
      }
    }
    if (s.routeTimer <= 0) {
      s.routeTimer = range(random, 3, 6); s.routeAngle = s.a + range(random, -.28, .28);
      let best = 450 ** 2;
      for (let j = 0; j < world.coins.length; j += 5) {
        const c = world.coins[j], dx = c.x - s.x, dy = c.y - s.y, d2 = dx * dx + dy * dy;
        const a = Math.atan2(dy, dx);
        if (d2 < best && angleGap(a, s.a) < .6) { best = d2; s.routeAngle = a; }
      }
    }
    let route = s.routeAngle + (s.behavior === 'zigzag' ? Math.sin(s.weavePhase) * p.wobble * .65 :
      s.behavior === 'wiggle' ? Math.sin(s.weavePhase * 2.4) * p.wobble : 0);
    if (s.coilTime > 0) {
      s.coilTime = Math.max(0, s.coilTime - dt);
      const a = Math.atan2(s.y - s.coilCenter.y, s.x - s.coilCenter.x) + s.coilDir * .65;
      route = Math.atan2(s.coilCenter.y + Math.sin(a) * 90 - s.y, s.coilCenter.x + Math.cos(a) * 90 - s.x);
      if (!s.coilTime) { s.routeAngle = s.a; s.routeTimer = 4; }
    }
    const speed = s.velocity || 245, nearby = [];
    for (const other of world.snakes) {
      if (other === s || !other.alive) continue;
      const isPlayer = other === player && world.playing;
      // Inattention makes rookies vulnerable to the player's cut-offs, not to ordinary traffic.
      if (isPlayer && brain.lapseLeft > 0) continue;
      const margin = isPlayer ? p.margin : 42;
      const look = Math.max(65, speed * (isPlayer ? p.horizon : 2.4)) + s.radius * 2 + margin;
      const safe = s.radius + other.radius + margin, reach2 = (look + safe) ** 2;
      const points = other.points;
      for (let i = 0; i < points.length - 1; i += 4) {
        const a = points[i], b = points[Math.min(points.length - 1, i + 4)];
        if (geometry.pointSegmentDistance2(s.x, s.y, a.x, a.y, b.x, b.y) < reach2) nearby.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, safe, look });
      }
      // Traffic prediction prevents opposing bots choosing a route through each other's moving heads.
      const prediction = isPlayer ? p.predict : 1.2;
      if (prediction) {
        const d = (other.velocity || (isPlayer ? 370 : 245)) * prediction;
        if ((s.x - other.x) ** 2 + (s.y - other.y) ** 2 < reach2) nearby.push({ ax: other.x, ay: other.y,
          bx: other.x + Math.cos(other.a) * d, by: other.y + Math.sin(other.a) * d, safe, look });
      }
    }
    const danger = angle => {
      let score = 0;
      for (const obstacle of nearby) {
        const x = s.x + Math.cos(angle) * obstacle.look, y = s.y + Math.sin(angle) * obstacle.look;
        const d2 = geometry.segmentDistance2(s.x, s.y, x, y, obstacle.ax, obstacle.ay, obstacle.bx, obstacle.by);
        if (d2 < obstacle.safe ** 2) score += (1 - Math.sqrt(d2) / obstacle.safe) * 180;
      }
      return score;
    };
    if (!nearby.length || danger(route) < .01) return route;
    brain.avoiding = true;
    let bestAngle = route, bestScore = Infinity;
    for (const offset of profiles.smart.offsets) {
      const angle = route + offset, score = Math.abs(offset) * 20 + angleGap(angle, s.a) * 8 + danger(angle);
      if (score < bestScore) { bestScore = score; bestAngle = angle; }
    }
    // Commit to the detour instead of swinging back into the same body at the next decision.
    s.routeAngle = bestAngle; s.routeTimer = Math.max(s.routeTimer, 1.25);
    return bestAngle;
  }
  return { normalize, roster, createBrain, heading };
});
