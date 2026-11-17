import {test, expect} from '@playwright/test';
import {openWorkspace, noPageOverflow} from './helpers';
import {assemble} from '../../src/engine/assembler';
import {simulate} from '../../src/engine/simulator';
import {EXAMPLES} from '../../src/engine/programs';
import {DEFAULT_CONFIG} from '../../src/cpu/ooo/engine';

const snapshots = simulate(assemble(EXAMPLES['Out-of-Order Scheduling']), 'ooo', DEFAULT_CONFIG).oooSnapshots!;
const hex = (n: number) => `0x${(n >>> 0).toString(16).padStart(8, '0')}`;
for (const mobile of [false, true]) {
  test(`register inspector follows actual snapshot mappings and values (${mobile ? 'mobile' : 'desktop'})`, async ({page}) => {
    if (mobile) await page.setViewportSize({width: 390, height: 844});
    await openWorkspace(page);
    await page.getByRole('slider', {name: 'Clock history'}).fill('6');
    if (mobile) await page.getByRole('button', {name: /Open inspector/}).click();
    const inspector = page.getByRole(mobile ? 'dialog' : 'complementary', {name: 'CPU inspector', exact: true});
    await inspector.getByRole('tab', {name: 'Registers', exact: true}).click();
    await inspector.getByRole('tab', {name: 'Physical', exact: true}).click();
    const s = snapshots[6];
    const physical = inspector.getByRole('table', {name: 'Physical register values and allocation'});
    await expect(physical.locator('tbody tr')).toHaveCount(DEFAULT_CONFIG.physicalRegisters);
    for (const [index, entry] of s.physical.entries()) {
      await expect(physical.locator('tbody tr').nth(index).locator('td')).toHaveText([
        `p${index}`, hex(entry.value), entry.ready ? 'Yes' : 'Waiting',
        s.freeList.includes(index) ? 'Free' : s.committedMap.includes(index) ? 'Committed' : 'Speculative',
      ]);
    }
    await inspector.getByRole('tab', {name: 'RAT', exact: true}).click();
    const rat = inspector.getByRole('table', {name: 'Architectural and speculative register mappings'});
    await expect(rat.locator('tbody tr')).toHaveCount(32);
    for (const [register, physical] of s.rat.entries()) {
      await expect(rat.locator('tbody tr').nth(register).locator('td')).toHaveText([
        `x${register}`, `p${s.committedMap[register]}`, `p${physical}`,
        s.physical[physical].ready ? hex(s.physical[physical].value) : 'Pending', s.physical[physical].ready ? 'Yes' : 'Waiting',
      ]);
    }
    if (mobile) await page.keyboard.press('Escape');
    else {
      await page.getByRole('button', {name: 'Reset simulation', exact: true}).click();
      await expect(rat.locator('tbody tr').nth(3).locator('td')).toHaveText(['x3', 'p3', 'p3', hex(0), 'Yes']);
      await page.getByRole('radio', {name: 'In-order', exact: true}).click();
      await expect(inspector.getByText(/Physical registers and the RAT are available in Out-of-order mode/)).toBeVisible();
      await inspector.getByRole('tab', {name: 'Architectural', exact: true}).click();
      await expect(inspector.getByRole('button', {name: /^Register x0, value 0/})).toBeVisible();
    }
    await noPageOverflow(page);
  });
}
