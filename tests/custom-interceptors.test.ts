import { render } from './utils';
import { describe, expect, it } from 'vitest';

describe('Custom Interceptors', () => {
  it('can register custom interceptor', async () => {
    const { $ } = await render(
      (Alpine) => {
        Alpine.magic('magic', () => {
          return Alpine.interceptor(
            (_initialValue, _getter, _setter, path, key) => {
              return key + path;
            }
          );
        });
      },
      `
        <div x-data="{ foo: $magic() }">
          <span x-text="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('foofoo');
  });
  it('is nesting aware', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.magic('magic', () => {
          return Alpine.interceptor(
            (_initialValue, _getter, _setter, path, key) => {
              return key + path;
            }
          );
        }),
      `
        <div x-data="{ foo: { bar: { baz: $magic() }}}">
          <span x-text="foo.bar.baz"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('bazfoo.bar.baz');
  });
  it('prevents against circular references', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.magic('foo', () => {
          return {
            get anyGivenProperty() {
              return this;
            },
          };
        }),
      `
        <div x-data="{ foo: $foo }">
            <span x-text="'...'">
        </div>
      `
    );
    expect($('span').textContent).toBe('...');
  });
});
