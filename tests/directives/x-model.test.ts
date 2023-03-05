import { noop, render } from '../utils';

describe('x-model', () => {
  it('binds value when initialized', async () => {
    const { $ } = await render(
      noop,
      `
        <div x-data="{ foo: 'bar' }">
          <input type="text" x-model="foo">
        </div>
      `
    );
    expect($('input').value).toBe('bar');
  });
  it('updates value when updated via input', async () => {
    const { $, type } = await render(
      noop,
      `
        <div x-data="{ foo: null }">
          <input type="text" x-model="foo">
          <span x-text="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('');
    await type('input', 'bar');
    expect($('span').textContent).toBe('bar');
  });
  it('updates input when value updated', async () => {
    const { $, click } = await render(
      noop,
      `
        <div x-data="{ foo: 'bar' }">
          <input type="text" x-model="foo">
          <button type="button" @click="foo = 'baz'">button</button>
        </div>
      `
    );
    expect($('input').value).toBe('bar');
    await click('button');
    expect($('input').value).toBe('baz');
  });
  describe('with number modifier', () => {
    it('casts value to number', async () => {
      const { type, getData } = await render(
        noop,
        `
          <div x-data="{ foo: 0 }">
            <input type="number" x-model.number="foo">
          </div>
        `
      );
      await type('input', '1');
      expect(getData('div', 'foo')).toBe(1);
    });
    it('uses null if empty, original value if casting fails, and numeric if casting passes', async () => {
      const { type, getData } = await render(
        noop,
        `
          <div x-data="{ foo: 0, bar: '' }">
              <input id="first" type="number" x-model.number="foo">
              <input id="second" x-model.number="bar">
          </div>
        `
      );
      await type('#first', '');
      expect(getData('div', 'foo')).toBe(null);
      await type('#first', '-');
      expect(getData('div', 'foo')).toBe(null);
      await type('#first', '-123');
      expect(getData('div', 'foo')).toBe(-123);
      await type('#second', '');
      expect(getData('div', 'bar')).toBe(null);
      await type('#second', '-');
      expect(getData('div', 'bar')).toBe('-');
      await type('#second', '-123');
      expect(getData('div', 'bar')).toBe(-123);
    });
  });

  describe('with trim modifier', () => {
    it('trims value', async () => {
      const { type, getData } = await render(
        noop,
        `
          <div x-data="{ foo: '' }">
            <input type="text" x-model.trim="foo">
          </div>
        `
      );
      await type('input', ' bar ');
      expect(getData('div', 'foo')).toBe('bar');
    });
  });

  it('can be accessed programmatically', async () => {
    const { $, type, click } = await render(
      noop,
      `
        <div x-data="{ foo: 'bar' }" x-model="foo">
            <input x-model="foo">

            <span x-text="$root._x_model.get()"></span>
            <button @click="$root._x_model.set('bob')">Set foo to bob</button>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
    await type('input', 'baz');
    expect($('span').textContent).toBe('baz');
    await click('button');
    expect($('span').textContent).toBe('bob');
  });
  it('updates value when form is reset', async () => {
    const { $, type, resetForm, Alpine, getData } = await render(
      noop,
      `
        <div x-data="{ foo: 'bar' }">
          <form>
            <input type="text" x-model="foo" value="bar">
          </form>
          <span x-text="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
    await type('input', 'baz');
    expect($('span').textContent).toBe('baz');
    await resetForm('form');
    await Alpine.nextTick();
    expect($('input').value).toBe('bar');
    expect($('span').textContent).toBe('bar');
    expect(getData('div', 'foo')).toBe('bar');
  });
});
