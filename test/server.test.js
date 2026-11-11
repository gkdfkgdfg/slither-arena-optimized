'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('node:zlib');
const { createServer } = require('../server');

test('server serves local resources, compression, validators and rejects private paths', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port;
  const request = (path, { method = 'GET', headers = {} } = {}) => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    }); req.on('error', reject); req.end();
  });
  const page = await request('/');
  assert.equal(page.status, 200); assert.match(page.body.toString(), /game-core.js/);
  for (const path of ['/game-core.js?v=1', '/ribbon-mesh.js?v=visualfix3', '/ribbon-renderer.js?v=visualfix3', '/skins/vb_teal.png?v=31', '/flags/ve.png', '/fonts/lilita-one.woff2', '/maps/reg_stoneflags.webp?v=33']) {
    const res = await request(path); assert.equal(res.status, 200, path); assert.ok(res.body.length > 100);
  }
  const raw = await request('/mystake.js');
  const gzip = await request('/mystake.js', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(gzip.headers['content-encoding'], 'gzip');
  assert.deepEqual(zlib.gunzipSync(gzip.body), raw.body);
  const br = await request('/mystake.js', { headers: { 'Accept-Encoding': 'gzip;q=0.3, br;q=0.8' } });
  assert.equal(br.headers['content-encoding'], 'br');
  assert.deepEqual(zlib.brotliDecompressSync(br.body), raw.body);
  const none = await request('/mystake.js', { headers: { 'Accept-Encoding': 'gzip;q=0, br;q=0' } });
  assert.equal(none.headers['content-encoding'], undefined);
  const cached = await request('/mystake.js', { headers: { 'If-None-Match': raw.headers.etag } });
  assert.equal(cached.status, 304); assert.equal(cached.body.length, 0);
  const head = await request('/mystake.js', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(head.body.length, 0); assert.ok(Number(head.headers['content-length']) > 1000);
  for (const path of ['/server.js', '/package.json', '/.git/config', '/test/core.test.js', '/%2e%2e%2fserver.js', '/skins/%2e%2e%5cserver.js', '/bad%00.png']) {
    assert.equal((await request(path)).status, 404, path);
  }
  assert.equal((await request('/bad%')).status, 400);
  assert.equal((await request('/', { method: 'POST' })).status, 405);
  assert.deepEqual(JSON.parse((await request('/api/health')).body), { status: 'ok', version: '1.0.0' });
});
