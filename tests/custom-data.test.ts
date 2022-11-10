import AlpineT from '../packages/alpinejs/src';
import { render } from './utils/render';
import { describe, expect, it } from 'vitest';

describe('Custom Data Providers', () => {
  it('works', async () => {
    const window = await render(
      (Alpine: typeof AlpineT) => Alpine.data('foo', () => ({ foo: 'bar' })),
      `<div x-data="foo" x-text="foo"></div>`
    );
    expect(window.Alpine).toBeDefined();
    expect(window.document.querySelector('div').textContent).toBe('bar');
  });
  it('can register custom data providers', async () => {
    const window = await render(
      `
      document.addEventListener('alpine:init', () => {
          Alpine.data('test', () => ({
              foo: 'bar'
          }))
      })
    `,
      `
      <div x-data="test">
        <span x-text="foo"></span>
      </div>
    `
    );
    expect(window.document.querySelector('span').textContent).toBe('bar');
  });
  it('can accept initial params', async () => {
    const window = await render(
      `
      document.addEventListener('alpine:init', () => {
          Alpine.data('test', (first, second) => ({
              foo: first,
              bar: second,
          }))
      })
    `,
      `
      <div x-data="test('baz', 'bob')">
          <h1 x-text="foo"></h1>
          <h2 x-text="bar"></h2>
      </div>
    `
    );
    expect(window.document.querySelector('h1').textContent).toBe('baz');
    expect(window.document.querySelector('h2').textContent).toBe('bob');
  });

  it('can spread together', async () => {
    const window = await render(
      `
    document.addEventListener('alpine:init', () => {
      Alpine.data('test', (first) => ({
          foo: first,
      }))

      Alpine.data('test2', (second) => ({
          bar: second,
      }))
  })
            `,
      `
        <div x-data="{ ...test('baz'), ...test2('bob') }">
          <h1 x-text="foo"></h1>
          <h2 x-text="bar"></h2>
        </div>
        `
    );
    expect(window.document.querySelector('h1').textContent).toBe('baz');
    expect(window.document.querySelector('h2').textContent).toBe('bob');
  });
  it('calls init functions automatically', async () => {
    const window = await render(
      `document.addEventListener('alpine:init', () => {
        Alpine.data('test', () => ({
          init() {
            this.foo = 'baz';
          },

          foo: 'bar',
        }));
      })`,
      `<div x-data="test">
            <span x-text="foo"></span>
        </div>`
    );
    expect(window.document.querySelector('span').textContent).toBe('baz');
  });
  it('has a reactive this context', async () => {
    const window = await render(
      `document.addEventListener('alpine:init', () => {
                Alpine.data('test', () => ({
                    init() {
                        window.addEventListener('click', () => {
                            this.foo = 'baz'
                        })
                    },

                    foo: 'bar'
                }))
            })`,
      `
            <div x-data="test">
            <span x-text="foo"></span>

            <button>click me</button>
        </div>
            `
    );
    expect(window.document.querySelector('span').textContent).toBe('bar');
    window.document.querySelector('button').click();
    await window.happyDOM.whenAsyncComplete();
    expect(window.document.querySelector('span').textContent).toBe('baz');
  });
  it('should provide access to parent scopes', async () => {
    const window = await render(
      `
    document.addEventListener('alpine:init', () => {
                Alpine.data('parent', () => ({
                    foo: 'bar',
                }))

                Alpine.data('child', () => ({
                    init() {
                        this.$el.textContent = this.foo
                    },
                }))
            })
    `,
      `
    <div x-data="parent">
            <p x-data="child"></p>
        </div>`
    );
    expect(window.document.querySelector('p').textContent).toBe('bar');
  });
  it('calls destory functions automatically', async () => {
    const window = await render(
      `document.addEventListener('alpine:init', () => {
                Alpine.data('test', () => ({
                    destroy() {
                        document.querySelector('span').textContent = 'foo'
                    },
                    test() {
                        Alpine.closestRoot(this.$el).remove()
                    }
                }))
            })`,
      `
            <div x-data="test">
            <button x-on:click="test()"></button>
        </div>
        <span></span>
            `
    );
    expect(window.document.querySelector('span').textContent).toBe('');
    window.document.querySelector('button').click();
    await window.happyDOM.whenAsyncComplete();
    expect(window.document.querySelector('span').textContent).toBe('foo');
  });
  it('should provide current scope to destroy method', async () => {
    const window = await render(
      `document.addEventListener('alpine:init', () => {
                Alpine.data('test', () => ({
                    destroy() {
                        document.querySelector('span').textContent = this.foo
                    },
                    test() {
                        Alpine.closestRoot(this.$el).remove()
                    },
                    foo: 'bar'
                }))
            })`,
      `<div x-data="test">
            <button x-on:click="test()"></button>
        </div>
        <span>baz</span>`
    );
    expect(window.document.querySelector('span').textContent).toBe('baz');
    window.document.querySelector('button').click();
    await window.happyDOM.whenAsyncComplete();
    expect(window.document.querySelector('span').textContent).toBe('bar');
  });
});
