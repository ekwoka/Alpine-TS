import { render } from '../utils';

describe('x-ignore', () => {
  it('ignores the tree', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }">
            <div x-ignore>
                <span x-text="foo"></span>
            </div>
        </div>
      `,
    );
    expect($('span').textContent).toBe('');
  });
  it('ignores self', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }">
            <div x-ignore.self x-text="foo">
              <span x-text="foo"></span>
            </div>
        </div>
      `,
    );
    expect($('span').textContent).toBe('bar');
  });
});
