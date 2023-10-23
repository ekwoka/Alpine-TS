import { buildUp, formatInput, stripDown } from '../src/stringManipulations';

describe('x-mask String Manipulations', () => {
  it('can strip down inputs', () => {
    expect(stripDown('+9.999.999.9999', '+1-555-202-8445')).toBe('15552028445');
    expect(stripDown('$99.99 off', '42.69 cool')).toBe('4269');
    expect(stripDown('aaaaa, aaa 99999', 'dubai, uae 00000')).toBe(
      'dubaiuae00000',
    );
    expect(stripDown('999.aaa.****', '12-3.gj=a78-9-0')).toBe('123gja7890');
  });
  it('can build up to template', () => {
    expect(buildUp('+9.999.999.9999', '15552028445')).toBe('+1.555.202.8445');
    expect(buildUp('$99.99 off', '4269')).toBe('$42.69 off');
    expect(buildUp('aaaaa, aaa 99999', 'dubaiuae00000')).toBe(
      'dubai, uae 00000',
    );
    expect(buildUp('999.aaa.****', '123gja7890')).toBe('123.gja.7890');
  });
  it('can format inputs to template', () => {
    expect(formatInput('+9.999.999.9999', '+1-555-202-8445')).toBe(
      '+1.555.202.8445',
    );
    expect(formatInput('$99.99 off', '₩4269 cool')).toBe('$42.69 off');
    expect(formatInput('aaaaa, aaa 99999', 'dubai uae,00000')).toBe(
      'dubai, uae 00000',
    );
    expect(formatInput('999.aaa.****', '12-3.gj=a78-9-0')).toBe('123.gja.7890');
  });
});
