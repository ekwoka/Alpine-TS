import { render } from './utils';
import { describe, expect, it } from 'vitest';

describe('Custom Prefix', () => {
  it('can set a custom x- prefix', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.prefix('data-x-');
      },
      `
      <div data-x-data="{ foo: 'bar' }">
        <span data-x-text="foo"></span>
      </div>
    `
    );
    expect($('span').textContent).toBe('bar');
  });
});
