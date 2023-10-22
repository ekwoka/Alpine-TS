import { render } from './utils';
import { describe, expect, it } from 'vitest';

describe('Custom Directives', () => {
  it('can register custom directive', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.directive('foo', (el, { value, modifiers, expression }) => {
          el.textContent = value + modifiers + expression;
        });
      },
      `
        <div x-data>
          <span x-foo:bar.baz="bob"></span>
        </div>
      `,
    );
    expect($('span').textContent).toBe('barbazbob');
  });

  it('directives are auto cleaned up', async () => {
    const { $, click } = await render(
      (Alpine) => {
        Alpine.directive(
          'foo',
          (_el, _, { effect, cleanup, evaluateLater }) => {
            const incCount = evaluateLater('count++');

            cleanup(() => {
              incCount();
              incCount();
            });

            effect(() => {
              incCount();
            });
          },
        );
      },
      `
        <div x-data="{ count: 0 }">
          <span x-foo x-ref="foo"></span>
          <h1 x-text="count"></h1>

          <button @click="count++" id="change">change</button>
          <button @click="$refs.foo.remove()" id="remove">remove</button>
        </div>
      `,
    );
    expect($('h1').textContent).toBe('1');
    await click('#change');
    expect($('h1').textContent).toBe('3');
    await click('#remove');
    await click('#change');
    expect($('h1').textContent).toBe('6');
    await click('#change');
    expect($('h1').textContent).toBe('7');
  });
  it('can register directives order', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.directive('foo', (el) => {
          Alpine.addScopeToNode(el, { foo: 'bar' });
        }).before('bind'),
      `
        <div x-data>
          <span x-foo x-bind:foo="foo"></span>
        </div>
      `,
    );
    expect($('span').getAttribute('foo')).toBe('bar');
  });
});
