import { addThousands, formatMoney } from '../src/money';

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
});
