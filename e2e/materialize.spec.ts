import { expect, test } from '@playwright/test';

const routes = [
  '/master/customer', '/master/supplier', '/master/item', '/master/tax',
  '/transaction/sales', '/transaction/purchase', '/transaction/payments',
  '/report/sales', '/report/purchase', '/report/items', '/report/customer',
  '/report/supplier', '/report/payments', '/report/person-wise',
];

for (const width of [1440, 1024]) {
  for (const route of routes) {
    test(`Materialize controls ${route} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.input-field input').first()).toBeAttached();
      // Audit controls independently of pending remote Firebase requests.
      // This fixture does not change the application's loading behavior.
      await page.addStyleTag({ content: '#loader { display: none !important; }' });
      const filters = page.locator('.collapsible-header');
      if (await filters.count()) {
        await filters.click();
        await expect(page.locator('.collapsible-body')).toBeVisible();
      }
      const inputs = page.locator('.input-field input:visible, input.input-design:visible');
      expect(await inputs.count()).toBeGreaterThan(0);
      for (const input of await inputs.all()) {
        if (!(await input.isEnabled())) continue;
        await input.focus();
        await expect(input).toBeFocused();
        await expect(input).toHaveCSS('outline-style', 'none');
        const hasLabel = await input.evaluate(element => Boolean(element.parentElement?.querySelector('label')));
        if (hasLabel) {
          await expect(input).toHaveCSS('border-top-width', '0px');
          await expect(input).toHaveCSS('border-left-width', '0px');
          if (await input.getAttribute('readonly') === null) {
            await expect(input).toHaveCSS('border-bottom-color', 'rgb(38, 166, 154)');
          }
        }
        const fits = await input.evaluate(element => {
          const box = element.getBoundingClientRect();
          const parent = element.parentElement!.getBoundingClientRect();
          return box.left >= parent.left - 1 && box.right <= parent.right + 1;
        });
        expect(fits).toBe(true);
      }
      for (const select of await page.locator('select[materialize="material_select"]:visible').all()) {
        await expect(select.locator('option:checked')).not.toHaveCount(0);
      }
      await expect(page.locator('.datepicker-container:visible')).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, animations: 'disabled', timeout: 5000 });
    });
  }
}

test('Materialize lookup, loader, validation, and modal footer states', async ({ page }, testInfo) => {
  await page.goto('/master/tax');
  const input = page.locator('#cgst_perc');
  await input.focus();
  await page.screenshot({ path: testInfo.outputPath('focused-input.png') });
  await input.evaluate(element => element.classList.add('invalid'));
  await expect(input).toHaveCSS('border-bottom-color', 'rgb(244, 67, 54)');
  await input.evaluate(element => { element.classList.remove('invalid'); element.classList.add('valid'); });
  await expect(input).toHaveCSS('border-bottom-color', 'rgb(76, 175, 80)');
  await page.getByText('View / Edit', { exact: true }).click();
  await page.locator('#item_icon_prefix').focus();
  await expect(page.locator('#item_icon_prefix')).toBeFocused();
  await expect(page.locator('#item_icon_prefix')).toHaveCSS('outline-style', 'none');
  const loader = page.locator('.preloader-wrapper');
  if (await loader.count()) {
    const geometry = await loader.evaluate(element => {
      const layer = element.querySelector('.spinner-layer')!;
      const clip = element.querySelector('.circle-clipper')!;
      return {
        wrapper: element.clientWidth,
        layer: layer.clientWidth,
        clip: clip.clientWidth,
      };
    });
    expect(geometry.wrapper).toBe(64);
    expect(geometry.layer).toBe(64);
    expect(geometry.clip).toBe(32);
  }
  await page.screenshot({ path: testInfo.outputPath('lookup.png') });
  await page.locator('.modal-close-button').click();
  await page.goto('/transaction/purchase');
  const date = page.locator('input.datepicker').first();
  await date.click();
  await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.datepicker-container:visible')).toHaveCount(0);
  await page.locator('select[materialize="material_select"]').first().selectOption('2');
  const modal = page.locator('#modal1');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.btn-flat').first()).toHaveCSS('height', '40px');
  await expect(modal.locator('.btn-flat').first()).toHaveCSS('align-items', 'center');
  await modal.locator('#bank-name').focus();
  await expect(modal.locator('#bank-name')).toHaveCSS('outline-style', 'none');
  await page.screenshot({ path: testInfo.outputPath('cheque-dialog.png') });
});
