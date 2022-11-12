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
      `
    );
    expect($('span').textContent).toBe('barbazbob');
  });

  it('directives are auto cleaned up', async () => {
    const { $, happyDOM } = await render(
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
          }
        );
      },
      `
        <div x-data="{ count: 0 }">
          <span x-foo x-ref="foo"></span>
          <h1 x-text="count"></h1>

          <button @click="count++" id="change">change</button>
          <button @click="$refs.foo.remove()" id="remove">remove</button>
        </div>
      `
    );
    expect($('h1').textContent).toBe('1');
    $('#change').click();
    await happyDOM.whenAsyncComplete();
    expect($('h1').textContent).toBe('3');
    $('#remove').click();
    await happyDOM.whenAsyncComplete();
    $('#change').click();
    await happyDOM.whenAsyncComplete();
    expect($('h1').textContent).toBe('6');
    $('#change').click();
    await happyDOM.whenAsyncComplete();
    expect($('h1').textContent).toBe('7');
  });
});
