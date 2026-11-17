import {test, expect} from '@playwright/test';
import {openWorkspace, noPageOverflow, settle} from './helpers';

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 768, 1280, 1440]) {
    test(`explorer snapshot ${theme} ${width}px`, async ({page}) => {
      await page.setViewportSize({width, height: width < 760 ? 844 : 1000});
      await openWorkspace(page, {theme}); await settle(page); await noPageOverflow(page);
      await expect(page).toHaveScreenshot(`explorer-${theme}-${width}.png`, {animations: 'disabled'});
    });
  }
}
test('workspace content and controls fit every supported breakpoint', async ({page}) => {
  await openWorkspace(page);
  for (const width of [320, 360, 390, 720, 760, 768, 1024, 1180, 1280, 1440]) {
    await page.setViewportSize({width, height: 1000}); await noPageOverflow(page);
    expect(await page.locator('.execution-top').evaluate(element => element.scrollWidth <= element.clientWidth + 1), `execution controls at ${width}`).toBe(true);
  }
  await page.evaluate(() => document.querySelector('.visualization-area')!.scrollIntoView({block: 'start'}));
  expect(await page.locator('.topbar').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  expect(await page.locator('.execution-bar').evaluate(element => element.getBoundingClientRect().top)).toBe(80);
  await page.setViewportSize({width: 390, height: 844});
  for (const route of ['/performance', '/learn', '/learn/in-order', '/learn/glossary']) {
    await page.goto(`/#${route}`); await expect(page.locator('h1').first()).toBeVisible(); await noPageOverflow(page);
  }
});
