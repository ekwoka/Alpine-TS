import { noop, render } from './utils';
import { describe, expect, it } from 'vitest';

describe('Mutations', () => {
  it('cleans up side effects when element is removed', async () => {
    const { $, click } = await render(
      noop,
      `<div x-data="{ foo: 1, bar: 1 }">
            <button @click="bar++">bar</button>
            <a href="#" @click.prevent="$refs.span.remove()">remove</a>

            <span x-text="foo = foo + 1, bar" x-ref="span"></span>

            <h1 x-text="foo"></h1>
            <h2 x-text="bar"></h2>
        </div>`,
    );
    expect($('h1').textContent).toBe('2');
    expect($('h2').textContent).toBe('1');
    await click('button');
    expect($('h1').textContent).toBe('3');
    expect($('h2').textContent).toBe('2');
    await click('a');
    await click('button');
    expect($('h1').textContent).toBe('3');
    expect($('h2').textContent).toBe('3');
  });
  it('cleans up nested side effect when parent is removed', async () => {
    const { $, click } = await render(
      noop,
      `<div x-data="{ foo: 1, bar: 1 }">
            <button @click="bar++">bar</button>
            <a href="#" @click.prevent="$refs.article.remove()">remove</a>

            <article x-ref="article">
                <span x-text="(foo = foo + 1, bar)"></span>
            </article>

            <h1 x-text="foo"></h1>
            <h2 x-text="bar"></h2>
        </div>`,
    );
    expect($('h1').textContent).toBe('2');
    expect($('h2').textContent).toBe('1');
    await click('button');
    expect($('h1').textContent).toBe('3');
    expect($('h2').textContent).toBe('2');
    await click('a');
    await click('button');
    expect($('h1').textContent).toBe('3');
    expect($('h2').textContent).toBe('3');
  });
});
