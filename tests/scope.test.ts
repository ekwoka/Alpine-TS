import { mergeProxies } from '@/alpinejs/scope';

describe('mergeProxies', () => {
  it('allows getting keys from object list', () => {
    const objects = [{ foo: 'bar' }, { baz: 'qux' }];
    const proxy = mergeProxies(objects);
    expect(proxy.foo).toBe('bar');
    expect(proxy.baz).toBe('qux');
  });
  it('allows settings values to object list', () => {
    const objects = [{ foo: 'bar' }, { baz: 'qux' }];
    const proxy = mergeProxies(objects);
    proxy.foo = 'baz';
    expect(objects[0].foo).toBe('baz');
    proxy.baz = 'bar';
    expect(objects[1].baz).toBe('bar');
  });
  it('allows JSON Stringification', () => {
    const objects = [{ foo: 'bar' }, { baz: 'qux' }];
    const proxy = mergeProxies(objects);
    expect(JSON.stringify(proxy)).toBe('{"foo":"bar","baz":"qux"}');
  });
  it('allows getters and setters to access the merged proxy', () => {
    const objects = [
      { foo: 'bar' },
      {
        foo: 'buzz',
        get fizz() {
          return this.foo;
        },
        set fizz(value) {
          this.foo = value;
        },
      },
    ];
    const proxy = mergeProxies(objects);
    expect(proxy.foo).toBe('bar');
    expect(proxy.fizz).toBe('bar');
    proxy.fizz = 'baz';
    console.log(JSON.stringify(proxy));
    console.log(objects);
    expect(proxy.foo).toBe('baz');
    expect(proxy.fizz).toBe('baz');
    expect(objects[0].foo).toBe('baz');
    expect(objects[1].foo).toBe('buzz');
  });
});
