import { render } from './utils';
import { describe, expect, it } from 'vitest';

describe('Alpine Store', () => {
  it('can register and use a global store', async () => {
    const { $, click } = await render(
      (Alpine) => {
        Alpine.store('foo', {
          bar: 'bar',
        });
      },
      `
        <div x-data>
          <span x-text="$store.foo.bar"></span>
          <button @click="$store.foo.bar = 'baz'">change</button>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
    await click('button');
    expect($('span').textContent).toBe('baz');
  });
  it('calls the stores init function', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.store('foo', {
          init() {
            this.bar = 'baz';
          },
        });
      },
      `
        <div x-data>
          <span x-text="$store.foo.bar"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('baz');
  });
  it('can store numbers', async () => {
    const { $, click } = await render(
      (Alpine) => {
        Alpine.store('foo', 1);
      },
      `
        <div x-data>
          <span x-text="$store.foo"></span>
          <button @click="$store.foo++">change</button>
        </div>
      `
    );
    expect($('span').textContent).toBe('1');
    await click('button');
    expect($('span').textContent).toBe('2');
  });
  it('can store primitives', async () => {
    const { $, click } = await render(
      (Alpine) => {
        Alpine.store('foo', 'bar');
      },
      `
        <div x-data>
          <span x-text="$store.foo"></span>
          <button @click="$store.foo = 'baz'">change</button>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
    await click('button');
    expect($('span').textContent).toBe('baz');
  });
  it('makes stores "this" reactive', async () => {
    const { $, click } = await render(
      (Alpine, window) => {
        Alpine.store('test', {
          count: 1,
          init() {
            window.addEventListener('click', () => this.count++);
          },
          clickHandler() {
            this.count++;
          },
        });
      },
      `
        <div x-data>
          <span x-text="$store.test.count"></span>
          <button @click="$store.test.clickHandler">change</button>
        </div>
      `
    );
    expect($('span').textContent).toBe('1');
    await click('button');
    expect($('span').textContent).toBe('2');
  });
});
