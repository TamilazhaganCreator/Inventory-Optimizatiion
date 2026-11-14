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
  { route: '/transaction/sales?salesId=1001', prefix: 'SALES', theme: 'monochrome' },
  { route: '/transaction/sales?salesId=1001', prefix: 'SALES', theme: 'color' },
  { route: '/transaction/purchase?purchaseId=2001', prefix: 'PURCHASE', theme: 'monochrome' },
]) {
  test(`exports the ${invoice.theme === 'color' ? 'color ' : ''}${invoice.prefix.toLowerCase()} invoice as a valid A4 PDF`, async ({ page }, testInfo) => {
    await login(page);
    await page.goto(invoice.route);
    await expect(page.locator('#invoice-no')).toHaveValue('E2E-INVOICE-1');
    await expect(page.locator('#loader')).toHaveCount(0);
    await page.evaluate(() => {
      const ng = (window as any).ng;
      const parent = ng.getComponent(document.querySelector('app-salestransaction, app-purchase'));
      parent.billShow = true;
      ng.applyChanges(parent);
    });
    if (invoice.theme === 'color') {
      // Exercise the public theme input without changing the shared default.
      await page.evaluate(() => {
        const ng = (window as any).ng;
        const parent = ng.getComponent(document.querySelector('app-salestransaction'));
        parent.billShow = true;
        ng.applyChanges(parent);
        const invoice = ng.getComponent(document.querySelector('app-yugan-invoice'));
        invoice.theme = 'color';
        ng.applyChanges(invoice);
      });
    }
    const invoicePage = page.locator('#bill .yugan-page');
    await expect(invoicePage).toHaveCount(1);
    await expect(invoicePage.getByRole('heading', { level: 1 })).toHaveText('YUGAN INDUSTRIES');
    await expect(invoicePage.locator('footer')).toHaveCount(0);
    await expect(invoicePage.getByRole('heading', { level: 1 })).toHaveCSS('font-weight', '700');
    await expect(invoicePage.locator('.inv-grand-total td')).toHaveText('236');
    await expect(invoicePage.locator('.inv-item-tax')).toHaveText('18%');
    await expect(invoicePage.locator('.inv-totals')).not.toContainText('%');
    await expect(invoicePage.locator('.inv-currency-note')).toHaveCount(0);
    await expect(invoicePage.locator('.inv-contact')).toHaveCSS('font-weight', '600');
    await expect(invoicePage.locator('.inv-signature > strong')).toHaveCSS('font-weight', '700');
    await expect(invoicePage.locator('.inv-bank-signature .inv-bank')).toBeVisible();
    await expect(invoicePage.locator('.inv-factory')).toContainText('(temporary)');
    await expect(invoicePage.locator('.inv-totals')).toContainText('CGST');
    await expect(invoicePage.locator('.inv-totals')).not.toContainText('IGST');
    // The exported PDF captures screen styles, so monochrome styling must
    // apply before printing as well as in the print stylesheet.
    const printColors = await invoicePage.evaluate(element => {
      const neutral = (color: string) => {
        const values = color.match(/[\d.]+/g)?.map(Number) || [];
        return values.length < 3 || values[3] === 0 || (values[0] === values[1] && values[1] === values[2]);
      };
      const colored = [...element.querySelectorAll('*')].filter(child => {
        if (!(child as HTMLElement).getClientRects().length) return false;
        const style = getComputedStyle(child);
        return !neutral(style.color) || !neutral(style.backgroundColor) ||
          (style.borderBottomStyle !== 'none' && parseFloat(style.borderBottomWidth) > 0 && !neutral(style.borderBottomColor));
      });
      const backgrounds = [...element.querySelectorAll('.inv-registration, .inv-items th, .inv-grand-total td, .inv-bank')]
        .map(child => getComputedStyle(child).backgroundColor);
      return { colored: colored.map(child => ({ tag: child.tagName, cls: child.className, color: getComputedStyle(child).color, bg: getComputedStyle(child).backgroundColor, border: getComputedStyle(child).borderBottomColor })), backgrounds };
    });
    if (invoice.theme === 'monochrome') {
      expect(printColors.colored).toEqual([]);
      const secondaryText = invoicePage.locator('.inv-label, .inv-devotion, .inv-items small, .inv-currency-note, .inv-terms p, .inv-bank th');
      for (const text of await secondaryText.all()) {
        await expect(text).toHaveCSS('color', 'rgb(0, 0, 0)');
      }
      expect(printColors.backgrounds.every(color => color === 'rgb(255, 255, 255)' || color === 'rgb(242, 242, 242)')).toBe(true);
    } else {
      await expect(invoicePage).toHaveClass(/inv-color/);
      await expect(invoicePage.locator('.inv-registration')).toHaveCSS('background-color', 'rgb(20, 44, 66)');
    }

    for (const text of ['Yugan Industries', '33AYLPT2287K1ZT', '8015402264',
      'yuganindustriesofficial@gmail.com', '50200119735353', 'HDFC0005555',
      'Test Stock Item', '33TEST0000A1Z5', 'Authorised signatory', 'State code']) {
      await expect(invoicePage).toContainText(text, { ignoreCase: true });
    }
    const measurements = await invoicePage.evaluate(element => {
      const mm = 96 / 25.4;
      const page = element.getBoundingClientRect();
      const lastSection = element.lastElementChild!.getBoundingClientRect();
      return {
        widthMm: page.width / mm, heightMm: page.height / mm,
        overflowY: element.scrollHeight - element.clientHeight,
        lastSectionBottom: lastSection.bottom - page.top,
        pageHeight: page.height,
        overflows: [...element.querySelectorAll('table, tr, td, th')].map(child => {
          const box = child.getBoundingClientRect();
          return Math.max(page.left - box.left, box.right - page.right);
        }),
      };
    });
    expect(measurements.widthMm).toBeCloseTo(210, 1);
    expect(measurements.heightMm).toBeCloseTo(297, 1);
    expect(measurements.overflowY).toBeLessThanOrEqual(1);
    expect(Math.max(...measurements.overflows)).toBeLessThan(1);
    expect(measurements.lastSectionBottom).toBeLessThan(measurements.pageHeight);
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('Print', { exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(new RegExp(`^${invoice.prefix}.*\\.pdf$`));
    const output = testInfo.outputPath(`${invoice.theme === 'color' ? 'color-' : ''}${invoice.prefix.toLowerCase()}-invoice.pdf`);
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


test('exports every item of a long invoice onto numbered A4 continuation pages', async ({ page, request }, testInfo) => {
  const base = 'http://127.0.0.1:8080/v1/projects/demo-inventory-upgrade/databases/(default)/documents';
  const headers = { Authorization: 'Bearer owner' };
  const sourceHeader = await (await request.get(`${base}/salesheader/1001`, { headers })).json();
  const sourceDetail = await (await request.get(`${base}/salesdetail/10011`, { headers })).json();
  await request.patch(`${base}/salesheader/1003`, { headers, data: { fields: {
    ...sourceHeader.fields, id: { integerValue: '1003' }, invoiceNo: { stringValue: 'E2E-MULTIPAGE-1' },
    netAmt: { integerValue: '4248' }, taxAmt: { integerValue: '648' }, paidAmt: { integerValue: '4248' },
  } } });
  for (let index = 0; index < 18; index++) {
    const name = index === 0 ? 'Long description structural component with precision engineered reinforced packing and corrosion resistant finish for industrial applications and replacement assemblies' : `Invoice item ${index + 1}`;
    await request.patch(`${base}/salesdetail/multipage-${index}`, { headers, data: { fields: {
      ...sourceDetail.fields, id: { integerValue: '1003' }, itemName: { stringValue: name },
    } } });
  }
  await login(page);
  await page.goto('/transaction/sales?salesId=1003');
  await expect(page.locator('#invoice-no')).toHaveValue('E2E-MULTIPAGE-1');
  await expect(page.locator('#loader')).toHaveCount(0);
  const downloading = page.waitForEvent('download');
  await page.getByText('Print', { exact: true }).click();
  await expect(page.locator('#bill .inv-item-row')).toHaveCount(18);
  await expect(page.locator('#bill .inv-grand-total td')).toHaveText('4,248');
  const pageCount = await page.locator('#bill .yugan-page').count();
  const overflow = await page.locator('#bill .yugan-page').evaluateAll(pages => pages.map(page => {
    const table = page.querySelector('.inv-items')!.getBoundingClientRect();
    const area = page.querySelector('.inv-items-area')!.getBoundingClientRect();
    return Math.max(table.bottom - area.bottom, page.scrollHeight - page.clientHeight);
  }));
  expect(overflow.every(pixels => pixels <= 1), `Page overflow in pixels: ${overflow}`).toBe(true);
  expect(pageCount).toBeGreaterThan(1);
  const serials = await page.locator('#bill .inv-line-number').allTextContents();
  expect(serials.map(value => Number(value))).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
  const output = testInfo.outputPath('multipage-sales-invoice.pdf');
  await (await downloading).saveAs(output);
  const pdf = await readFile(output);
  expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length).toBe(pageCount);
  await testInfo.attach('Multipage invoice', { path: output, contentType: 'application/pdf' });
});

test('exports a newly entered sales bill with live customer, item and amount values', async ({ page, request }, testInfo) => {
  await login(page);
  await page.goto('/transaction/sales');
  // Keep the preview mounted while the form edits its existing model objects.
  await page.evaluate(() => {
    const ng = (window as any).ng;
    const parent = ng.getComponent(document.querySelector('app-salestransaction'));
    parent.billShow = true;
    ng.applyChanges(parent);
  });
  await page.locator('#customer-name').press('Enter');
  await page.locator('.item-codes-modal').getByText('Emulator Customer', { exact: true }).click();
  await page.locator('#invoice-no').fill('LIVE-SALES-TEST');
  await page.locator('#dispatch-details').fill('Transport - Test Logistics / TN01 AB1234');
  await page.locator('select[materialize="material_select"]').selectOption('1');
  const inputs = page.locator('.table-dtl').first().locator('input.input-design');
  await inputs.nth(0).press('Enter');
  await page.locator('.item-codes-modal').getByText('Test Stock Item', { exact: true }).click();
  await inputs.nth(2).fill('2');
  await inputs.nth(2).blur();
  await page.locator('#paidAmt').fill('236');
  const invoice = page.locator('#bill');
  await expect(invoice.locator('.inv-party h2')).toHaveText('Emulator Customer');
  await expect(invoice.locator('.inv-item-name')).toHaveText('Test Stock Item');
  await expect(invoice.locator('.inv-item-amount')).toHaveText('200');
  await expect(invoice.locator('.inv-grand-total td')).toHaveText('236');
  await expect(invoice.locator('.inv-contact-phone')).toHaveCSS('letter-spacing', '0.5px');
  await expect(invoice.locator('.inv-dispatch')).toContainText('Transport - Test Logistics / TN01 AB1234');
  for (const row of await invoice.locator('.inv-bank tr').all()) {
    await expect(row).toHaveCSS('border-bottom-style', 'none');
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Submit', { exact: true }).click();
  await page.locator('#modal2').getByRole('button', { name: 'Yes', exact: true }).click();
  const download = await downloadPromise;
  const output = testInfo.outputPath('live-sales-invoice.pdf');
  await download.saveAs(output);
  const pdf = await readFile(output);
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(5000);
  await expect(page.getByText('Saved successfully', { exact: true })).toBeVisible();
  await testInfo.attach('New sales invoice', { path: output, contentType: 'application/pdf' });
  const response = await request.get('http://127.0.0.1:8080/v1/projects/demo-inventory-upgrade/databases/(default)/documents/salesheader', {
    headers: { Authorization: 'Bearer owner' },
  });
  expect(response.ok()).toBe(true);
  const saved = (await response.json()).documents.find((document: any) => document.fields.invoiceNo.stringValue === 'LIVE-SALES-TEST');
  expect(saved.fields.dispatchDetails.stringValue).toBe('Transport - Test Logistics / TN01 AB1234');
  await page.goto(`/transaction/sales?salesId=${saved.fields.id.integerValue}`);
  await expect(page.locator('#dispatch-details')).toHaveValue('Transport - Test Logistics / TN01 AB1234');
  await expect(page.locator('#dispatch-details')).toHaveAttribute('readonly');
  const reprintPromise = page.waitForEvent('download');
  await page.getByText('Print', { exact: true }).click();
  await expect(page.locator('#bill .inv-dispatch')).toContainText('Transport - Test Logistics / TN01 AB1234');
  await reprintPromise;
});
