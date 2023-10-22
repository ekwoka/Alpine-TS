import { cleanTextContent, render } from '../utils';

describe('$refs', () => {
  it('exposes ref elements in scope', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <span x-ref="foo">Test</span>
          <span x-text="$refs.foo.textContent"></span>
        </div>
      `,
    );
    expect($('span').textContent).toBe('Test');
    expect(cleanTextContent($('div').textContent)).toBe('Test Test');
  });
  it('exposes refs inside data context methods', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ foo() { this.$refs.fizz.textContent = 'buzz' } }">
          <span x-ref="fizz" @click="foo">bar</span>
        </div>
      `,
    );
    expect($('span').textContent).toBe('bar');
    await click('span');
    expect($('span').textContent).toBe('buzz');
  });
  it('exposes refs inside handler expressions', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data>
          <span x-ref="fizz" @click="$refs.fizz.textContent = 'foo'">bar</span>
        </div>
      `,
    );
    expect($('span').textContent).toBe('bar');
    await click('span');
    expect($('span').textContent).toBe('foo');
  });
  it('exposes refs in x-init', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data x-init="$refs.foo.textContent = 'bar'">
          <span x-ref="foo"></span>
        </div>
      `,
    );
    expect($('span').textContent).toBe('bar');
  });
  it('exposes refs from the parent scope', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <span x-ref="foo">bar</span>
          <div x-data>
            <span x-text="$refs.foo.textContent"></span>
          </div>
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('bar bar');
  });
  it('references the nearest scoped ref when conflicted', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <span x-ref="foo">bar</span>
          <div x-data>
            <span x-ref="foo">baz</span>
            <div x-data>
              <span x-text="$refs.foo.textContent"></span>
            </div>
          </div>
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('bar baz baz');
  });
});
