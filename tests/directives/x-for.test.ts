import { cleanTextContent, render } from '../utils';

describe('x-for', () => {
  it('reactively renders loops', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
        })),
      `
        <div x-data="forloop">
          <template x-for="(item, index) in items" :key="item">
            <div>
              <span x-text="item"></span>
            </div>
          </template>
          <button id="push" @click="items.push('qux')">
          </button>
          <button id="shift" @click="items.shift()">
          </button>
          <button id="inline-replace" @click="items[1] = 'fizz'">
          </button>
          <button id="replace" @click="items = ['fizz', 'buzz', 'qux']"></button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo bar baz');
    await click('#push');
    expect(cleanTextContent($('div').textContent)).toBe('foo bar baz qux');
    await click('#shift');
    expect(cleanTextContent($('div').textContent)).toBe('bar baz qux');
    await click('#inline-replace');
    expect(cleanTextContent($('div').textContent)).toBe('bar fizz qux');
    await click('#replace');
    expect(cleanTextContent($('div').textContent)).toBe('fizz buzz qux');
  });
  it('handles expressions with whitespace', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({ items: ['foo', 'bar', 'baz'] })),
      `
        <div x-data="forloop">
          <div id="one">
            <template x-for="   (
                          item
                      ) in items
                  " :key="item">
              <div>
                <span x-text="item"></span>
              </div>
            </template>
          </div>
          <div id="two">
            <template x-for=" (
                        item,
                        index
                    ) in items
                " :key="item">
              <div>
                <span x-text="item"></span>
              </div>
            </template>
          </div>
        </div>
      `
    );
    expect(cleanTextContent($('#one').textContent)).toBe('foo bar baz');
    expect(cleanTextContent($('#two').textContent)).toBe('foo bar baz');
  });
  it('removes all elements when last item is removed', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
        })),
      `
        <div x-data="forloop">
          <template x-for="item in items" :key="item">
            <div>
              <span x-text="item"></span>
            </div>
          </template>
          <button id="remove" @click="items.pop()">
          </button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo bar baz');
    await click('#remove');
    expect(cleanTextContent($('div').textContent)).toBe('foo bar');
    await click('#remove');
    expect(cleanTextContent($('div').textContent)).toBe('foo');
    await click('#remove');
    expect(cleanTextContent($('div').textContent)).toBe('');
  });
  it('removes all elements when replaced with empty array', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
        })),
      `
        <div x-data="forloop">
          <template x-for="item in items" :key="item">
            <div>
              <span x-text="item"></span>
            </div>
          </template>
          <button id="replace" @click="items = []">
          </button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo bar baz');
    await click('#replace');
    expect(cleanTextContent($('div').textContent)).toBe('');
  });
  it('produces reactive inner scopes', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
          foo: 'bar',
        })),
      `
        <div x-data="forloop">
          <template x-for="(item, idx) in items" :key="idx">
            <div>
              <span x-text="item + foo"></span>
            </div>
          </template>
          <button id="foo" @click="foo = 'baz'"></button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foobar barbar bazbar');
    await click('#foo');
    expect(cleanTextContent($('div').textContent)).toBe('foobaz barbaz bazbaz');
  });
  it('allows reactive components as children', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ items: ['first'] }">
            <template x-for="item in items">
                <div x-data="{foo: 'bar'}" class="child">
                    <span x-text="foo"></span>
                    <button x-on:click="foo = 'bob'">click me</button>
                </div>
            </template>
        </div>
      `
    );
    expect(cleanTextContent($('span').textContent)).toBe('bar');
    await click('button');
    expect(cleanTextContent($('span').textContent)).toBe('bob');
  });
  it('allows reactive inline components to be reactive', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ items: ['first'] }">
            <template x-for="item in items">
                <ul>
                    <div x-data="{foo: 'bar'}" class="child">
                        <span x-text="foo"></span>
                        <button x-on:click="foo = 'bob'">click me</button>
                    </div>
                </ul>
            </template>
        </div>
    `
    );
    expect(cleanTextContent($('span').textContent)).toBe('bar');
    await click('button');
    expect(cleanTextContent($('span').textContent)).toBe('bob');
  });
  it('exposes index inside of loop', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
        })),
      `
        <div x-data="forloop">
          <template x-for="(item, index) in items" :key="item">
            <div>
              <span x-text="String(items.indexOf(item))"></span>
              <span x-text="String(index)"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('0 0 1 1 2 2');
  });
  it('exposes collection inside of loop', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo'],
        })),
      `
        <div x-data="forloop">
          <template x-for="(item, index, collection) in items" :key="item">
            <div>
              <span x-text="items === collection"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('true');
  });
  it('provides updated scope to listener handlers', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo'],
          selected: '',
        })),
      `
        <div x-data="forloop">
          <button id="change" @click="items = ['bar']"></button>
          <template x-for="item in items" :key="item">
            <div>
              <button id="select" @click="selected = item"></button>
            </div>
          </template>
          <h1 x-text="selected"></h1>
        </div>
      `
    );
    expect(cleanTextContent($('h1').textContent)).toBe('');
    await click('#select');
    expect(cleanTextContent($('h1').textContent)).toBe('foo');
    await click('#change');
    await click('#select');
    expect(cleanTextContent($('h1').textContent)).toBe('bar');
  });
  it('can be nested', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: [
            ['foo', 'bar'],
            ['fizz', 'buzz'],
          ],
        })),
      `
        <div x-data="forloop">
          <template x-for="item, idx in items" :key="String(item)">
            <div>
              <template x-for="value in item" :key="value">
                <span x-text="value"></span>
              </template>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foobar fizzbuzz');
  });
  it('exposes outer loop to inner loop', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
        })),
      `
        <div x-data="forloop">
          <template x-for="item in items" :key="item">
            <div>
              <template x-for="value in items" :key="value">
                <div>
                  <span x-text="item + '.' + value"></span>
                </div>
              </template>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe(
      'foo.foo foo.bar foo.baz bar.foo bar.bar bar.baz baz.foo baz.bar baz.baz'
    );
  });
  it('segregates sibling loops', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
          otherItems: ['fizz', 'buzz', 'bar'],
        })),
      `
        <div x-data="forloop">
          <template x-for="item in items" :key="item">
            <div>
              <span x-text="item"></span>
            </div>
          </template>
          <template x-for="item in otherItems" :key="item">
            <div>
              <span x-text="item"></span>
            </div>
          </template>
          <button @click="otherItems.reverse(); items = ['fizz', 'buzz']">
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe(
      'foo bar baz fizz buzz bar'
    );
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe(
      'fizz buzz bar buzz fizz'
    );
  });
  it('can loop over range', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <template x-for="i in 10" :key="i">
            <div>
              <span x-text="String(i)"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('1 2 3 4 5 6 7 8 9 10');
  });
  it('handles undefined', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{items: undefined}">
          <template x-for="i in items">
            <div>
              <span x-text="String(i)"></span>
            </div>
          </template>
          <button @click="items = [2]"></button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('2');
  });
  it('works with variables that start with keywords', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{letters: ['a','b','c'], constants: ['gravity', 'taxes', 'stupidity']}">
          <template x-for="letter in letters">
            <div>
              <span x-text="letter"></span>
            </div>
          </template>
          <template x-for="constant in constants">
            <div>
              <span x-text="constant"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe(
      'a b c gravity taxes stupidity'
    );
  });
  it('can directly accept x-if as a child', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{items: ['foo', 'bar', 'baz']}">
          <template x-for="item in items" :key="item">
            <template x-if="item.includes('ba')">
              <div>
                <span x-text="item"></span>
              </div>
            </template>
          </template>
          <button @click="items.push(items.shift())"></button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('bar baz');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('bar baz');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('baz bar');
  });
  it('releases nested effects', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{
          items: [{ name: 'Tony'}],
        }">
          <template x-for="user in items" :key="user.name">
            <div>
              <span x-text="user.name"></span>
            </div>
          </template>
          <button @click="items = []">
          </button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('Tony');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('');
  });
  it('handles injected html', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: [{ name: 'Tony' }],
          html: `<span x-text="user.name"></span>`,
        })),
      `
        <div x-data="forloop">
          <template x-for="user in items" :key="user.name">
            <div x-html="html">
            </div>
          </template>
          <button @click="items = []">
          </button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('Tony');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('');
  });
});

describe('expression parser', () => {
  it('can destructure entry arrays', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: {
            foo: 'bar',
            fizz: 'buzz',
          },
        })),
      `
        <div x-data="forloop">
          <template x-for="[key, val] in Object.entries(items)" :key="key">
            <div>
              <span x-text="key"></span>:
              <span x-text="val"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo: bar fizz: buzz');
  });
  it('can destructure object array', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: [
            {
              name: 'foo',
              value: 'bar',
            },
            {
              name: 'fizz',
              value: 'buzz',
            },
          ],
        })),
      `
        <div x-data="forloop">
          <template x-for="{name, value} in items" :key="name">
            <div>
              <span x-text="name"></span>:
              <span x-text="value"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo: bar fizz: buzz');
  });
  it.skip('can nested destructure object array', async () => {
    const { $ } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: [
            {
              name: 'foo',
              value: 'bar',
            },
            {
              name: 'fizz',
              value: 'buzz',
            },
          ],
        })),
      `
        <div x-data="forloop" x-init="console.error(Object.entries(items))">
          <template x-for="[_,{name, value}] in Object.entries(items)" :key="name">
            <div>
              <span x-text="name"></span>:
              <span x-text="value"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo: bar fizz: buzz');
  });
  it('can destructure from inline object', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <template x-for="{name, value} in [{name: 'foo', value: 'bar'}, {name: 'fizz', value: 'buzz'}]" :key="name">
            <div>
              <span x-text="name"></span>:
              <span x-text="value"></span>
            </div>
          </template>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('foo: bar fizz: buzz');
  });
});

describe(':key', () => {
  it('moves elements when keyed', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
          attrMap: new WeakMap<HTMLElement, { ogIndex: number }>(),
        })),
      `
        <div x-data="forloop">
          <template x-for="(item, index) in items" :key="item">
            <div>
              <span x-text="String(attrMap.get($el)?.ogIndex ?? index)" x-init="attrMap.set($el, { ogIndex: index })"></span>
            </div>
          </template>
          <button @click="items.reverse()">
          </button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('0 1 2');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('2 1 0');
  });
  it('can key by index', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('forloop', () => ({
          items: ['foo', 'bar', 'baz'],
          attrMap: new WeakMap<HTMLElement, { ogIndex: number }>(),
        })),
      `
        <div x-data="forloop">
          <template x-for="(item, index) in items" :key="index">
            <div>
              <span x-text="String(attrMap.get($el)?.ogIndex ?? index)" x-init="attrMap.set($el, { ogIndex: index })"></span>
            </div>
          </template>
          <button @click="items.reverse()">
          </button>
        </div>
      `
    );
    expect(cleanTextContent($('div').textContent)).toBe('0 1 2');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('0 1 2');
  });
});
