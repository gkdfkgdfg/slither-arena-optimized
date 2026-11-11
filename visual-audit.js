'use strict';
// Development-only audit, deliberately not loaded by index.html.
// Load this script in DevTools, then await runVisualAudit({flags: false/true}).
window.visualAuditSheets = [];
let auditRenderer;
window.runVisualAudit = async function ({ flags = false } = {}) {
  home();
  auditRenderer ??= SnakeRibbon.create();
  if (!auditRenderer) throw Error('WebGL is unavailable; test the Canvas fallback separately.');
  const gl = auditRenderer.context;
  const choices = flags ? countrySkins : [...BOT_SKINS, ...COLORS.slice(1).map(color => ({ id: 'neon', color, name: color }))];
  const failures = [], pixels = new Uint8Array(320 * 160 * 4), sheets = [];
  let draws = 0, minCoverage = 1;
  for (let index = 0; index < choices.length; index++) {
    const skin = choices[index], key = skin.id.startsWith('flag_') ? skin.id : skin.id + skin.color;
    skinTexture(skin.id, skin.color);
    const deadline = performance.now() + 10000;
    while (skinAssetState.get(key) === 'loading' && performance.now() < deadline) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    if (skinAssetState.get(key) === 'loading' || skinAssetState.get(key) === 'error') failures.push({ skin: skin.id, error: 'image did not load' });
    // A changing centerline, a thin body and a thick body exercise seams in motion.
    const frames = flags ? 3 : 24;
    for (let frame = 0; frame < frames; frame++) {
      const radius = frame < frames / 2 ? 14 : 24;
      const points = Array.from({ length: 180 }, (_, i) => ({ x: 290 - i * 1.4, y: 80 + Math.sin(i / 22 + frame * .13) * 24 }));
      const snake = { skin: skin.id, color: skin.color, radius, points };
      if (!auditRenderer.draw([snake], { width: 320, height: 160, dpr: 1, zoom: 1, x: 160, y: 80 })) {
        failures.push({ skin: skin.id, error: auditRenderer.diagnostics().error || 'draw failed' }); break;
      }
      gl.readPixels(0, 0, 320, 160, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let opaque = 0, samples = 0;
      for (let i = 5; i < points.length - 5; i += 5) {
        const p = points[i], x = Math.floor(p.x), y = 159 - Math.floor(p.y);
        samples++; if (pixels[(y * 320 + x) * 4 + 3] > 250) opaque++;
      }
      const coverage = opaque / samples;
      minCoverage = Math.min(minCoverage, coverage); draws++;
      if (coverage < .98) failures.push({ skin: skin.id, frame, error: 'body has missing pixels', coverage });
      if (gl.getError() !== gl.NO_ERROR) failures.push({ skin: skin.id, error: 'WebGL error' });
      if (frame === 0 && !flags) {
        const sheetIndex = Math.floor(index / 16), tile = index % 16;
        if (!sheets[sheetIndex]) {
          sheets[sheetIndex] = document.createElement('canvas'); sheets[sheetIndex].width = 1280; sheets[sheetIndex].height = 720;
          const g = sheets[sheetIndex].getContext('2d'); g.fillStyle = '#10202c'; g.fillRect(0, 0, 1280, 720);
        }
        const g = sheets[sheetIndex].getContext('2d'), x = tile % 4 * 320, y = Math.floor(tile / 4) * 180;
        g.drawImage(auditRenderer.canvas, x, y); g.font = '14px Arial'; g.fillStyle = '#fff'; g.fillText(skin.id, x + 12, y + 170);
      }
    }
    if (index % 8 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
  }
  if (!flags) window.visualAuditSheets = sheets;
  return { variants: choices.length, animatedDraws: draws, minCenterlineCoverage: minCoverage,
    failures, gpuCache: auditRenderer.diagnostics(), sourceCache: referenceMaterials.size };
};
window.showVisualAuditSheet = function (index) {
  let panel = document.getElementById('visualAuditPanel');
  if (!panel) {
    panel = document.createElement('div'); panel.id = 'visualAuditPanel';
    panel.style.cssText = 'position:fixed;inset:0;background:#10202c;z-index:9999;overflow:auto'; document.body.append(panel);
  }
  const sheet = window.visualAuditSheets[index]; sheet.style.cssText = 'display:block;width:100%;height:auto';
  panel.replaceChildren(sheet);
};

// This isolates one snake for turning, boosting and five sizes. Collision
// behavior with other snakes is covered separately; no grace bypass exists.
// It measures the live animation loop, rather than calling render repeatedly.
window.runMotionAudit = async function ({ frames = 1500 } = {}) {
  home();
  const savedBalance = prefs.balance, savedStake = $('stake').value;
  prefs.balance = Math.max(1000, prefs.balance); $('stake').value = 10; start();
  snakes = [player]; collisionWorld.clear();
  const gaps = [], renders = [], updates = [];
  let previous = performance.now(), jitter = 0, invalidBodies = 0;
  const quantile = (values, fraction) => values.sort((a, b) => a - b)[Math.floor(values.length * fraction)];
  try {
    for (let i = 0; i < frames; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const now = performance.now(); gaps.push(now - previous); previous = now;
      aim = { x: Math.cos(elapsed * .8), y: Math.sin(elapsed * .8) };
      boost = i >= frames * 2 / 15 && i < frames * 6 / 15;
      if (i % Math.max(1, Math.floor(frames / 5)) === 0) {
        const value = [10, 40, 160, 600, 1000][Math.min(4, Math.floor(i * 5 / frames))];
        player.len += lenForValue(value) - lenForValue(player.value); player.value = value;
      }
      jitter = Math.max(jitter, Math.hypot(player.renderX - camera.x, player.renderY - camera.y) * zoom);
      if (snakes.some(s => s.alive && s.points.some(p => !Number.isFinite(p.x + p.y)))) invalidBodies++;
      renders.push(diagnostics.renderMs); updates.push(diagnostics.updateMs);
    }
    return { frames, scene: 'isolated player', simulatedSeconds: elapsed, maxHeadJitterPixels: jitter, invalidBodies,
      rafMedianMs: quantile(gaps, .5), rafP95Ms: quantile(gaps, .95),
      renderMedianMs: quantile(renders, .5), renderP95Ms: quantile(renders, .95),
      updateMedianMs: quantile(updates, .5), updateP95Ms: quantile(updates, .95), renderer: arenaRibbon?.diagnostics() };
  } finally {
    boost = false; paused = true; prefs.balance = savedBalance; prefs.stake = Number(savedStake);
    $('stake').value = savedStake; save();
  }
};
