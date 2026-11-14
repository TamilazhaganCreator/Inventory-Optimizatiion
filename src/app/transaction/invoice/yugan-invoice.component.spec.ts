import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NumberToWordsPipe } from '../../utils/number-to-words.Pipe';
import { YuganInvoiceComponent } from './yugan-invoice.component';

describe('Yugan invoice', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CommonModule], declarations: [YuganInvoiceComponent, NumberToWordsPipe] }).compileComponents();
  });
  it('retains every line and serial number across continuation pages', async () => {
    const fixture = TestBed.createComponent(YuganInvoiceComponent);
    fixture.componentRef.setInput('header', { customerName: 'Example Customer', customerAddress: 'Chennai', customerGSTNo: '33TEST0000A1Z5', netAmt: 4248, taxAmt: 648, otherCharges: 0, invoiceNo: 'TEST-01', invoiceDate: new Date(2026, 10, 12), paymentType: 1, paidAmt: 4248 });
    fixture.componentRef.setInput('items', Array.from({ length: 18 }, (_, index) => ({ itemName: `Item ${index + 1}`, quantity: 2, unit: 1, totalUnit: 2, hsncode: '1001', sp: 100, netAmt: 236, cgstAmt: 18, sgstAmt: 18, cgst_perc: 9, sgst_perc: 9 })));
    fixture.detectChanges();
    const document = fixture.nativeElement as HTMLElement;
    expect(document.querySelectorAll('.yugan-page').length).toBeGreaterThan(1);
    expect(document.querySelectorAll('.inv-color').length).toBe(0);
    fixture.componentRef.setInput('theme', 'color');
    fixture.detectChanges();
    expect(document.querySelectorAll('.inv-color').length).toBe(document.querySelectorAll('.yugan-page').length);
    expect(document.querySelectorAll('.inv-item-row').length).toBe(18);
    expect([...document.querySelectorAll('.inv-line-number')].map(cell => Number(cell.textContent))).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
    expect(document.querySelectorAll('.inv-grand-total').length).toBe(1);
    expect([...document.querySelectorAll('.inv-item-tax')].map(cell => cell.textContent)).toEqual(Array(18).fill('18%'));
    expect(document.querySelector('.inv-totals')?.textContent).not.toContain('%');
    expect(document.querySelector('.inv-currency-note')).toBeNull();
    for (const text of ['33AYLPT2287K1ZT', '50200119735353', 'HDFC0005555', 'Example Customer', '33TEST0000A1Z5']) {
      expect(document.textContent).toContain(text);
    }
  });

  it('refreshes a new sales bill when the form updates the existing header and items in place', async () => {
    const fixture = TestBed.createComponent(YuganInvoiceComponent);
    fixture.componentRef.setInput('header', { invoiceNo: 'LIVE-1', invoiceDate: new Date(2026, 10, 12), netAmt: 0, taxAmt: 0, otherCharges: 0 });
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.inv-item-row').length).toBe(0);
    const host: any = fixture.componentInstance;
    host.header.customerName = 'Live Customer';
    host.header.netAmt = 118;
    host.header.taxAmt = 18;
    host.items.push({ itemName: 'Live Stock Item', totalUnit: 1, quantity: 1, unit: 1, sp: 100, netAmt: 118, cgstAmt: 9, sgstAmt: 9 });
    fixture.detectChanges();
    const invoice = fixture.nativeElement as HTMLElement;
    expect(invoice.querySelector('.inv-party h2')?.textContent).toBe('Live Customer');
    expect(invoice.querySelectorAll('.inv-item-row').length).toBe(1);
    expect(invoice.querySelector('.inv-item-name')?.textContent).toBe('Live Stock Item');
    expect(invoice.querySelector('.inv-grand-total td')?.textContent).toBe('118');
    host.items[0].sp = 200;
    host.items[0].netAmt = 236;
    host.items[0].cgstAmt = host.items[0].sgstAmt = 18;
    host.header.netAmt = 236;
    fixture.detectChanges();
    expect(invoice.querySelector('.inv-item-amount')?.textContent).toBe('200');
    expect(invoice.querySelector('.inv-grand-total td')?.textContent).toBe('236');
  });

  it('shows the stored product tax rate and supports legacy local, interstate and cess rates', () => {
    const component = new YuganInvoiceComponent();
    expect(component.itemTaxRate({ taxPercentage: 0, cgst_perc: 9, sgst_perc: 9 } as any)).toBe(0);
    expect(component.itemTaxRate({ taxPercentage: 5 } as any)).toBe(5);
    expect(component.itemTaxRate({ cgst_perc: 9, sgst_perc: 9, igst_perc: 18 } as any)).toBe(18);
    expect(component.itemTaxRate({ igstAmt: 18, igst_perc: 18, cgst_perc: 9, sgst_perc: 9 } as any)).toBe(18);
    expect(component.itemTaxRate({ cgst_perc: 9, sgst_perc: 9, cess_perc: 2 } as any)).toBe(20);
  });

  it('reconciles all printed amounts to a whole-rupee invoice total', () => {
    const component = new YuganInvoiceComponent();
    component.header = { netAmt: 237.16, taxAmt: 36.18, otherCharges: 0, paidAmt: 237.16 } as any;
    component.items = Array.from({ length: 2 }, (_, index) => ({ itemName: `Item ${index}`, netAmt: 118.58, cgstAmt: 9.045, sgstAmt: 9.045 })) as any;
    expect(component.roundedTotal).toBe(237);
    expect(component.subtotal).toBe(200);
    expect(component.roundOff).toBe(1);
    expect(component.balance).toBe(0);
    expect(component.subtotal + component.taxes.reduce((sum, tax) => sum + tax.amount, 0) + component.roundOff).toBe(component.roundedTotal);
  });

  it('keeps mixed tax rates and cess visible without changing the stored total', () => {
    const component = new YuganInvoiceComponent();
    component.header = { netAmt: 216, taxAmt: 16, otherCharges: 0 } as any;
    component.items = [
      { itemName: 'First', netAmt: 107, cgstAmt: 5, cessAmt: 2, cgst_perc: 5, cess_perc: 2 },
      { itemName: 'Second', netAmt: 109, cgstAmt: 9, cgst_perc: 9 },
    ] as any;
    expect(component.taxes.find(tax => tax.label === 'CGST')).toEqual({ label: 'CGST', rates: '5%, 9%', amount: 14 });
    expect(component.taxes.find(tax => tax.label === 'CESS')?.amount).toBe(2);
    expect(component.itemAmount(component.items[0])).toBe(100);
    expect(component.subtotal).toBe(200);
    expect(component.header.netAmt).toBe(216);
  });
  it('prints CGST and SGST for local invoices without unused IGST or cess rows', () => {
    const component = new YuganInvoiceComponent();
    component.header = { customerLocation: 0 } as any;
    component.items = [{ itemName: 'Local goods', cgstAmt: 9, sgstAmt: 9, igstAmt: 0, cessAmt: 0, cgst_perc: 9, sgst_perc: 9, igst_perc: 18 }] as any;
    expect(component.taxes.map(tax => tax.label)).toEqual(['CGST', 'SGST']);
    expect(component.placeOfSupply).toBe('Tamil Nadu (33)');
  });

  it('prints IGST for interstate invoices and retains the recorded destination', () => {
    const component = new YuganInvoiceComponent();
    component.header = { customerLocation: 1, placeOfSupply: 'Karnataka (29)' } as any;
    component.items = [{ itemName: 'Interstate goods', cgstAmt: 0, sgstAmt: 0, igstAmt: 18, cgst_perc: 9, sgst_perc: 9, igst_perc: 18 }] as any;
    expect(component.taxes.map(tax => tax.label)).toEqual(['IGST']);
    expect(component.placeOfSupply).toBe('Karnataka (29)');
  });

});
