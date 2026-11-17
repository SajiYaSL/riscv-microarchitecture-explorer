import {readdir, readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const files = (await readdir('dist/assets')).filter(file => /\.(js|css|woff2)$/.test(file));
const rows = await Promise.all(files.map(async file => {const content = await readFile(`dist/assets/${file}`); return {file, bytes: content.length, gzipBytes: file.endsWith('.woff2') ? null : gzipSync(content).length};}));
console.table(rows.map(row => ({asset: row.file, 'size (KB)': (row.bytes / 1000).toFixed(1), 'gzip (KB)': row.gzipBytes ? (row.gzipBytes / 1000).toFixed(1) : '—'})));
const entry = rows.find(row => /^index-.*\.js$/.test(row.file));
if (!entry || entry.gzipBytes > 110000) {console.error('Initial JavaScript exceeded the 110 KB gzip budget.'); process.exitCode = 1;}
