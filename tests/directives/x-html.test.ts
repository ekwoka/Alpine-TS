import { render } from '../utils';

describe('x-html', () => {
  it('sets html on init', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('html', () => ({ foo: '<b>bar</b>' })); // happydom has issues with html inside attribute expressions
      },
      `
        <div x-data="html">
          <span x-html="foo"></span>
        </div>
      `
    );
    expect($('b').innerHTML).toBe('bar');
  });
  it('sets html on update', async () => {
    const { $, click } = await render(
      (Alpine) => {
        Alpine.data('html', () => ({
          foo: '<b>bar</b>',
          change() {
            this.foo = '<b>buzz</b>';
          },
        })); // happydom has issues with html inside attribute expressions
      },
      `
        <div x-data="html">
          <span x-html="foo"></span>
          <button @click="change"></button>
        </div>
      `
    );
    expect($('b').innerHTML).toBe('bar');
    await click('button');
    expect($('b').innerHTML).toBe('buzz');
  });
  it('initializes nested alpine directives', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.data('html', () => ({
          foo: '<b x-text="bar"></b>',
          bar: 'baz',
        }));
      },
      `
        <div x-data="html">
          <span x-html="foo"></span>
        </div>
      `
    );
    expect($('b').textContent).toBe('baz');
  });
});
