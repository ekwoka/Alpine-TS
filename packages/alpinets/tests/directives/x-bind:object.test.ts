import { IElement } from 'happy-dom';
import { cleanTextContent, render } from '../utils';

describe('x-bind:object', () => {
  it('can bind an object of directives', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: 'bar',
          bindings: {
            ['x-text']() {
              return this.foo;
            },
            ['@click']() {
              this.foo = 'baz';
            },
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindings"></button>
      </div>
    `,
    );
    expect($('button').textContent).toBe('bar');
    await click('button');
    expect($('button').textContent).toBe('baz');
  });
  it('can bind object of normal attributes', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <button x-bind="{ 'x-bind:bob'() { return 'lob'; }, foo: 'bar', 'x-bind:bab'() { return 'lab' } }"></button>
        </div>
      `,
    );
    expect($('button').getAttribute('foo')).toBe('bar');
    expect($('button').getAttribute('bob')).toBe('lob');
    expect($('button').getAttribute('bab')).toBe('lab');
  });
  it('can bind x-for', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          todos: [
            { id: 1, text: 'foo' },
            { id: 2, text: 'bar' },
          ],
          bindings: {
            ['x-for']: 'foo in todos',
            [':key']: 'foo.id',
          },
        })),
      `
      <div x-data="x">
        <template x-bind="bindings">
          <span x-text="foo.text"></span>
        </template>
      </div>
    `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('foobar');
  });
  it('can bind x-transition', async () => {
    const { $, click, window } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          show: true,
          bindingString: {
            ['x-show']() {
              return this.show;
            },
            ['@click']() {
              this.show = false;
            },
            ['x-transition.opacity.duration.500']: '',
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingString"></button>
      </div>
    `,
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 200));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    await new Promise((res) => setTimeout(res, 400));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('none');
  });
  it('provides element bound magics to bound event handlers', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: 'bar',
          bindings: {
            ['@click']() {
              this.foo = this.$el.id;
            },
            ['x-text']() {
              return this.foo;
            },
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindings" id="baz"></button>
      </div>
    `,
    );
    expect($('button').textContent).toBe('bar');
    await click('button');
    expect($('button').textContent).toBe('baz');
  });
  it('passes the event to bound event handlers', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: 'bar',
          bindings: {
            ['@click']($event: PointerEvent) {
              this.foo = ($event.currentTarget as HTMLButtonElement).id;
            },
            ['x-text']() {
              return this.foo;
            },
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindings" id="baz"></button>
      </div>
    `,
    );
    expect($('button').textContent).toBe('bar');
    await click('button');
    expect($('button').textContent).toBe('baz');
  });
});
