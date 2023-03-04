import { noop, render } from './utils';

describe('entangle', () => {
  it('can entangle getter/setter pairs', async () => {
    const {
      Alpine: { nextTick, reactive, entangle },
    } = await render();
    const outer = reactive({
      foo: 'bar',
    });
    const inner = reactive({
      fizz: 'buzz',
    });
    const unbind = entangle(
      {
        get() {
          return outer.foo;
        },
        set(v) {
          outer.foo = v;
        },
      },
      {
        get() {
          return inner.fizz;
        },
        set(v) {
          inner.fizz = v;
        },
      }
    );
    expect(outer.foo).toBe('bar');
    expect(inner.fizz).toBe('bar');
    outer.foo = 'baz';
    await nextTick();
    expect(outer.foo).toBe('baz');
    expect(inner.fizz).toBe('baz');
    inner.fizz = 'fizzbuzz';
    await nextTick();
    expect(outer.foo).toBe('fizzbuzz');
    expect(inner.fizz).toBe('fizzbuzz');
    unbind();
  });
  it('can disentangle', async () => {
    const {
      Alpine: { nextTick, reactive, entangle },
    } = await render();
    const outer = reactive({
      foo: 'bar',
    });
    const inner = reactive({
      fizz: 'buzz',
    });
    const disentangle = entangle(
      {
        get() {
          return outer.foo;
        },
        set(v) {
          outer.foo = v;
        },
      },
      {
        get() {
          return inner.fizz;
        },
        set(v) {
          inner.fizz = v;
        },
      }
    );
    expect(outer.foo).toBe('bar');
    expect(inner.fizz).toBe('bar');
    outer.foo = 'baz';
    await nextTick();
    expect(outer.foo).toBe('baz');
    expect(inner.fizz).toBe('baz');
    disentangle();
    inner.fizz = 'fizzbuzz';
    await nextTick();
    expect(outer.foo).toBe('baz');
    expect(inner.fizz).toBe('fizzbuzz');
  });

  it('entangles in a component', async () => {
    const { $, type } = await render(
      noop,
      `
        <div x-data="{ outer: 'foo' }">
        <input x-model="outer" outer>

        <div x-data="{ inner: 'bar' }" x-init="Alpine.entangle(
            {
                get() { return outer },
                set(value) { outer = value },
            },
            {
                get() { return inner },
                set(value) { inner = value },
            }
        ) && console.log('entangled')">
            <input x-model="inner" inner>
        </div>
    </div>
      `
    );
    expect($<HTMLInputElement>('[outer]').value).toBe('foo');
    expect($<HTMLInputElement>('[inner]').value).toBe('foo');
    await type('[outer]', 'baz');
    expect($<HTMLInputElement>('[outer]').value).toBe('baz');
    expect($<HTMLInputElement>('[inner]').value).toBe('baz');
    await type('[inner]', 'fizzbuzz');
    expect($<HTMLInputElement>('[outer]').value).toBe('fizzbuzz');
    expect($<HTMLInputElement>('[inner]').value).toBe('fizzbuzz');
  });
});
