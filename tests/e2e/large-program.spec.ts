import {test, expect} from '@playwright/test';
import {openWorkspace} from './helpers';

test('large loops complete and verify through the workspace', async ({page}) => {
  await openWorkspace(page);
  await page.getByRole('textbox', {name: 'RISC-V assembly code'}).fill('ADDI x1,x0,500\nloop: ADDI x2,x2,1\nADDI x1,x1,-1\nBNE x1,x0,loop');
  await page.getByRole('button', {name: 'Assemble / load', exact: true}).click();
  for (const mode of ['Out-of-order', 'In-order']) {
    await page.getByRole('radio', {name: mode, exact: true}).click();
    await page.getByRole('button', {name: 'Finish', exact: true}).click();
    const inspector = page.getByRole('complementary', {name: 'CPU inspector'});
    await inspector.getByRole('tab', {name: 'Registers', exact: true}).click();
    await expect(inspector.getByRole('button', {name: 'Register x2, value 500', exact: true})).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.getByRole('link', {name: 'Performance Lab', exact: true}).click();
  await expect(page.getByText('Verified against interpreter', {exact: true})).toBeVisible();
});
