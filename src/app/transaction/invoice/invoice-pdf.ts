import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function createInvoicePdf(element: HTMLElement): Promise<jsPDF> {
  await document.fonts.ready;
  const pages = Array.from(element.querySelectorAll<HTMLElement>('.yugan-page'));
  if (!pages.length) throw new Error('No invoice pages to export.');
  const pdf = new jsPDF('p', 'mm', 'a4');
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    // Never silently crop information if an unusually long field exceeds A4.
    const bounds = page.getBoundingClientRect();
    const lastSection = page.lastElementChild!.getBoundingClientRect();
    const items = page.querySelector('.inv-items')!.getBoundingClientRect();
    const itemArea = page.querySelector('.inv-items-area')!.getBoundingClientRect();
    if (items.bottom > itemArea.bottom + 1 || page.scrollHeight > page.clientHeight + 1 || lastSection.bottom > bounds.bottom) {
      throw new Error('Invoice content exceeds the A4 page.');
    }
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: '#ffffff' });
    if (index) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
  }
  return pdf;
}
