import { render } from '../../../test-utils';
import persistPlugin from '../src';

describe('persist', () => {
  it('can persist data', async () => {
    const {
      $,
      $$,
      Alpine,
      window: { happyDOM },
    } = await render(
      persistPlugin,
      `
        <div x-data="{
          number: $persist(42),
          string: $persist('sixtynine'),
          boolean: $persist(true),
          array: $persist(['foo', 'bar']),
          object: $persist({ foo: 'bar' }),
         }">
         </div>
      `,
    );
    const extraHTML = $('div').outerHTML;
    expect(JSON.stringify(Alpine.$data($('div')))).toBe(
      JSON.stringify({
        number: 42,
        string: 'sixtynine',
        boolean: true,
        array: ['foo', 'bar'],
        object: { foo: 'bar' },
      }),
    );
    Object.assign(Alpine.$data($('div')), {
      number: 43,
      string: 'seventy',
      boolean: false,
      array: ['baz'],
      object: { foo: 'baz' },
    });
    await happyDOM.whenAsyncComplete();
    $('div').after(extraHTML);
    await happyDOM.whenAsyncComplete();
    $$('div').forEach((el) =>
      expect(JSON.stringify(Alpine.$data(el))).toBe(
        JSON.stringify({
          number: 43,
          string: 'seventy',
          boolean: false,
          array: ['baz'],
          object: { foo: 'baz' },
        }),
      ),
    );
  });
  it('can persist data with Alpine.$persist', async () => {
    const {
      $,
      Alpine,
      window: { happyDOM },
    } = await render(
      (Alpine) => {
        persistPlugin(Alpine);
        Alpine.data('foo', () => ({
          foo: Alpine.$persist('bar'),
        }));
      },
      `
        <div x-data="foo"></div>
      `,
    );

    expect(JSON.stringify(Alpine.$data($('div')))).toBe(
      JSON.stringify({
        foo: 'bar',
      }),
    );
    Alpine.$data($('div')).foo = 'baz';
    await happyDOM.whenAsyncComplete();
    $('div').replaceWith('<span x-data="foo"></span>');
    await happyDOM.whenAsyncComplete();
    expect(JSON.stringify(Alpine.$data($('span')))).toBe(
      JSON.stringify({
        foo: 'baz',
      }),
    );
  });
});
