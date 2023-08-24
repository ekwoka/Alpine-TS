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
});
