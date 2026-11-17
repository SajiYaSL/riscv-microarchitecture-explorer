import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
const executablePath = process.env.CHROME_BIN ?? (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const browser = await chromium.launch({executablePath, args: ['--no-sandbox']});
try {
  const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1});
  const font = await readFile('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
  const artwork = await readFile('public/og-image.svg', 'utf8');
  await page.setContent(`<style>@font-face{font-family:'Inter Variable';src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:100 900}body{margin:0}svg{display:block}</style>${artwork}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path: 'public/og-image.png'});
  const svg = await readFile('public/favicon.svg', 'utf8');
  const images = await page.evaluate(async source => {
    const image = new Image(); image.src = `data:image/svg+xml;base64,${btoa(source)}`; await image.decode();
    const result = {};
    for (const [size, name] of [[16, 'favicon-16.png'], [32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
      const canvas = document.createElement('canvas'); canvas.width = Number(size); canvas.height = Number(size);
      canvas.getContext('2d').drawImage(image, 0, 0, Number(size), Number(size)); result[name] = canvas.toDataURL('image/png').split(',')[1];
    }
    return result;
  }, svg);
  for (const [name, data] of Object.entries(images)) await writeFile(`public/${name}`, Buffer.from(data, 'base64'));
  const interLicense = await readFile('node_modules/@fontsource-variable/inter/LICENSE', 'utf8');
  const monoLicense = await readFile('node_modules/@fontsource-variable/jetbrains-mono/LICENSE', 'utf8');
  await writeFile('public/font-licenses.txt', `Inter Variable\n${interLicense}\n\nJetBrains Mono Variable\n${monoLicense}`);
  console.log('Rendered social artwork and platform icons.');
} finally {await browser.close();}
