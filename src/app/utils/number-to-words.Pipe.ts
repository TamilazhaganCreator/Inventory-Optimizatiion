import { Pipe, PipeTransform } from '@angular/core';

const small = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function words(value: number): string {
  if (value < 20) return small[value];
  if (value < 100) return tens[Math.floor(value / 10)] + (value % 10 ? '-' + words(value % 10) : '');
  for (const [scale, label] of [[10000000, 'crore'], [100000, 'lakh'], [1000, 'thousand'], [100, 'hundred']] as const) {
    if (value >= scale) return words(Math.floor(value / scale)) + ' ' + label + (value % scale ? (scale === 100 ? ' and ' : ' ') + words(value % scale) : '');
  }
  return '';
}

@Pipe({ name: 'numberToWords', standalone: false })
export class NumberToWordsPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value == null || value === '') return '';
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '';
    const rupees = Math.round(Math.abs(amount));
    return (amount < 0 ? 'minus ' : '') + words(rupees) + (rupees === 1 ? ' rupee' : ' rupees');
  }
}
