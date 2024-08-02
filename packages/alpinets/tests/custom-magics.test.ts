import { describe, expect, it } from 'vitest';
import { render } from './utils';

describe('Custom Magics', () => {
  it('can register custom magic properties', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.magic('foo', (_) => {
          return { bar: 'baz' };
        });
      },
      `
      <div x-data>
        <span x-text="$foo.bar"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('baz');
  });

  it('magics are lazily accessed', async () => {
    const { $, click } = await render(
      (Alpine, window) => {
        window.hasBeenAccessed = false;
        Alpine.magic('foo', (_) => {
          window.hasBeenAccessed = true;
        });
      },
      `
      <div x-data>
        <button @click="$el.textContent = window.hasBeenAccessed.toString()">
          clickme
        </button>
      </div>
    `,
    );
    await click('button');
    expect($('button').textContent).toBe('false');
  });
});
