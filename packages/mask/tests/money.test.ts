import { addThousands, formatMoney } from '../src/money';
import { formatInput } from '../src/stringManipulations';

describe('$money', () => {
  it('can add thousands separator', () => {
    expect(addThousands('9999')).toBe('9,999');
    expect(addThousands('999999999', '.')).toBe('999.999.999');
  });
  it('can provide a template for money', () => {
    expect(formatMoney('420.69')).toBe('999.99');
    expect(formatMoney('420.69', ',')).toBe('99.999');
    expect(formatMoney('420.6')).toBe('999.99');
    expect(formatMoney('-420.6', ',')).toBe('-9.999');
  });
  it('can privide money template with alternative thousands separator', () => {
    expect(formatMoney('420,69', '.', ' ')).toBe('99 999');
    expect(formatMoney('-4200.6', '.', ' ')).toBe('-9 999.99');
    expect(formatMoney('1234', '.', ' ')).toBe('9 999');
    expect(formatMoney('1 2 3 4 5 6 7.89', '.', ' ')).toBe('9 999 999.99');
  });

  it('can format money', () => {
    expect(
      formatInput(
        formatMoney('1 2 3 4 5 6 7.89', '.', ' '),
        '1 2 3 4 5 6 7.89',
      ),
    ).toBe('1 234 567.89');
    expect(formatInput(formatMoney('1234', '.', ' '), '1234')).toBe('1 234');
  });
});
