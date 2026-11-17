import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
async function files(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}
const issues = [];
for (const file of await files('src')) {
  if (!/\.(css|tsx)$/.test(file) || /\/(tokens|themes)\.css$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  if (/#[\da-f]{3,8}\b/i.test(source)) issues.push(`${file}: hard-coded color outside the theme`);
  if (/font-size:\s*(?:[1-9]|10|11)px|fontSize=\{(?:[1-9]|10|11)\}/.test(source)) issues.push(`${file}: text below 12px`);
  if (file.endsWith('.css') && /\.editor-body\b|\.mode-switch\b|\.stage-card\b/.test(source)) issues.push(`${file}: legacy selector`);
}
if (issues.length) {console.error(issues.join('\n')); process.exitCode = 1;}
else console.log('UI tokens checked: no color literals, text below 12px, or legacy selectors.');
