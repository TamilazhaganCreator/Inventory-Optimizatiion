import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const browserErrors = new WeakMap<Page, string[]>();
const remoteFirebase = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  browserErrors.set(page, []);
  remoteFirebase.set(page, []);
  page.on('pageerror', error => browserErrors.get(page)!.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.hostname.endsWith('googleapis.com')) remoteFirebase.get(page)!.push(request.url());
  });
});
test.afterEach(({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
  expect(remoteFirebase.get(page)).toEqual([]);
});

async function login(page: Page) {
  await page.goto('/');
  await page.locator('#user').fill('inventory-e2e');
  await page.locator('#pwd').fill('local-emulator-only-password');
  await page.getByText('Login', { exact: true }).click();
  await expect(page.getByText('Login success', { exact: true })).toBeVisible();
  await expect(page.locator('#loader')).toHaveCount(0);
}

test('authenticates with the real SDK, rejects invalid credentials, and signs out', async ({ page }) => {
  await page.goto('/');
  await page.locator('#user').fill('inventory-e2e');
  await page.locator('#pwd').fill('incorrect-password');
  await page.getByText('Login', { exact: true }).click();
  await expect(page.getByText('Kindly enter the valid credentials')).toBeVisible();
  await page.locator('#pwd').fill('local-emulator-only-password');
  await page.getByText('Login', { exact: true }).click();
  await expect(page.getByText('Login success', { exact: true })).toBeVisible();
  await page.getByText('Logout', { exact: true }).click();
  await expect(page.locator('#user')).toBeVisible();
  await expect(page.getByText('Logout success', { exact: true })).toBeVisible();
});

test('saves a payment and updates the customer balance through Firestore', async ({ page, request }) => {
  await login(page);
  await page.goto('/transaction/payments');
  await page.locator('select[materialize="material_select"]').nth(0).selectOption('customer');
  await page.locator('#name').press('Enter');
  await page.locator('.item-codes-modal').getByText('Emulator Customer', { exact: true }).click();
  await page.locator('#date').fill('12/11/2026');
  await page.locator('#date').dispatchEvent('change');
  await page.locator('select[materialize="material_select"]').nth(1).selectOption('cash');
  await page.locator('#note').fill('Dependency migration integration test');
  await page.locator('#amt').fill('125');
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('Payment added successfully')).toBeVisible();
  const base = 'http://127.0.0.1:8080/v1/projects/demo-inventory-upgrade/databases/(default)/documents';
  const payment = await request.get(`${base}/customerpayments/1`, { headers: { Authorization: 'Bearer owner' } });
  expect(payment.ok()).toBe(true);
  expect((await payment.json()).fields.amount.integerValue).toBe('125');
  const customer = await request.get(`${base}/customermaster/1`, { headers: { Authorization: 'Bearer owner' } });
  expect((await customer.json()).fields.amount.integerValue).toBe('125');
  await page.goto('/report/customer');
  await expect(page.locator('#loader')).toHaveCount(0);
  await expect(page.locator('app-report-grid').getByText('Emulator Customer', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Total Amount: 125', { exact: true })).toBeVisible();
});

for (const invoice of [
  { route: '/transaction/sales?salesId=1001', prefix: 'SALES' },
  { route: '/transaction/purchase?purchaseId=2001', prefix: 'PURCHASE' },
]) {
  test(`exports the ${invoice.prefix.toLowerCase()} invoice as a valid A4 PDF`, async ({ page }, testInfo) => {
    await login(page);
    await page.goto(invoice.route);
    await expect(page.locator('#invoice-no')).toHaveValue('E2E-INVOICE-1');
    await expect(page.locator('#loader')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('Print', { exact: true }).click();
    const totals = page.locator('#bill .bill-table-footer');
    await expect(totals.locator('.total').last()).toHaveText('236');
    const unclipped = await totals.evaluate(element => {
      const value = element.querySelector('.total:last-child')!;
      return value.getBoundingClientRect().bottom <= element.getBoundingClientRect().bottom;
    });
    expect(unclipped).toBe(true);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(new RegExp(`^${invoice.prefix}.*\\.pdf$`));
    const output = testInfo.outputPath(`${invoice.prefix.toLowerCase()}-invoice.pdf`);
    await download.saveAs(output);
    const pdf = await readFile(output);
    expect(pdf.length).toBeGreaterThan(5000);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const box = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf.toString('latin1'));
    expect(box).not.toBeNull();
    expect(Number(box![1])).toBeCloseTo(595.28, 2);
    expect(Number(box![2])).toBeCloseTo(841.89, 2);
    await expect(page.locator('#loader')).toHaveCount(0);
    await testInfo.attach(`${invoice.prefix} invoice`, { path: output, contentType: 'application/pdf' });
  });
}

for (const report of [
  { path: 'sales', idName: 'salesId', firstId: '1001', secondId: '1002', secondInvoice: 'ZZ-SECOND-SALE' },
  { path: 'purchase', idName: 'purchaseId', firstId: '2001', secondId: '2002', secondInvoice: 'ZZ-SECOND-PURCHASE' },
]) {
  test(`${report.path} View buttons follow the actual row after sorting and filtering`, async ({ page }) => {
    await login(page);
    await page.goto(`/report/${report.path}`);
    const grid = page.locator('app-report-grid');
    await expect(grid.locator('.ag-row')).toHaveCount(2);
    const invoiceHeader = grid.locator('.ag-header-cell[col-id="invoiceNo"] .ag-header-cell-label');
    await invoiceHeader.click();
    await invoiceHeader.click();
    await expect(grid.locator('[row-index="0"] [col-id="invoiceNo"]')).toHaveText(report.secondInvoice);
    await expect(grid.locator('[row-index="0"] [col-id="rowNumber"]')).toHaveText('1');
    await page.screenshot({ path: test.info().outputPath('sorted-report.png'), fullPage: true });
    await grid.locator('[row-index="0"]').getByRole('button', { name: 'View', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/transaction/${report.path}\\?${report.idName}=${report.secondId}$`));
    await expect(page.locator('#invoice-no')).toHaveValue(report.secondInvoice);

    await page.goto(`/report/${report.path}`);
    const filter = grid.locator('.ag-floating-filter[col-id="invoiceNo"] input');
    await filter.fill('E2E-INVOICE-1');
    await expect(grid.locator('.ag-row')).toHaveCount(1);
    // Preserve the old right-click View action as well as the visible button.
    await grid.locator('[row-index="0"] [col-id="invoiceNo"]').click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/transaction/${report.path}\\?${report.idName}=${report.firstId}$`));
    await expect(page.locator('#invoice-no')).toHaveValue('E2E-INVOICE-1');
  });
}

test('person-wise View keeps payment records on the report and opens invoices', async ({ page }) => {
  await login(page);
  await page.goto('/report/person-wise');
  await page.locator('.collapsible-header').click();
  await page.locator('select[materialize="material_select"]').selectOption('customer');
  for (const id of ['#start-date', '#end-date']) {
    await page.locator(id).fill('12/11/2026');
    await page.locator(id).dispatchEvent('change');
  }
  await page.locator('#name').press('Enter');
  await page.locator('.item-codes-modal').getByText('Emulator Customer', { exact: true }).click();
  await page.getByText('APPLY', { exact: true }).click();
  const grid = page.locator('app-report-grid');
  const paymentRow = grid.locator('.ag-row').filter({ hasText: 'PAYMENT - Seeded payment' });
  await expect(paymentRow).toBeVisible();
  await paymentRow.getByRole('button', { name: 'View', exact: true }).click();
  await expect(page.getByText("It's a payment record", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/report\/person-wise$/);
  const invoiceRow = grid.locator('.ag-row').filter({ hasText: 'E2E-INVOICE-1' });
  await invoiceRow.getByRole('button', { name: 'View', exact: true }).click();
  await expect(page).toHaveURL(/\/transaction\/sales\?salesId=1001$/);
});

test('person-wise supplier View opens the purchase invoice', async ({ page }) => {
  await login(page);
  await page.goto('/report/person-wise');
  await page.locator('.collapsible-header').click();
  await page.locator('select[materialize="material_select"]').selectOption('supplier');
  for (const id of ['#start-date', '#end-date']) {
    await page.locator(id).fill('12/11/2026');
    await page.locator(id).dispatchEvent('change');
  }
  await page.locator('#name').press('Enter');
  await page.locator('.item-codes-modal').getByText('Emulator Supplier', { exact: true }).click();
  await page.getByText('APPLY', { exact: true }).click();
  const grid = page.locator('app-report-grid');
  await expect(grid.locator('.ag-row [col-id="customerName"]')).toHaveText('Emulator Supplier');
  await grid.getByRole('button', { name: 'View', exact: true }).click();
  await expect(page).toHaveURL(/\/transaction\/purchase\?purchaseId=2001$/);
});
