import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {openWorkspace, settle} from './helpers';

for (const theme of ['dark', 'light', 'contrast'] as const) {
  for (const route of ['/explorer', '/performance', '/learn', '/learn/in-order', '/learn/glossary']) {
    test(`axe: ${theme} ${route}`, async ({page}) => {
      await openWorkspace(page, {theme, route}); await settle(page);
      const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
  test(`axe: active tools and dialogs in ${theme}`, async ({page}) => {
    await openWorkspace(page, {theme, experience: 'expert'});
    for (let index = 0; index < 8; index++) await page.getByRole('button', {name: 'Next cycle', exact: true}).click();
    for (const tab of ['Timeline', 'Reorder buffer', 'Rename', 'Scheduling', 'Memory queue', 'Trace']) {
      await page.getByRole('tab', {name: new RegExp(`^${tab}( \\d+)?$`)}).click(); await settle(page);
      const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations, `${theme} ${tab}`).toEqual([]);
    }
    await page.getByRole('button', {name: 'Configure CPU', exact: true}).click();
    expect((await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape'); await page.keyboard.press('Control+k');
    expect((await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  });
}

test('keyboard controls preserve native actions and contain modal focus', async ({page}) => {
  await openWorkspace(page);
  await page.getByRole('radio', {name: 'Out-of-order', exact: true}).focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.clock-counter strong')).toHaveText('00');
  await expect(page.getByRole('radio', {name: 'In-order', exact: true})).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('tab', {name: 'Datapath', exact: true}).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', {name: 'Timeline', exact: true})).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.clock-counter strong')).toHaveText('00');
  await page.getByRole('button', {name: 'Next cycle', exact: true}).focus(); await page.keyboard.press('Space');
  await expect(page.locator('.clock-counter strong')).toHaveText('01');
  await expect(page.getByRole('button', {name: 'Run simulation', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Configure CPU', exact: true}).click();
  for (let index = 0; index < 30; index++) {await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);}
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', {name: 'Configure CPU', exact: true})).toBeFocused();
  await page.getByRole('tab', {name: 'Datapath', exact: true}).click();
  await expect(page.locator('.moving-instruction-token').first()).toBeVisible();
  expect(await page.locator('.moving-instruction-token').first().evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
});

test('mobile inspector supports snap heights, keyboard resize, and focus return', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844}); await openWorkspace(page);
  await page.getByRole('button', {name: /Open inspector/}).click();
  const sheet = page.getByRole('dialog', {name: 'CPU inspector', exact: true});
  await page.getByRole('button', {name: 'Reduce sheet', exact: true}).click(); await expect(sheet).toHaveAttribute('data-snap', 'half');
  await page.getByRole('button', {name: 'Expand sheet', exact: true}).focus(); await page.keyboard.press('Enter'); await expect(sheet).toHaveAttribute('data-snap', 'full');
  expect((await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', {name: /Open inspector/})).toBeFocused();
});
