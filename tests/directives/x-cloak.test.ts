import { render } from '../utils';

describe('x-cloak', () => {
  it('is removed', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }" x-cloak>
        <span x-text="foo"></span>
      </div>
    `,
    );
    expect($('div').getAttribute('x-cloak')).toBeNull();
  });
});
