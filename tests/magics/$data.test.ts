import { cleanTextContent, render } from '../utils';

describe('$data', () => {
  it('returns the current merged scope', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }">
          <div x-data="{ fizz: 'buzz' }">
            <span x-text="$data.foo"></span>
            <span x-text="$data.fizz"></span>
          </div>
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('bar buzz');
  });
});
