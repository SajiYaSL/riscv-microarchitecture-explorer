import {expect, type Page, type Download} from '@playwright/test';
export async function openWorkspace(page: Page, options: {theme?: 'dark' | 'light' | 'contrast'; experience?: 'guided' | 'expert'; route?: string} = {}) {
  await page.addInitScript(({theme, experience}) => {
    try {
      if (!localStorage.getItem('rvmx-settings-v2')) localStorage.setItem('rvmx-settings-v2', JSON.stringify({theme, experience, welcomed: true, lastRoute: '/explorer', completedLessons: []}));
    } catch { /* Exercise the app even when persistence is unavailable. */ }
  }, {theme: options.theme ?? 'dark', experience: options.experience ?? 'guided'});
  await page.goto(`/#${options.route ?? '/explorer'}`);
  await expect(page.locator('h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
export async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => ({document: document.documentElement.scrollWidth > innerWidth, workspace: document.querySelector('.page')!.scrollWidth > document.querySelector('.page')!.clientWidth + 1}))).toEqual({document: false, workspace: false});
}
export async function settle(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).not.toHaveClass(/theme-switching/);
}
export async function downloadBytes(download: Download) {
  const stream = await download.createReadStream(); if (!stream) throw Error('Download did not produce a readable file.');
  const chunks: Uint8Array[] = []; let size = 0;
  for await (const chunk of stream as unknown as AsyncIterable<Uint8Array>) {chunks.push(chunk); size += chunk.length;}
  const bytes = new Uint8Array(size); let offset = 0;
  chunks.forEach(chunk => {bytes.set(chunk, offset); offset += chunk.length;});
  return bytes;
}
