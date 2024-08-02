import { render } from '../../../test-utils';
import maskPlugin from '../src';

describe('x-mask', () => {
  it('can limit inputs', async () => {
    const {
      $,
      type,
      keydown,
      window: { happyDOM },
    } = await render(
      maskPlugin,
      `
        <input x-data x-mask="(999) 999-9999">
      `,
    );
    await type('input', '12');
    expect($('input').value).toBe('(12');

    await type('input', '(123) 456-7890');
    expect($('input').value).toBe('(123) 456-7890');

    await type('input', '1234567890');
    expect($('input').value).toBe('(123) 456-7890');

    $('input').value = $('input').value.slice(0, -1);
    await happyDOM.whenAsyncComplete();
    expect($('input').value).toBe('(123) 456-789');

    $('input').value = $('input').value.slice(0, -1);
    await happyDOM.whenAsyncComplete();
    expect($('input').value).toBe('(123) 456-78');

    $('input').value = $('input').value.slice(0, -1);
    await happyDOM.whenAsyncComplete();
    expect($('input').value).toBe('(123) 456-7');

    $('input').value = $('input').value.slice(0, -1);
    await happyDOM.whenAsyncComplete();
    expect($('input').value).toBe('(123) 456-');

    $('input').value = $('input').value.slice(0, -1);
    await happyDOM.whenAsyncComplete();
    expect($('input').value).toBe('(123) 456');

    $('input').value = $('input').value.slice(0, -1);
    await happyDOM.whenAsyncComplete();
    expect($('input').value).toBe('(123) 45');

    await keydown('input', 'a');
    expect($('input').value).toBe('(123) 45');

    await keydown('input', '-');
    expect($('input').value).toBe('(123) 45');
  });
  it('works with x-model', async () => {
    const { $, type, Alpine } = await render(
      maskPlugin,
      `
        <div x-data="{ value: '' }">
            <input x-mask="(999) 999-9999" x-model="value" id="1">
        </div>
      `,
    );
    await type('input', '12');
    expect($('input').value).toBe('(12');
    // @ts-expect-error Tapping into untyped internals
    expect(Alpine.$data($('input')).value).toBe('(12');

    await type('input', '123');
    expect($('input').value).toBe('(123) ');
    // @ts-expect-error Tapping into untyped internals
    expect(Alpine.$data($('input')).value).toBe('(123) ');

    await type('input', '1234567890');
    expect($('input').value).toBe('(123) 456-7890');
    // @ts-expect-error Tapping into untyped internals
    expect(Alpine.$data($('input')).value).toBe('(123) 456-7890');
  });
  it('masks initial x-model value', async () => {
    const { $, Alpine } = await render(
      maskPlugin,
      `
        <div x-data="{value:'1234567890'}">
            <input x-mask="(999) 999-9999" x-model="value">
        </div>
      `,
    );
    expect($('input').value).toBe('(123) 456-7890');
    // @ts-expect-error Tapping into untyped internals
    expect(Alpine.$data($('input')).value).toBe('(123) 456-7890');
  });
  it('does nothing with falsy input', async () => {
    const { type } = await render(
      maskPlugin,
      `
        <div x-data>
            <input x-mask="" id="1">
            <input x-mask="false" id="2">
        </div>
      `,
    );
    expect((await type('input#1', '12ua/cs')).value).toBe('12ua/cs');
    expect((await type('input#2', '12ua/cs')).value).toBe('12ua/cs');
  });
  it('enforces non-wildcard characters', async () => {
    const { type } = await render(
      maskPlugin,
      `
        <div x-data>
            <input x-mask="ba9*b">
        </div>
      `,
    );
    expect((await type('input', 'a')).value).toBe('ba');
    expect((await type('input', 'baa')).value).toBe('ba');
    expect((await type('input', 'ba3')).value).toBe('ba3');
    expect((await type('input', 'ba3z')).value).toBe('ba3zb');
  });
  it('can evaluate dynamic expressions', async () => {
    const { $, type, click } = await render(
      maskPlugin,
      `
        <div x-data="{ mask: '999-999-9999' }">
            <input x-mask:dynamic="mask">
            <button @click="mask = '999.999.9999'">Change</button>
        </div>
      `,
    );
    expect((await type('input', '1234567890')).value).toBe('123-456-7890');
    await click('button');
    expect($('input').value).toBe('123.456.7890');
  });
});

describe('x-mask $money', () => {
  it('formats money', async () => {
    const { type } = await render(
      maskPlugin,
      `
        <input x-data x-mask:function="$money">
      `,
    );

    expect((await type('input', '30.00')).value).toBe('30.00');
    expect((await type('input', '30.005')).value).toBe('30.00');
    expect((await type('input', '30.0')).value).toBe('30.0');
    expect((await type('input', '30.05')).value).toBe('30.05');
    expect((await type('input', '123')).value).toBe('123');
    expect((await type('input', '1234')).value).toBe('1,234');
    expect((await type('input', '1234567')).value).toBe('1,234,567');
    expect((await type('input', '1234567.89')).value).toBe('1,234,567.89');
    expect((await type('input', '')).value).toBe('');
    expect((await type('input', '1,2,3,4,5,6,7.89')).value).toBe(
      '1,234,567.89',
    );
  });

  it('can format money with alternative decimal deliminators', async () => {
    const { type } = await render(
      maskPlugin,
      `<input x-data x-mask:function="$money($input, ',')">`,
    );
    expect((await type('input', '30,00')).value).toBe('30,00');
    expect((await type('input', '30,005')).value).toBe('30,00');
    expect((await type('input', '30,0')).value).toBe('30,0');
    expect((await type('input', '30,05')).value).toBe('30,05');
    expect((await type('input', '123')).value).toBe('123');
    expect((await type('input', '1234')).value).toBe('1.234');
    expect((await type('input', '1234567')).value).toBe('1.234.567');
    expect((await type('input', '1234567,89')).value).toBe('1.234.567,89');
    expect((await type('input', '')).value).toBe('');
    expect((await type('input', '1.2.3.4.5.6.7,89')).value).toBe(
      '1.234.567,89',
    );
  });
  it('can format with alternative thousands separator', async () => {
    const { type } = await render(
      maskPlugin,
      `
        <input x-data x-mask:function="$money($input, '.', ' ')">
      `,
    );

    expect((await type('input', '3000')).value).toBe('3 000');
    expect((await type('input', '300')).value).toBe('300');
    expect((await type('input', '3005')).value).toBe('3 005');
    expect((await type('input', '1')).value).toBe('1');
    expect((await type('input', '1234')).value).toBe('1 234');
    expect((await type('input', '1234567')).value).toBe('1 234 567');
    expect((await type('input', '1234567.89')).value).toBe('1 234 567.89');
    expect((await type('input', '')).value).toBe('');
    expect((await type('input', '1 2 3 4 5 6 7.89')).value).toBe(
      '1 234 567.89',
    );
  });
  it('respects negative numbers', async () => {
    const { type } = await render(
      maskPlugin,
      `
        <input x-data x-mask:function="$money">
      `,
    );
    expect((await type('input', '-30.00')).value).toBe('-30.00');
    expect((await type('input', '30.00-')).value).toBe('30.00');
  });
  it('can have custom decimal precision', async () => {
    const { type } = await render(
      maskPlugin,
      `
        <input x-data x-mask:function="$money($input, '.', ' ', 4)">
      `,
    );
    expect((await type('input', '30.00')).value).toBe('30.00');
    expect((await type('input', '42.069')).value).toBe('42.069');
    expect((await type('input', '42.0694')).value).toBe('42.0694');
    expect((await type('input', '42.069420')).value).toBe('42.0694');
  });
});
