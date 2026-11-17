import {test, expect} from '@playwright/test';
import {openWorkspace} from './helpers';

test('first-run choices and example execution work without a backend', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('radio', {name: /I’m learning/}).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', {name: /I’m experienced/})).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', {name: 'Start exploring', exact: true}).click();
  await expect(page.getByRole('radio', {name: 'Expert', exact: true})).toHaveAttribute('aria-checked', 'true');
  const examples = await page.getByLabel('Example program').locator('option').allTextContents();
  expect(examples).toHaveLength(11);
  for (const example of examples) {
    await page.getByLabel('Example program').selectOption(example);
    await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
    await page.getByRole('button', {name: 'Finish', exact: true}).click();
    await page.getByRole('link', {name: 'Performance Lab', exact: true}).click();
    await expect(page.getByText('Verified against interpreter', {exact: true})).toBeVisible();
    await page.getByRole('link', {name: 'CPU Explorer', exact: true}).click();
  }
  expect(errors).toEqual([]);
});

test('configuration validates changes and preserves precise fault behavior', async ({page}) => {
  await openWorkspace(page);
  await page.getByRole('button', {name: 'Configure CPU', exact: true}).click();
  await page.getByRole('button', {name: /Wide More room/}).click();
  await page.getByRole('spinbutton', {name: 'Physical registers', exact: true}).fill('32');
  await expect(page.getByRole('button', {name: 'Apply & restart', exact: true})).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('physicalRegisters must be an integer');
  await page.getByRole('spinbutton', {name: 'Physical registers', exact: true}).fill('96');
  await page.getByRole('textbox', {name: 'Save these settings as a preset', exact: true}).fill('Wide experiment');
  await page.getByRole('button', {name: 'Save preset', exact: true}).click();
  await page.getByRole('button', {name: 'Apply & restart', exact: true}).click();
  await expect(page.locator('.clock-counter strong')).toHaveText('00');
  await page.getByLabel('RISC-V assembly code').fill('ADDI x1,x0,9\nSW x1,0(x0)\nLW x0,1(x0)\nSW x1,4(x0)');
  await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
  await page.getByRole('button', {name: 'Finish', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('misaligned word load');
  await page.getByRole('link', {name: 'Performance Lab', exact: true}).click();
  await expect(page.getByText('Verified against interpreter', {exact: true})).toBeVisible();
});

test('drafts, loaded source, themes, routes, and compressed links survive reload', async ({page, browser}) => {
  await openWorkspace(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByLabel('RISC-V assembly code').fill('ADDI x1,x0,31');
  await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
  await page.getByLabel('RISC-V assembly code').fill('ADDI x1,x0,');
  await page.reload();
  await expect(page.getByLabel('RISC-V assembly code')).toHaveValue('ADDI x1,x0,');
  await expect(page.getByRole('button', {name: 'Assemble / load', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: 'Finish', exact: true}).click();
  await page.getByRole('tab', {name: 'Registers', exact: true}).click();
  await expect(page.getByRole('button', {name: /^Register x1, value 31/})).toBeVisible();
  await page.getByLabel('RISC-V assembly code').fill('ADDI x1,x0,31');
  await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
  await page.getByLabel('Theme', {exact: true}).selectOption('light');
  await page.getByRole('link', {name: 'Performance Lab', exact: true}).click(); await page.reload();
  await expect(page).toHaveURL(/#\/performance$/); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', {name: 'Share', exact: true}).click();
  await expect(page.getByText('Workspace link copied. Share your experiment.', {exact: true})).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText()); expect(link).toContain('?share=2z.');
  const context = await browser.newContext(); const recipient = await context.newPage();
  try {
    await recipient.goto(link); await expect(recipient.getByText('Shared workspace loaded. Ready when you are.', {exact: true})).toBeVisible();
    await recipient.getByRole('link', {name: 'CPU Explorer', exact: true}).click();
    await expect(recipient.getByLabel('RISC-V assembly code')).toHaveValue('ADDI x1,x0,31');
    await expect(recipient.getByRole('button', {name: 'Run simulation', exact: true})).toBeVisible();
  } finally {await context.close();}
});

test('learning stops playback and quizzes save progress with a runnable Try it action', async ({page}) => {
  await openWorkspace(page);
  await page.getByRole('button', {name: 'Run simulation', exact: true}).click();
  await page.getByRole('link', {name: 'Learning Center', exact: true}).click();
  await page.getByRole('link', {name: 'CPU Explorer', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Run simulation', exact: true})).toBeVisible();
  await page.goto('/#/learn/in-order');
  await page.getByRole('button', {name: 'Step', exact: true}).click();
  await expect(page.locator('.mini-processor-event')).not.toHaveText('Advance a cycle to fetch your first instruction.');
  await page.getByLabel('Program order', {exact: true}).check();
  await page.getByLabel('When a producer result is available before register writeback', {exact: true}).check();
  await page.getByRole('button', {name: 'Mark lesson complete', exact: true}).click(); await page.reload();
  await expect(page.getByRole('button', {name: 'Lesson completed', exact: true})).toBeVisible();
  await page.getByRole('button', {name: /Try it in Explorer/}).click();
  await expect(page).toHaveURL(/#\/explorer$/);
  await expect(page.getByRole('radio', {name: 'In-order', exact: true})).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('Example program')).toHaveValue('Data Forwarding');
});

test('blocked storage does not prevent assembly or execution', async ({page}) => {
  await page.addInitScript(() => {Object.defineProperty(window, 'localStorage', {get() {throw new Error('Storage unavailable');}});});
  await page.goto('/'); await page.getByRole('button', {name: 'Start exploring', exact: true}).click();
  await page.getByLabel('RISC-V assembly code').fill('ADDI x1,x0,7');
  await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
  await page.getByRole('button', {name: 'Finish', exact: true}).click();
  await page.getByRole('tab', {name: 'Registers', exact: true}).click();
  await expect(page.getByRole('button', {name: /^Register x1, value 7/})).toBeVisible();
});
