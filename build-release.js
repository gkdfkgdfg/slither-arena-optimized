'use strict';
// Publish one immutable entry so an old cached HTML/JS combination cannot mix releases.
const fs = require('node:fs');
const path = require('node:path');
const release = process.argv[2];
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(release || '')) {
  throw new Error('Usage: node build-release.js <release-id>');
}
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
const source = read('index.html');
let scripts = 0, styles = 0;
const html = source
  .replace('<html lang="ru">', `<html lang="ru" data-release="${release}">`)
  .replace(/<link rel="stylesheet" href="([a-z0-9-]+\.css)(?:\?[^"<>]*)?">/g, (_, name) => {
    styles++;
    const css = read(name);
    if (/<\/style/i.test(css)) throw new Error('Unexpected style closing tag: ' + name);
    return `<style data-source="${name}">\n${css}\n</style>`;
  })
  .replace(/<script src="([a-z0-9-]+\.js)(?:\?[^"<>]*)?"><\/script>/g, (_, name) => {
    scripts++;
    return `<script data-source="${name}">\n${read(name).replace(/<\/script/gi, '<\\/script')}\n</script>`;
  });
if (!scripts || !styles || /<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"/i.test(html)) {
  throw new Error('Release must contain all scripts and styles inline');
}
const filename = `play-${release}.html`, target = path.join(__dirname, filename);
if (fs.existsSync(target) && read(filename) !== html) {
  throw new Error('Published entries are immutable; choose a new release id');
}
fs.writeFileSync(target, html, 'utf8');
console.log(`${filename}: ${scripts} scripts, ${styles} stylesheet, ${Buffer.byteLength(html)} bytes`);
