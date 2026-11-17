import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '');
const executablePath = process.env.CHROME_BIN ?? (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const browser = await chromium.launch({executablePath, args: ['--no-sandbox']});
try {
  await mkdir('docs/screenshots', {recursive: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 1400}, colorScheme: 'dark', reducedMotion: 'reduce'});
  await context.addInitScript(() => {try {if (!localStorage.getItem('rvmx-settings-v2')) localStorage.setItem('rvmx-settings-v2', JSON.stringify({theme: 'dark', experience: 'guided', welcomed: true, lastRoute: '/explorer', completedLessons: []}));} catch {}});
  const page = await context.newPage(); await page.goto(`${base}/#/explorer`); await page.getByLabel('RISC-V assembly code').waitFor(); await page.evaluate(() => document.fonts.ready);
  for (let index = 0; index < 8; index++) await page.getByRole('button', {name: 'Next cycle', exact: true}).click();
  await page.getByRole('button', {name: 'Inspect source line 5', exact: true}).click(); await page.mouse.move(0, 0);
  await page.screenshot({path: 'docs/screenshots/cpu-explorer.png'});
  await page.getByRole('button', {name: 'Fit', exact: true}).click(); await page.locator('.visualization-area').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('.visualization-area').scrollIntoView({block: 'start'})); await page.mouse.move(0, 0);
  await page.screenshot({path: 'docs/screenshots/datapath.png'});
  await page.getByRole('link', {name: 'Performance Lab', exact: true}).click(); await page.getByText('Verified against interpreter', {exact: true}).waitFor(); await page.mouse.move(0, 0);
  await page.screenshot({path: 'docs/screenshots/performance.png'});
  await page.getByRole('link', {name: 'Learning Center', exact: true}).click(); await page.getByRole('searchbox', {name: 'Search lessons', exact: true}).waitFor(); await page.mouse.move(0, 0);
  await page.screenshot({path: 'docs/screenshots/learning.png'});
  const mobile = await context.newPage(); await mobile.setViewportSize({width: 390, height: 844}); await mobile.goto(`${base}/#/explorer`); await mobile.getByLabel('RISC-V assembly code').waitFor(); await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({path: 'docs/screenshots/mobile.png'});
  await mobile.getByRole('button', {name: /Open inspector/}).click(); await mobile.getByRole('dialog', {name: 'CPU inspector', exact: true}).waitFor();
  await mobile.screenshot({path: 'docs/screenshots/mobile-inspector.png'});
  console.log('Captured Explorer, datapath, Performance Lab, Learning Center, and mobile screenshots.');
} finally {await browser.close();}
