import { expect, test } from '@playwright/test';

test.beforeEach(({ page }) => {
  page.on('pageerror', error => console.error('Browser error:', error.message));
});

test('renders login and validates empty credentials', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SHAALINI TRADERS' })).toBeVisible();
  await page.getByText('Login', { exact: true }).click();
  await expect(page.getByText('Kindly enter the details')).toBeVisible();
  await expect(page.locator('#loader')).toHaveCount(0);
});

test('restores the existing session and opens navigation dropdowns', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('loginStatus', 'LoggedIn'));
  await page.goto('/');
  await page.locator('[data-target="dropdown1"]').hover();
  await expect(page.locator('#dropdown1')).toBeVisible();
  await expect(page.locator('#dropdown1').getByText('item', { exact: true })).toBeVisible();
});

test('loads the sales route and updates the replacement date picker and cheque modal', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('loginStatus', 'LoggedIn'));
  await page.goto('/transaction/sales');
  await expect(page.locator('#invoice-no')).toBeVisible();
  await expect(page.locator('#modal1')).toBeHidden();
  await expect(page.locator('#modal2')).toBeHidden();
  // Input fields must share a row despite Materialize 2's clear: both rule.
  const customer = await page.locator('#customer-name').boundingBox();
  const invoice = await page.locator('#invoice-no').boundingBox();
  expect(Math.abs(customer!.y - invoice!.y)).toBeLessThan(2);
  expect(invoice!.x).toBeGreaterThan(customer!.x + customer!.width);
  const date = page.locator('input.datepicker').first();
  await date.fill('12/11/2026');
  await date.dispatchEvent('change');
  await expect(date).toHaveValue('12/11/2026');
  await date.click();
  const day = page.locator('.datepicker-day-button[data-day="1"]').first();
  await expect(day).toBeVisible();
  await day.click();
  await expect(date).toHaveValue('01/11/2026');
  await page.locator('select[materialize="material_select"]').first().selectOption('2');
  await expect(page.locator('#modal1')).toBeVisible();
  await expect(page.locator('#bank-name')).toBeVisible();
  await expect(page.locator('#modal1')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal1')).toBeVisible();
  await page.locator('#modal1').getByText('Cancel', { exact: true }).click();
  await expect(page.locator('#modal1')).toBeHidden();
  // Reopening checks that the directive still handles subsequent actions.
  await page.locator('select[materialize="material_select"]').first().selectOption('1');
  await page.locator('select[materialize="material_select"]').first().selectOption('2');
  await expect(page.locator('#modal1')).toBeVisible();
});

test('opens and closes the purchase cheque dialog', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('loginStatus', 'LoggedIn'));
  await page.goto('/transaction/purchase');
  const modal = page.locator('#modal1');
  await expect(modal).toBeHidden();
  await page.locator('select[materialize="material_select"]').first().selectOption('2');
  await expect(modal).toHaveJSProperty('open', true);
  await modal.getByText('Cancel', { exact: true }).click();
  await expect(modal).toBeHidden();
});

test('animates input labels and aligns the lookup search icon', async ({ page }) => {
  await page.goto('/master/tax');
  const input = page.locator('#cgst_perc');
  const label = page.locator('label[for="cgst_perc"]');
  const labelTop = () => label.evaluate(element => parseFloat(getComputedStyle(element).top));
  await expect.poll(labelTop).toBeGreaterThan(10);
  await input.focus();
  await expect.poll(labelTop).toBeLessThan(10);
  await input.fill('5');
  await page.locator('h5').first().click();
  await expect.poll(labelTop).toBeLessThan(10);
  await input.fill('');
  await page.locator('h5').first().click();
  await expect.poll(labelTop).toBeGreaterThan(10);

  await page.getByText('View / Edit', { exact: true }).click();
  const search = page.locator('#item_icon_prefix');
  await expect(search).toBeVisible();
  const icon = await page.locator('.lov-search-field .prefix').boundingBox();
  const searchLabel = await page.locator('label[for="item_icon_prefix"]').boundingBox();
  expect(icon!.x + icon!.width).toBeLessThan(searchLabel!.x);
  const padding = await search.evaluate(element => parseFloat(getComputedStyle(element).paddingLeft));
  expect(padding).toBeGreaterThan(35);

  await page.locator('.modal-close-button').click();
  await page.locator('[data-target="dropdown1"]').hover();
  await expect(page.locator('#dropdown1')).toBeVisible();
  for (const item of await page.locator('#dropdown1 > li').all()) {
    await expect(item).toHaveCSS('border-bottom-width', '0px');
  }
});
