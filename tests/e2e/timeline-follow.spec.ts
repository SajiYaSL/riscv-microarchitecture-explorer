import {test, expect} from '@playwright/test';
import {openWorkspace} from './helpers';

const source = `ADDI x1,x0,10
ADDI x2,x0,13
ADDI x3,x0,17
ADDI x5,x0,1
loop: LW x4,0(x0)
MUL x4,x4,x3
ADD x6,x4,x5
ADDI x5,x5,1
ADDI x4,x2,5
ADDI x1,x1,-1
BNE x1,x0,loop
NOP`;

for (const mode of ['Out-of-order', 'In-order']) {
  test(`${mode} timeline follows loop execution and supports manual review`, async ({page}) => {
    await openWorkspace(page);
    await page.getByRole('textbox', {name: 'RISC-V assembly code'}).fill(source);
    await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
    await page.getByRole('radio', {name: mode, exact: true}).click();
    await page.getByRole('tab', {name: 'Timeline', exact: true}).click();
    const firstRow = page.locator('.lifecycle-grid .instr-label.text-button').first();
    const follow = page.getByRole('button', {name: 'Follow current cycle', exact: true});
    const jump = async (clock: string) => {
      await page.getByRole('spinbutton', {name: 'Jump to cycle', exact: true}).fill(clock);
      await page.locator('.timeline-jump').getByRole('button', {name: 'Go', exact: true}).click();
    };
    await expect(firstRow).toHaveAttribute('aria-label', /^Inspect instruction I1:/);
    await jump('29');
    await expect(firstRow).not.toHaveAttribute('aria-label', /^Inspect instruction I1:/);
    await expect(page.locator('.timecell.playhead:not(.empty)').first()).toBeVisible();
    await page.getByRole('button', {name: 'Previous instructions', exact: true}).click();
    await expect(firstRow).toHaveAttribute('aria-label', /^Inspect instruction I1:/);
    await page.getByRole('button', {name: 'Next cycle', exact: true}).click();
    await expect(firstRow).toHaveAttribute('aria-label', /^Inspect instruction I1:/);
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    await follow.click();
    await expect(firstRow).not.toHaveAttribute('aria-label', /^Inspect instruction I1:/);
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await jump('5');
    await expect(firstRow).toHaveAttribute('aria-label', /^Inspect instruction I1:/);
    await follow.click();
    await page.getByRole('button', {name: 'Finish', exact: true}).click();
    await expect(page.locator('.timecell.playhead:not(.empty)').first()).toBeVisible();
    await page.getByRole('button', {name: 'Reset simulation', exact: true}).click();
    await expect(firstRow).toHaveAttribute('aria-label', /^Inspect instruction I1:/);
  });
}
