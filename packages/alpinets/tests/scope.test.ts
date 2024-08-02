import { reactive } from '@vue/reactivity';
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
      {
        get bar() {
          return this.qux.quux;
        },
        set bar(value) {
          this.qux.quux = value;
        },
      },
      {
        foo: 'bar',
        qux: {
          quux: 'quuz',
        },
      },
      {
        foo: 'buzz',
        get fizz() {
          return this.foo;
        },
        set fizz(value) {
          this.foo = value;
        },
      },
    ].map(reactive);
    const proxy = mergeProxies(objects);
    expect(proxy.bar).toBe('quuz');
    expect(proxy.foo).toBe('bar');
    expect(proxy.fizz).toBe('bar');
    proxy.fizz = 'baz';
    expect(proxy.foo).toBe('baz');
    expect(proxy.fizz).toBe('baz');
    expect(objects[1].foo).toBe('baz');
    expect(objects[2].foo).toBe('buzz');
    Reflect.set(proxy, 'bar', 'quuy');
    expect(proxy.bar).toBe('quuy');
    expect(objects[1].qux.quux).toBe('quuy');
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
});
