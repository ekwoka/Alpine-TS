import { render } from '../utils';

describe('x-text', () => {
  it('sets text on init', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <span x-text="foo"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
  });
  it('sets text on update', async () => {
    const { $, click } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <span x-text="foo"></span>
        <button @click="foo = 'buzz'"></button>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
    await click('button');
    expect($('span').textContent).toBe('buzz');
  });
  it('sets text on SVG elements', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <svg>
          <text x-text="foo"></text>
        </svg>
      </div>
    `,
    );
    expect($('text').textContent).toBe('bar');
  });
});
