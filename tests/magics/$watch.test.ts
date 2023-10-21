import { cleanTextContent, render } from '../utils';

describe('$watch', () => {
  it('runs callback on data change', async () => {
    const { $, getData, happyDOM } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: 'bar',
          init() {
            this.$watch(
              'foo',
              (val: unknown) => (this.$root.textContent = val),
            );
          },
        })),
      `
        <div x-data="x">
          notbar
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('notbar');
    getData()[0].foo = 'baz';
    await happyDOM.whenAsyncComplete();
    expect(cleanTextContent($('div').textContent)).toBe('baz');
  });
  it('passes new value and old value', async () => {
    const { $, getData, happyDOM } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: 'fizz',
          init() {
            this.$watch(
              'foo',
              (newVal: unknown, oldVal: unknown) =>
                (this.$root.textContent = `${oldVal}->${newVal}`),
            );
          },
        })),
      `
        <div x-data="x">
          notbar
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('notbar');
    getData()[0].foo = 'buzz';
    await happyDOM.whenAsyncComplete();
    expect(cleanTextContent($('div').textContent)).toBe('fizz->buzz');
  });
  it('watches nested props', async () => {
    const { $, getData, happyDOM } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: { bar: 'baz' },
          init() {
            this.$watch(
              'foo.bar',
              (newVal: unknown, oldVal: unknown) =>
                (this.$root.textContent = `${oldVal}->${newVal}`),
            );
          },
        })),
      `
        <div x-data="x">
          notbar
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('notbar');
    getData()[0].foo.bar = 'fizz';
    await happyDOM.whenAsyncComplete();
    expect(cleanTextContent($('div').textContent)).toBe('baz->fizz');
  });
  it('watches for deep changes', async () => {
    const { $, setData } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: { bar: 'baz' },
          fizz: ['buzz'],
          init() {
            this.$watch(
              'foo',
              (val: any) => (this.$root.textContent = val.bar),
            );
            this.$watch(
              'fizz',
              (val: any[]) => (this.$root.textContent = val.toString()),
            );
          },
        })),
      `
        <div x-data="x">
          notbar
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('notbar');

    await setData('foo.bar', 'fizz');
    expect(cleanTextContent($('div').textContent)).toBe('fizz');
    await setData('foo', { bar: 'buzz' });
    expect(cleanTextContent($('div').textContent)).toBe('buzz');
    await setData('foo', (foo: Record<string, string>) =>
      Object.assign(foo, { bar: 'fizz' }),
    );
    expect(cleanTextContent($('div').textContent)).toBe('fizz');
    await setData('fizz', (fizz: string[]) => fizz.push('fizz'));
    expect(cleanTextContent($('div').textContent)).toBe('buzz,fizz');
    await setData('fizz', (fizz: string[]) => fizz.shift());
    expect(cleanTextContent($('div').textContent)).toBe('fizz');
    await setData('fizz', ['1', '2', '3']);
    expect(cleanTextContent($('div').textContent)).toBe('1,2,3');
    await setData('fizz', (fizz: string[]) => fizz.sort((a, b) => +b - +a));
    expect(cleanTextContent($('div').textContent)).toBe('3,2,1');
  });
  it('watches nested Arrays', async () => {
    const { setData, getData } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          foo: [['bar']],
          bar: '',
          init() {
            this.$watch('foo[0][0]', (val: string) => (this.bar = val));
          },
        })),
      `
        <div x-data="x">
          notbar
        </div>
      `,
    );
    expect(getData(undefined, 'bar')).toBe('');
    await setData('foo.0.0', 'baz');
    expect(getData(undefined, 'bar')).toBe('baz');
    await setData('foo.0', ['fizz']);
    expect(getData(undefined, 'bar')).toBe('fizz');
    await setData('foo', [['buzz']]);
    expect(getData(undefined, 'bar')).toBe('buzz');
    await setData('foo.0', (foo: string[]) => foo.push('fizz'));
    expect(getData(undefined, 'bar')).toBe('buzz');
    await setData('foo.0', (foo: string[]) => foo.unshift('fizz'));
    expect(getData(undefined, 'bar')).toBe('fizz');
  });
  it('watch ignores dependencies in the body', async () => {
    const { getData, setData } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          a: 2,
          b: 3,
          c: 4,
          init() {
            this.$watch('a', () => (this.c = this.a + this.b));
          },
        })),
      `
        <div x-data="x">
        </div>
      `,
    );
    expect(getData(undefined, 'c')).toBe(4);
    await setData('a', 3);
    expect(getData(undefined, 'c')).toBe(6);
    await setData('b', 4);
    expect(getData(undefined, 'c')).toBe(6);
    await setData('a', 4);
    expect(getData(undefined, 'c')).toBe(8);
  });
});
