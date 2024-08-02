import { describe, expect, it } from 'vitest';
import { render } from './utils';

describe('Clone', () => {
  it('can clone a component', async () => {
    const { $, click } = await render(
      (_, window) => {
        window.document.addEventListener('alpine:initialized', () => {
          window.original = document.getElementById('original');
          window.copy = document.getElementById('copy');

          window.copy.removeAttribute('x-ignore');
          delete window.copy._x_ignore;
        });
      },
      `
      <button x-data @click="Alpine.clone(window.original, window.copy)">click</button>

      <div x-data="{ foo: 'bar' }" id="original">
          <h1 @click="foo = 'baz'">click me</h1>

          <span x-text="foo"></span>
      </div>

      <div x-data="{ foo: 'bar' }" id="copy" x-ignore>
          <h1 @click="foo = 'baz'">click me</h1>

          <span x-text="foo"></span>
      </div>
    `,
    );
    await click('#original h1');
    expect($('#original span').textContent).toBe('baz');
    expect($('#copy span').textContent).toBe('');
    await click('button');
    expect($('#copy span').textContent).toBe('baz');
  });
  it('ignores init on clone', async () => {
    const { $, click } = await render(
      (_, window) => {
        window.document.addEventListener('alpine:initialized', () => {
          window.original = document.getElementById('original');
          window.copy = document.getElementById('copy');

          window.copy.removeAttribute('x-ignore');
          delete window.copy._x_ignore;
        });
      },
      `
        <button x-data @click="Alpine.clone(window.original, window.copy)">click</button>
        <div x-data="{ count: 0 }" x-init="count++" id="original">
            <span x-text="count"></span>
        </div>
        <div x-data="{ count: 0 }" x-init="count++" id="copy" x-ignore>
            <span x-text="count"></span>
        </div>
    `,
    );
    expect($('#original span').textContent).toBe('1');
    expect($('#copy span').textContent).toBe('');
    await click('button');
    expect($('#copy span').textContent).toBe('1');
  });
  it('skips registering listeners on clone', async () => {
    const { $, click } = await render(
      (_, window) => {
        window.document.addEventListener('alpine:initialized', () => {
          window.original = document.getElementById('original');
          window.copy = document.getElementById('copy');

          window.copy.removeAttribute('x-ignore');
          delete window.copy._x_ignore;
        });
      },
      `
        <button x-data @click="Alpine.clone(window.original, window.copy)">click</button>
        <div x-data="{ count: 0 }" x-init="count++" id="original">
            <span x-text="count"></span>
        </div>

        <div x-data="{ count: 0 }" x-init="count++" id="copy" x-ignore>
            <h1 @click="count++">inc</h1>
            <span x-text="count"></span>
        </div>
    `,
    );
    expect($('#original span').textContent).toBe('1');
    expect($('#copy span').textContent).toBe('');
    await click('button');
    expect($('#copy span').textContent).toBe('1');
    await click('#copy h1');
    expect($('#copy span').textContent).toBe('1');
  });
});
