import { ChangeDetectionStrategy, Component, DoCheck, Input } from '@angular/core';
import { InvoiceTheme, YUGAN_INVOICE_CONFIG } from './invoice.config';
import { PurchaseDetailModel, PurchaseHeaderModel, SalesDetailModel, SalesHeaderModel } from '../transaction.model';

type InvoiceHeader = (SalesHeaderModel | PurchaseHeaderModel) & { placeOfSupply?: string };
type InvoiceItem = SalesDetailModel | PurchaseDetailModel;
interface InvoiceLine { item: InvoiceItem; number: number; }

@Component({
  selector: 'app-yugan-invoice',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './yugan-invoice.component.html',
  styleUrls: ['./yugan-invoice.component.css'],
})
export class YuganInvoiceComponent implements DoCheck {
  @Input() header: InvoiceHeader;
  @Input() items: InvoiceItem[] = [];
  @Input() theme: InvoiceTheme = YUGAN_INVOICE_CONFIG.theme;
  @Input() kind: 'sales' | 'purchase' = 'sales';
  readonly config = YUGAN_INVOICE_CONFIG;
  pages: InvoiceLine[][] = [[]];

  private paginatedItems: InvoiceItem[] = [];
  private paginatedNames: string[] = [];

  ngDoCheck() {
    // Transaction forms update their existing models in place.
    // Rebuild pagination when rows or names change; numeric edits use the live row objects.
    const items = this.validItems;
    if (items.length === this.paginatedItems.length && items.every((item, index) =>
      item === this.paginatedItems[index] && item.itemName === this.paginatedNames[index])) return;
    this.paginatedItems = items;
    this.paginatedNames = items.map(item => item.itemName);
    // Final pages reserve room for totals, bank details and legal terms.
    // Earlier pages have a larger item budget and carry continuation notices.
    const remaining = items.map((item, index) => ({ item, number: index + 1 }));
    const cost = (line: InvoiceLine) => 1 + Math.max(0, Math.ceil(line.item.itemName.length / 38) - 1) * .35;
    const pages: InvoiceLine[][] = [];
    while (remaining.length) {
      const weight = remaining.reduce((sum, line) => sum + cost(line), 0);
      if (weight <= 4) { pages.push(remaining.splice(0)); break; }
      const budget = weight <= 10 ? Math.max(1, weight - 4) : 10;
      const page: InvoiceLine[] = [];
      let used = 0;
      while (remaining.length && (!page.length || used + cost(remaining[0]) <= budget)) {
        const line = remaining.shift()!;
        page.push(line);
        used += cost(line);
      }
      pages.push(page);
    }
    this.pages = pages.length ? pages : [[]];
  }

  get validItems() { return (this.items || []).filter(item => item.itemName); }
  get title() { return this.kind === 'sales' ? 'Sales invoice' : 'Purchase invoice'; }
  get partyName() { return this.kind === 'sales' ? (this.header as SalesHeaderModel).customerName : (this.header as PurchaseHeaderModel).supplierName; }
  get partyAddress() { return this.kind === 'sales' ? (this.header as SalesHeaderModel).customerAddress : (this.header as PurchaseHeaderModel).supplierAddress; }
  get partyGstin() { return this.kind === 'sales' ? (this.header as SalesHeaderModel).customerGSTNo : (this.header as PurchaseHeaderModel).supplierGSTNo; }
  get dispatchDetails() { return this.kind === 'sales' ? (this.header as SalesHeaderModel).dispatchDetails?.trim() || '—' : '—'; }
  get paymentType() { return ['Credit', 'Cash', 'Cheque'][Number(this.header.paymentType)] || '—'; }
  get subtotal() { return this.validItems.reduce((sum, item) => sum + this.itemAmount(item), 0); }
  get roundedTotal() { return this.round(Number(this.header.netAmt || 0)); }
  get roundOff() { return this.roundedTotal - this.subtotal - this.taxes.reduce((sum, tax) => sum + tax.amount, 0) - this.round(Number(this.header.otherCharges || 0)); }
  get balance() { return this.roundedTotal - this.round(Number(this.header.paidAmt || 0)); }
  get taxes() {
    const rows = ['cgst', 'sgst', 'igst', 'cess'].map(tax => {
      const rates = [...new Set(this.validItems.map(item => Number(item[`${tax}_perc`] || 0)))];
      return {
        label: tax.toUpperCase(),
        rawAmount: this.validItems.reduce((sum, item) => sum + Number(item[`${tax}Amt`] || 0), 0),
        rates: rates.map(rate => `${rate}%`).join(', '),
        amount: this.round(this.validItems.reduce((sum, item) => sum + Number(item[`${tax}Amt`] || 0), 0)),
      };
    });
    const active = new Set<string>();
    if (rows.some(row => ['CGST', 'SGST'].includes(row.label) && row.rawAmount !== 0)) {
      active.add('CGST'); active.add('SGST');
    }
    if (rows.some(row => row.label === 'IGST' && row.rawAmount !== 0)) active.add('IGST');
    if (!active.size) {
      const location = this.kind === 'sales' ? (this.header as SalesHeaderModel).customerLocation : (this.header as PurchaseHeaderModel).supplierLocation;
      if (Number(location) === 1) active.add('IGST');
      else { active.add('CGST'); active.add('SGST'); }
    }
    if (rows.some(row => row.label === 'CESS' && row.rawAmount !== 0)) active.add('CESS');
    return rows.filter(row => active.has(row.label)).map(({ rawAmount, ...row }) => row);
  }
  get placeOfSupply() {
    if (this.header.placeOfSupply?.trim()) return this.header.placeOfSupply;
    const labels = this.taxes.map(tax => tax.label);
    // Do not invent a destination state from an address or GST registration.
    if (labels.includes('IGST') && !labels.includes('CGST')) return 'Inter-state — confirm destination state';
    return 'Tamil Nadu (33)';
  }
  itemTaxRate(item: InvoiceItem) {
    if (item.taxPercentage != null) return Number(item.taxPercentage);
    // Older saved rows may have only the individual GST rates.
    const localRate = Number(item.cgst_perc || 0) + Number(item.sgst_perc || 0);
    const gstRate = Number(item.igstAmt || 0) !== 0 ? Number(item.igst_perc || 0) : localRate || Number(item.igst_perc || 0);
    return gstRate + Number(item.cess_perc || 0);
  }
  itemAmount(item: InvoiceItem) {
    return this.round(Number(item.netAmt || 0) - Number(item.cgstAmt || 0) - Number(item.sgstAmt || 0) - Number(item.igstAmt || 0) - Number(item.cessAmt || 0));
  }
  private round(value: number) { return Math.round(value); }
}
