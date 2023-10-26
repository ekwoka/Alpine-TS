import { render } from '../../../test-utils';
import persistPlugin, { SimpleStorage } from '../src';

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
    const { $, Alpine, happyDOM } = await render(
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
  it('can persist with alternative Storage', async () => {
    const [store, storage] = makeTestStore();
    const { $, Alpine, happyDOM } = await render(
      (Alpine) => {
        persistPlugin(Alpine);
        Alpine.data('foo', () => ({
          foo: Alpine.$persist('bar').using(storage),
        }));
      },
      `
        <div x-data="foo"></div>
      `,
    );
    expect(store.has('_x_foo')).toBe(true);
    expect(store.get('_x_foo')).toBe('"bar"');
    Alpine.$data($('div')).foo = 'baz';
    await happyDOM.whenAsyncComplete();
    expect(store.get('_x_foo')).toBe('"baz"');
  });
  it('can persist with an alias', async () => {
    const [store, storage] = makeTestStore();
    const { $, Alpine, happyDOM } = await render(
      (Alpine) => {
        persistPlugin(Alpine);
        Alpine.data('foo', () => ({
          foo: Alpine.$persist('bar').as('foobar').using(storage),
          bar: Alpine.$persist('buzz').using(storage),
        }));
      },
      `
        <div x-data="foo"></div>
      `,
    );
    expect(store.has('foobar')).toBe(true);
    expect(store.get('foobar')).toBe('"bar"');
    expect(store.has('_x_bar')).toBe(true);
    expect(store.get('_x_bar')).toBe('"buzz"');
    Alpine.$data($('div')).foo = 'baz';
    await happyDOM.whenAsyncComplete();
    $('div').replaceWith('<span x-data="foo"></span>');
    await happyDOM.whenAsyncComplete();
    expect(store.get('foobar')).toBe('"baz"');
    expect(JSON.stringify(Alpine.$data($('span')))).toBe(
      JSON.stringify({
        foo: 'baz',
        bar: 'buzz',
      }),
    );
  });
  it('can be used with Alpine.store', async () => {
    const [store, storage] = makeTestStore();
    const { Alpine, happyDOM } = await render(
      (Alpine) => {
        persistPlugin(Alpine);
        Alpine.store('foo', {
          foo: Alpine.$persist('bar').using(storage),
        });
      },
      `
        <div x-data></div>
      `,
    );
    expect(store.has('_x_foo')).toBe(true);
    expect(store.get('_x_foo')).toBe('"bar"');
    Alpine.store('foo').foo = 'baz';
    await happyDOM.whenAsyncComplete();
    expect(store.get('_x_foo')).toBe('"baz"');
  });
});

const makeTestStore = () => {
  const store = new Map();
  const storage: SimpleStorage = {
    getItem(key) {
      return store.get(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
  return [store, storage] as const;
};
