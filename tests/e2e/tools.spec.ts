import {test, expect} from '@playwright/test';
import {openWorkspace, downloadBytes} from './helpers';

test('commands, trace filtering, exports, and saved experiments work together', async ({page}) => {
  await openWorkspace(page, {experience: 'expert'});
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', {name: 'Search commands', exact: true}).fill('load register renaming'); await page.keyboard.press('Enter');
  await expect(page.getByLabel('Example program')).toHaveValue('Register Renaming');
  await page.getByRole('button', {name: 'Next cycle', exact: true}).focus(); await page.keyboard.press('f');
  await page.getByRole('tab', {name: 'Trace', exact: true}).click();
  await page.getByRole('searchbox', {name: 'Filter instruction trace'}).fill('ADDI');
  await expect(page.locator('.trace-view tbody tr').first()).toContainText('ADDI');
  await page.getByRole('button', {name: 'Saved experiments', exact: true}).click();
  await page.getByRole('textbox', {name: 'Experiment name', exact: true}).fill('Renaming study');
  await page.getByRole('button', {name: 'Save current workspace', exact: true}).click();
  const promise = page.waitForEvent('download'); await page.getByRole('button', {name: 'Export Renaming study', exact: true}).click();
  const download = await promise; const data = JSON.parse(new TextDecoder().decode(await downloadBytes(download)));
  expect(data).toMatchObject({version: 2, name: 'Renaming study', workspace: {sample: 'Register Renaming'}});
  await page.getByLabel('Import experiment file', {exact: true}).setInputFiles((await download.path())!);
  await expect(page.getByRole('button', {name: 'Load Renaming study', exact: true})).toHaveCount(2);
  await page.getByRole('button', {name: 'Load Renaming study', exact: true}).first().click();
  await expect(page.getByLabel('Example program')).toHaveValue('Register Renaming');
});

test('pinned comparisons preserve the configuration at capture time', async ({page}) => {
  await openWorkspace(page, {experience: 'expert', route: '/performance'});
  await page.getByRole('textbox', {name: 'Run name', exact: true}).fill('Typical'); await page.getByRole('button', {name: 'Pin this run', exact: true}).click();
  await page.getByRole('button', {name: 'Configure CPU', exact: true}).click(); await page.getByRole('button', {name: /Small One instruction/}).click();
  await page.getByRole('button', {name: 'Apply & restart', exact: true}).click();
  await page.getByRole('textbox', {name: 'Run name', exact: true}).fill('Small'); await page.getByRole('button', {name: 'Pin this run', exact: true}).click();
  await expect(page.getByLabel('Baseline run', {exact: true})).toBeVisible();
  const runs = await page.evaluate(() => JSON.parse(localStorage.getItem('rvmx-library-v2')!).runs);
  expect(runs.find((run: {name: string}) => run.name === 'Typical').workspace.config.issueWidth).toBe(2);
  expect(runs.find((run: {name: string}) => run.name === 'Small').workspace.config.issueWidth).toBe(1);
  await page.locator('.architecture-comparison .instr-label.text-button').first().click();
  await expect(page.getByRole('dialog', {name: 'CPU inspector', exact: true})).toBeVisible();
});

test('charts expose data and export self-contained SVG and real PNG files', async ({page}) => {
  await openWorkspace(page, {experience: 'expert'});
  await page.getByRole('button', {name: 'Finish', exact: true}).click(); await page.getByRole('tab', {name: 'Performance', exact: true}).click();
  let promise = page.waitForEvent('download'); await page.getByRole('button', {name: 'Export Queue occupancy as SVG', exact: true}).click();
  const svg = await promise; const xml = new TextDecoder().decode(await downloadBytes(svg)); expect(xml).toContain('<svg'); expect(xml).not.toContain('var(--');
  promise = page.waitForEvent('download'); await page.getByRole('button', {name: 'Export Queue occupancy as PNG', exact: true}).click();
  const png = await promise; const bytes = await downloadBytes(png); expect(new TextDecoder().decode(bytes.subarray(1, 4))).toBe('PNG');
  await page.getByRole('button', {name: 'View as table', exact: true}).first().click();
  await expect(page.getByRole('table', {name: 'Queue occupancy data', exact: true})).toBeVisible();
});
