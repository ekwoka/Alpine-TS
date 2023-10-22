import { render } from '../utils';

describe('$root', () => {
  it('exposes the nearest component root element', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data data-foo="bar">
          <span x-text="$root.dataset.foo"></span>
        </div>
      `,
    );
    expect($('span').textContent).toBe('bar');
  });
});
