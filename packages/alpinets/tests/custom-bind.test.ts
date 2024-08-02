import { describe, expect, it } from 'vitest';
import { ElementWithXAttributes } from '../src/types';
import { render } from './utils';

describe('Custom Bindings', () => {
  it('can register custom bind object', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.bind('Foo', {
          'x-init'() {
            this.$el.innerText = 'bar';
          },
        });
      },
      `
      <div x-data>
        <span x-bind="Foo"></span>
      </div>
    `,
    );
    expect($('span').textContent).toBe('bar');
  });

  it('can register custom bind function', async () => {
    const { $ } = await render((Alpine) => {
      Alpine.bind('Foo', () => ({
        'x-init'() {
          this.$el.textContent = 'bar';
        },
      }));
    }, `<div x-data x-bind="Foo"></div>`);
    expect($('div').textContent).toBe('bar');
  });
  it('can bind directly to an element', async () => {
    const { $ } = await render((Alpine, window) => {
      Alpine.bind(
        window.document.querySelector(
          '#one',
        ) as unknown as ElementWithXAttributes,
        () => ({
          'x-text'() {
            return 'foo';
          },
        }),
      );
    }, `<div x-data id="one"></div>`);
    expect($('div').textContent).toBe('foo');
  });
});
