// Standalone brand assets resolve their colors from the application tokens.
import {readFile, writeFile} from 'node:fs/promises';
const tokens = await readFile('src/styles/tokens.css', 'utf8');
const values = new Map([...tokens.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
const color = name => {const value = values.get(name); if (!value) throw Error(`Missing token ${name}`); return value;};
const logo = `<rect width="64" height="64" rx="16" fill="${color('--accent')}"/><path d="M12 32h9l7-18 10 36 7-18h8" fill="none" stroke="${color('--accent-contrast')}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
await writeFile('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>RVMX</title>${logo}</svg>\n`);
const phases = [['IF', '--stage-fetch'], ['ID', '--stage-decode'], ['EX', '--stage-exec'], ['MEM', '--stage-memory'], ['WB', '--stage-retire']];
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${color('--bg-0')}"/>
<defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${color('--border-subtle')}" stroke-width=".5"/></pattern></defs>
<rect x="600" width="600" height="630" fill="url(#grid)"/>
<g transform="translate(72 60) scale(.75)">${logo}</g>
<text x="136" y="97" font-family="Inter Variable,Arial,sans-serif" font-size="32" font-weight="700" fill="${color('--text-1')}">RVMX.</text>
<rect x="72" y="157" width="212" height="32" rx="8" fill="${color('--accent-soft')}"/>
<text x="88" y="179" font-family="Inter Variable,Arial,sans-serif" font-size="14" fill="${color('--accent')}">YOUR ARCHITECTURE LAB</text>
<text x="72" y="285" font-family="Inter Variable,Arial,sans-serif" font-size="70" font-weight="650" letter-spacing="-3" fill="${color('--text-1')}">Think inside</text>
<text x="72" y="370" font-family="Inter Variable,Arial,sans-serif" font-size="70" font-weight="650" letter-spacing="-3" fill="${color('--accent')}">the machine.</text>
<text x="76" y="425" font-family="Inter Variable,Arial,sans-serif" font-size="21" fill="${color('--text-2')}">Write a little code. Understand every cycle.</text>
<text x="76" y="557" font-family="Inter Variable,Arial,sans-serif" font-size="16" fill="${color('--text-3')}">RISC-V explorer · Guided + Expert · Built for curiosity</text>
<rect x="780" y="150" width="200" height="200" rx="28" fill="${color('--bg-2')}" stroke="${color('--border-strong')}"/>
<rect x="809" y="179" width="142" height="142" rx="18" fill="${color('--accent-soft')}" stroke="${color('--accent')}"/>
<text x="880" y="245" text-anchor="middle" font-family="Inter Variable,Arial,sans-serif" font-size="22" font-weight="600" fill="${color('--accent')}">RV32</text>
<text x="880" y="278" text-anchor="middle" font-family="Inter Variable,Arial,sans-serif" font-size="16" fill="${color('--text-2')}">Every cycle, visible.</text>
${[0, 1, 2, 3].map(index => `<path d="M${810 + index * 46},134V150 M${810 + index * 46},350V366 M764,${180 + index * 46}H780 M980,${180 + index * 46}H996" stroke="${color('--border-strong')}" stroke-width="3"/>`).join('')}
${phases.map(([label, token], index) => `<g transform="translate(${668 + index * 88} 435)"><rect width="74" height="62" rx="10" fill="${color('--bg-2')}" stroke="${color('--border')}"/><rect x="13" y="12" width="6" height="6" rx="2" fill="${color(token)}"/><text x="37" y="43" text-anchor="middle" font-family="Inter Variable,Arial,sans-serif" font-size="17" fill="${color('--text-1')}">${label}</text>${index < 4 ? `<path d="M74 31H88" stroke="${color('--border-strong')}"/>` : ''}</g>`).join('')}
</svg>`;
await writeFile('public/og-image.svg', og + '\n');
await writeFile('public/site.webmanifest', JSON.stringify({name: 'RVMX · RISC-V Architecture Lab', short_name: 'RVMX', description: 'Explore every cycle of your RISC-V program.', start_url: './#/explorer', display: 'standalone', background_color: color('--bg-0'), theme_color: color('--accent'), icons: [{src: '/icon-192.png', sizes: '192x192', type: 'image/png'}, {src: '/icon-512.png', sizes: '512x512', type: 'image/png'}]}, null, 2) + '\n');
console.log('Generated SVG branding and app manifest from the theme tokens.');
