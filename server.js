'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const gzip = promisify(zlib.gzip), brotli = promisify(zlib.brotliCompress);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const clientFiles = new Set(['index.html', 'style.css', 'game-core.js', 'ribbon-mesh.js', 'ribbon-renderer.js', 'visual-audit.js', 'mystake.js', 'mystake-art.js',
  'mystake-physics.js', 'mystake-bots.js', 'mystake-maps.js', 'video-look.js', 'extra-skins.js', 'flag-countries.js']);

function createServer({ rootDir = __dirname } = {}) {
  const cache = new Map();
  let cachedBytes = 0;
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end('Bad URL'); return; }
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', version: '1.0.0' }));
      return;
    }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const asset = /^(?:flags|fonts|maps|skins)\/[a-zA-Z0-9_-]+\.(?:png|webp|woff2)$/.test(relative);
    if (pathname.includes('\\') || pathname.includes('\0') || (!clientFiles.has(relative) && !asset)) {
      res.writeHead(404).end('Not found'); return;
    }
    try {
      const file = path.join(rootDir, relative), stat = await fs.stat(file);
      const accept = req.headers['accept-encoding'] || '';
      const accepted = new Map(accept.split(',').map(part => {
        const [name, ...params] = part.trim().split(';');
        const quality = params.find(p => p.trim().startsWith('q='));
        return [name, quality ? Number(quality.trim().slice(2)) : 1];
      }));
      const encoding = ['br', 'gzip'].map(name => ({ name, q: accepted.get(name) ?? accepted.get('*') ?? 0 }))
        .filter(item => item.q > 0).sort((a, b) => b.q - a.q)[0]?.name || '';
      const compressible = /\.(html|css|js|svg)$/.test(relative);
      const format = compressible ? encoding : '';
      const etag = `"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}-${format}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Cache-Control', asset ? 'public, max-age=86400' : 'no-cache');
      if (req.headers['if-none-match'] === etag) { res.writeHead(304).end(); return; }
      let entry = cache.get(relative + ':' + format);
      if (!entry || entry.etag !== etag) {
        const raw = await fs.readFile(file);
        const data = format === 'br' ? await brotli(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } })
          : format === 'gzip' ? await gzip(raw, { level: 6 }) : raw;
        entry = { etag, data };
        const cacheKey = relative + ':' + format, prior = cache.get(cacheKey);
        if (prior) { cachedBytes -= prior.data.length; cache.delete(cacheKey); }
        while (cache.size && cachedBytes + data.length > 32 * 1024 * 1024) {
          const first = cache.keys().next().value;
          cachedBytes -= cache.get(first).data.length;
          cache.delete(first);
        }
        if (data.length <= 32 * 1024 * 1024) { cache.set(cacheKey, entry); cachedBytes += data.length; }
      }
      res.setHeader('Content-Type', mime[path.extname(relative)] || 'application/octet-stream');
      res.setHeader('Content-Length', entry.data.length);
      if (format) res.setHeader('Content-Encoding', format);
      res.writeHead(200).end(req.method === 'HEAD' ? undefined : entry.data);
    } catch (err) {
      res.writeHead(err.code === 'ENOENT' || err.code === 'ENOTDIR' ? 404 : 500).end('Not found');
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000), host = process.env.HOST || '127.0.0.1';
  const server = createServer();
  server.listen(port, host, () => console.log(`Slither Arena: http://${host}:${server.address().port}`));
  server.on('error', err => { console.error(err.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
module.exports = { createServer };
