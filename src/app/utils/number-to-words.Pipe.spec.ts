import { NumberToWordsPipe } from './number-to-words.Pipe';

describe('Invoice amount in words', () => {
  const pipe = new NumberToWordsPipe();
  it('writes the invoice amount rounded to the nearest whole rupee', () => {
    expect(pipe.transform(129.8)).toBe('one hundred and thirty rupees');
    expect(pipe.transform(1.01)).toBe('one rupee');
  });
  it('writes whole hundreds, zero, and Indian currency groups', () => {
    expect(pipe.transform(200)).toBe('two hundred rupees');
    expect(pipe.transform(0)).toBe('zero rupees');
    expect(pipe.transform(12345678)).toBe('one crore twenty-three lakh forty-five thousand six hundred and seventy-eight rupees');
  });
});
