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
      `,
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
      `,
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
      `,
    );
    expect($('b').textContent).toBe('baz');
  });
  it('is reactive even after x-if and x-for', async () => {
    const { $, click } = await render(
      (Alpine) => {
        Alpine.data('html', () => ({
          foo: '<b x-text="bar"></b>',
          bar: 'baz',
          show: false,
        }));
      },
      `
        <div x-data="html">
          <button @click="show = true"></button>
          <template x-if="show">
              <h1>yoyoyo</h1>
          </template>
          <div x-html="foo"></div>
        </div>
      `,
    );
    expect($('[x-html]').firstElementChild.tagName).toBe('B');
    expect($('h1')).toBeNull();
    expect($('b').textContent).toBe('baz');
    await click('button');
    expect($('h1').textContent).toBe('yoyoyo');
  });
});
