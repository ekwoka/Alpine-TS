import { cleanTextContent, render } from '../utils';

describe('x-if', () => {
  it('reacts to state changes', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ open: false, foo: 'baz' }">
          <button @click="open = !open"></button>
          <template x-if="open">
            <span x-text="foo">
              bar
            </span>
          </template>
        </div>
      `,
    );
    expect($('span')).toBeNull();
    await click('button');
    expect($('span')).not.toBeNull();
    expect($('span').textContent).toBe('baz');
    await click('button');
    expect($('span')).toBeNull();
  });
  it('can be nested in x-for', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ items: [false, null, 0, 1, 2, 3] }">
          <template x-for="item in items">
            <div>
              <template x-if="Boolean(item)">
                <span x-text="item">
                  bar
                </span>
              </template>
            </div>
          </template>
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('1 2 3');
  });
  it('initializes nested directives after being added to DOM', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{}">
            <template x-if="true">
                <ul x-ref="listbox" data-foo="bar">
                    <li x-text="$refs.listbox.dataset.foo"></li>
                </ul>
            </template>
        </div>
      `,
    );
    expect($('li').textContent).toBe('bar');
  });
  it('cleans up nested effects when removed', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ user: { name: 'Tony' } }">
            <template x-if="user">
                <span x-text="user.name"></span>
            </template>
            <button @click="user = null"></button>
        </div>
      `,
    );
    expect($('span').textContent).toBe('Tony');
    await click('button');
    expect($('span')).toBeNull();
  });
  it('does not skip effects when removed', async () => {
    const { $, click, type } = await render(
      undefined,
      `
        <div x-data="{ user: { name: 'Tony' }, show: true }">
          <template x-if="show">
            <input type="test" x-model="user.name">
          </template>
          <button @click="user.name = 'Stark'; show = false;"></button>
          <template x-if="show">
              <span id="one" x-text="user.name"></span>
          </template>
          <template x-if="!show">
              <span id="two" x-text="user.name"></span>
          </template>
          <template x-if="!show">
              <span id="three" x-text="JSON.stringify(user)"></span>
          </template>
        </div>
      `,
    );
    expect($('input').value).toBe('Tony');
    expect($('#one').textContent).toBe('Tony');
    expect($('#two')).toBeNull();
    expect($('#three')).toBeNull();
    await type('input', 'Tony Stark');
    expect($('#one').textContent).toBe('Tony Stark');
    await click('button');
    expect($('#one')).toBeNull();
    expect($('#two').textContent).toBe('Stark');
    expect($('#three').textContent).toBe('{"name":"Stark"}');
  });
  it('eagerly destroys tree when false', async () => {
    let triggers = 0;
    const { click } = await render(
      (Alpine) =>
        Alpine.data('destroytest', () => ({
          get username() {
            triggers++;
            return this.innerUser;
          },
          innerUser: 'Tony',
        })),
      `
        <div
          x-data="destroytest">
          <template x-if="username">
            <template x-for="num in 3">
              <span x-text="username"></span>
            </template>
          </template>
          <button type="button" @click="innerUser = ''">click here</button>
        </div>
      `,
    );
    expect(triggers).toBe(4);
    await click('button');
    expect(triggers).toBe(5);
  });
  it('cleans up nested template directives correctly', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('destroytest', () => ({
          outer: false,
          inner: false,
        })),
      `
        <div
          x-data="destroytest">
          <template x-if="outer">
          <div>
            <template x-if="inner">
              <span>Hello</span>
            </template>
            </div>
          </template>
          <button id="outer" type="button" @click="outer^=true">click here</button>
          <button id="inner" type="button" @click="inner^=true">click here</button>
        </div>
      `,
    );
    expect($('span')).toBeNull();
    await click('#inner');
    await click('#outer');
    expect($('span')).toBeDefined();
    expect($('span').textContent).toBe('Hello');
    await click('#inner');
    expect($('span')).toBeNull();
    await click('#inner');
    expect($('span')).toBeDefined();
    expect($('span').textContent).toBe('Hello');
    await click('#outer');
    expect($('span')).toBeNull();
  });
});
