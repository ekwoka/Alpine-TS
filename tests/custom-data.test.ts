import AlpineT from '../packages/alpinejs/src';
import { render } from './utils/render';
import { describe, expect, it } from 'vitest';

describe('Custom Data Providers', () => {
  it('works', async () => {
    const { window, $ } = await render(
      (Alpine: typeof AlpineT) => Alpine.data('foo', () => ({ foo: 'bar' })),
      `<div x-data="foo" x-text="foo"></div>`,
    );
    expect(window.Alpine).toBeDefined();
    expect($('div').textContent).toBe('bar');
  });
  it('can register custom data providers', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('test', () => ({
          foo: 'bar',
        }));
      },
      `
      <div x-data="test">
        <span x-text="foo"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
  });
  it('can accept initial params', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('test', (first, second) => ({
          foo: first,
          bar: second,
        }));
      },
      `
      <div x-data="test('baz', 'bob')">
          <h1 x-text="foo"></h1>
          <h2 x-text="bar"></h2>
      </div>
    `,
    );
    expect($('h1').textContent).toBe('baz');
    expect($('h2').textContent).toBe('bob');
  });
  it('can spread together', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('test', (first) => ({
          foo: first,
        }));

        Alpine.data('test2', (second) => ({
          bar: second,
        }));
      },
      `
        <div x-data="{ ...test('baz'), ...test2('bob') }">
          <h1 x-text="foo"></h1>
          <h2 x-text="bar"></h2>
        </div>
        `,
    );
    expect($('h1').textContent).toBe('baz');
    expect($('h2').textContent).toBe('bob');
  });
  it('calls init functions automatically', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('test', () => ({
          init() {
            this.foo = 'baz';
          },

          foo: 'bar',
        }));
      },
      `<div x-data="test">
            <span x-text="foo"></span>
        </div>`,
    );
    expect($('span').textContent).toBe('baz');
  });
  it('has a reactive this context', async () => {
    const { window, $ } = await render(
      (Alpine, window) => {
        Alpine.data('test', () => ({
          init() {
            window.addEventListener('click', () => {
              this.foo = 'baz';
            });
          },
          foo: 'bar',
        }));
      },
      `
        <div x-data="test">
            <span x-text="foo"></span>

            <button>click me</button>
        </div>
            `,
    );
    expect($('span').textContent).toBe('bar');
    $('button').click();
    await window.happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('baz');
  });
  it('should provide access to parent scopes', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('parent', () => ({
          foo: 'bar',
        }));

        Alpine.data('child', () => ({
          init() {
            this.$el.textContent = this.foo;
          },
        }));
      },
      `
    <div x-data="parent">
            <p x-data="child"></p>
        </div>`,
    );
    expect($('p').textContent).toBe('bar');
  });
  it('calls destory functions automatically', async () => {
    const { window, $ } = await render(
      (Alpine) => {
        Alpine.data('test', () => ({
          destroy() {
            document.querySelector('span').textContent = 'foo';
          },
          test() {
            Alpine.closestRoot(this.$el).remove();
          },
        }));
      },
      `
            <div x-data="test">
            <button x-on:click="test()"></button>
        </div>
        <span></span>
            `,
    );
    expect($('span').textContent).toBe('');
    $('button').click();
    await window.happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('foo');
  });
  it('should provide current scope to destroy method', async () => {
    const { window, $ } = await render(
      (Alpine) => {
        Alpine.data('test', () => ({
          destroy() {
            document.querySelector('span').textContent = this.foo;
          },
          test() {
            Alpine.closestRoot(this.$el).remove();
          },
          foo: 'bar',
        }));
      },
      `<div x-data="test">
            <button x-on:click="test()"></button>
        </div>
        <span>baz</span>`,
    );
    expect($('span').textContent).toBe('baz');
    $('button').click();
    await window.happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('bar');
  });
});
