export type InvoiceTheme = 'monochrome' | 'color';

// Shared by sales and purchase invoices, including their exported PDFs.
export const YUGAN_INVOICE_CONFIG: {
  theme: InvoiceTheme;
  showCurrencyNote: boolean;
  showLastItemBorder: boolean;
  factoryAddress: string;
  jurisdictionText: string | null;
} = {
  theme: 'monochrome',
  // Restore the currency and item-count note by setting this to true.
  showCurrencyNote: false,
  // Restore the rule beneath the last item by setting this to true.
  showLastItemBorder: false,
  factoryAddress: 'Madhavaram, Chennai - 600060 (temporary)',
  // Optional commercial term. Set to null to omit it from the invoice.
  jurisdictionText: 'Subject to Chennai jurisdiction.',
};
