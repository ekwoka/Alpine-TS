import { mergeProxies } from '../src/scope';

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
    expect(proxy.foo).toBe('baz');
    expect(proxy.fizz).toBe('baz');
    expect(objects[0].foo).toBe('baz');
    expect(objects[1].foo).toBe('buzz');
  });
  it('properly works with classes', () => {
    class Count {
      constructor(public count = 0) {}
      increment() {
        this.count++;
      }
    }
    const proxy = mergeProxies([new Count()]);
    expect(JSON.stringify(proxy)).toBe('{"count":0}');
    expect(proxy.count).toBe(0);
    expect(proxy.increment).toBeInstanceOf(Function);
    proxy.increment();
    expect(proxy.count).toBe(1);
  });
  it('does not expose object prototype methods', () => {
    const objects = [{ foo: 'bar' }];
    const proxy = mergeProxies(objects);
    expect(Reflect.has(proxy, 'foo')).toBe(true);
    expect(Reflect.has(proxy, 'hasOwnProperty')).toBe(false);
  });
  it('does expose properties on the object that match Object.prototype', () => {
    const objects = [{ valueOf: 'bar' }];
    const proxy = mergeProxies(objects);
    expect(Reflect.has(proxy, 'valueOf')).toBe(true);
  });
});
