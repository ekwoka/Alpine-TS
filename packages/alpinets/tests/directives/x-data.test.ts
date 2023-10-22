import { render } from '../utils';

describe('x-data', () => {
  it('works without express', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data>
        <span x-text="'foo'"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('foo');
  });
  it('works when true', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="true">
        <span x-text="'foo'"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('foo');
  });
  it('can be nested', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <div x-data="{ fizz: 'buzz' }">
          <span x-text="foo + fizz"></span>
        </div>
      </div>
    `,
    );
    expect($('span').textContent).toBe('barbuzz');
  });
  it('overrides parent attributes in child scopes', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <div x-data="{ foo: 'baz' }">
          <span x-text="foo"></span>
        </div>
      </div>
    `,
    );
    expect($('span').textContent).toBe('baz');
  });
  it('can use normal functions', async () => {
    const { $, getData } = await render(
      (_, window) => {
        window.sampleData = function sampleData() {
          return { fizz: 'bar' };
        };
      },
      `
        <script>
          window.sampleData = function sampleData() {
            return { fizz: 'bar' }
          }
        </script>
        <div x-data="window.sampleData">
          <span x-text="fizz"></span>
        </div>
      `,
    );
    expect(getData('div', 'fizz')).toBe('bar');
    expect($('span').textContent).toBe('bar');
  });
  it('can access $el', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{...$el.dataset}" data-foo="bar">
        <span x-text="foo"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
  });
  it('provides reactive this to methods', async () => {
    const { $, click } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar', fizz() { return this.foo }, makefizz() { this.foo = 'buzz' } }">
        <span x-text="fizz"></span>
        <button @click="makefizz"></button>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
    await click('button');
    expect($('span').textContent).toBe('buzz');
  });
  it('works on html tag', async () => {
    const { $ } = await render(
      (_, window) => {
        window.document.firstElementChild.setAttribute(
          'x-data',
          '{ foo: "bar" }',
        );
      },
      `
      <div>
        <span x-text="foo"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
  });
  it('provides reactive parent scope on this', async () => {
    const { $, click } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <div x-data="{ fizz() { return this.foo }, makeFizz() { this.foo = 'buzz' } }">
          <span x-text="fizz"></span>
          <button @click="makeFizz"></button>
        </div>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
    await click('button');
    expect($('span').textContent).toBe('buzz');
  });
});
