import { noop, render } from '../utils';
import { describe, expect, it } from 'vitest';

describe('x-bind:style', () => {
  it('binds from object', async () => {
    const { $ } = await render(
      noop,
      `<div x-data>
            <span x-bind:style="{ color: 'red' }">I should be red</span>
        </div>`,
    );
    expect($('span').getAttribute('style')).toBe('color: red;');
  });
  it('binds objects with camelCase', async () => {
    const { $ } = await render(
      noop,
      `<div x-data>
        <span x-bind:style="{ backgroundColor: 'red' }">I should be red</span>
      </div>`,
    );
    expect($('span').getAttribute('style')).toBe('background-color: red;');
  });
  it('binds objects with kebab-case', async () => {
    const { $ } = await render(
      noop,
      `<div x-data>
        <span x-bind:style="{ 'background-color': 'red' }">I should be red</span>
      </div>`,
    );
    expect($('span').getAttribute('style')).toBe('background-color: red;');
  });
  it('binds objects with CSS variables', async () => {
    const { $, window } = await render(
      noop,
      `<div x-data x-bind:style="{ '--MyCSS-Variable': 0.25 }">
        <span style="opacity: var(--MyCSS-Variable);">I should be hardly visible</span>
      </div>`,
    );
    expect(window.getComputedStyle($('span')).opacity).toBe('0.25');
    expect();
  });
  it('merges bindings with existing styles', async () => {
    const { $ } = await render(
      noop,
      `<div x-data>
        <span style="display: block;" x-bind:style="{ color: 'red' }">I should be red</span>
      </div>`,
    );
    expect($('span').getAttribute('style')).toBe('display: block; color: red;');
  });
});
