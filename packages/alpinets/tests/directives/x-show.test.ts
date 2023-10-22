import { render } from '../utils';

describe('x-show', () => {
  it('toggles display: none based on expressions truthiness', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show">
                foo
            </h1>
            <button @click="show = false">hide</button>
        </div>
      `,
    );
    expect($('h1').style.display).toBe('');
    await click('button');
    expect($('h1').style.display).toBe('none');
  });
  it('evaluates on page load', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show" style="display: none;">
                foo
            </h1>
            <h2 x-show="!show">foo</h2>
            <h3 x-show="show">foo</h3>
            <h4 x-show="!show" style="display: none;">foo</h4>
        </div>
      `,
    );
    expect($('h1').style.display).toBe('');
    expect($('h2').style.display).toBe('none');
    expect($('h3').style.display).toBe('');
    expect($('h4').style.display).toBe('none');
  });
  it('does not clobber existing styles', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show" style="color: red;">
                foo
            </h1>
            <button @click="show = !show">hide</button>
        </div>
      `,
    );
    expect($('h1').style.display).toBe('');
    expect($('h1').style.color).toBe('red');
    await click('button');
    expect($('h1').style.display).toBe('none');
    expect($('h1').style.color).toBe('red');
    await click('button');
    expect($('h1').style.display).toBe('');
    expect($('h1').style.color).toBe('red');
  });
  it('waits for nested transitions before hiding and element', async () => {
    const { $, click } = await render(
      undefined,
      `
        <style>
            .transition { transition-property: background-color, border-color, color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
            .duration-100 { transition-duration: 100ms; }
        </style>
        <div x-data="{ show: true }">
            <span x-show="show">
                <h1 x-show="show" x-transition:leave="transition duration-100">thing</h1>
            </span>

            <button x-on:click="show = false"></button>
        </div>
      `,
    );
    expect($('h1').style.display).toBe('');
    await click('button');
    expect($('h1').style.display).toBe('');
    expect($('span').style.display).toBe('');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect($('h1').style.display).toBe('none');
    expect($('span').style.display).toBe('none');
  });
  it('works with x-bind:style inside x-for', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ items: [{ cleared: false }, { cleared: false }] }">
            <ul>
                <template x-for="(item, index) in items" :key="index">
                    <li :id="index" x-show="!item.cleared" x-bind:style="'flex-direction: column'">
                      <button @click="item.cleared = true"></button>
                    </li>
                </template>
            </ul>
            <button @click="show = false">hide</button>
        </div>
      `,
    );
    expect(($('li[id=0]') as HTMLLIElement).style.display).toBe('');
    expect(($('li[id=0]') as HTMLLIElement).getAttribute('style')).toBe(
      'flex-direction: column;',
    );
    expect(($('li[id=1]') as HTMLLIElement).style.display).toBe('');
    expect(($('li[id=1]') as HTMLLIElement).style.flexDirection).toBe('column');
    expect(($('li[id=1]') as HTMLLIElement).getAttribute('style')).toBe(
      'flex-direction: column;',
    );
    await click('li[id=0] button');

    expect(($('li[id=0]') as HTMLLIElement).style.display).toBe('none');
    expect(($('li[id=0]') as HTMLLIElement).style.flexDirection).toBe('column');
    expect(($('li[id=0]') as HTMLLIElement).getAttribute('style')).toBe(
      'flex-direction: column; display: none;',
    );
    expect(($('li[id=1]') as HTMLLIElement).style.display).toBe('');
    expect(($('li[id=1]') as HTMLLIElement).style.flexDirection).toBe('column');
    expect(($('li[id=1]') as HTMLLIElement).getAttribute('style')).toBe(
      'flex-direction: column;',
    );
  });
  it('takes precedence over style bindings', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show" x-bind:style="'display: flex;'">
                foo
            </h1>
            <h2 x-show="show" x-bind:style="{ display: 'flex'}">foo</h2>
            <button @click="show = !show">hide</button>
        </div>
      `,
    );
    expect($('h1').style.display).toBe('flex');
    expect($('h2').style.display).toBe('flex');
    await click('button');
    expect($('h1').style.display).toBe('none');
    expect($('h2').style.display).toBe('none');
    await click('button');
    expect($('h1').style.display).toBe('flex');
    expect($('h2').style.display).toBe('flex');
  });
  it('executes consecutive changes in correct order', async () => {
    const { $, click } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          isEnabled: false,
          init() {
            this.$watch('isEnabled', () => {
              if (this.isEnabled) this.isEnabled = false;
            });
          },
        })),
      `
        <div
          x-data="x">
          <button id="enable" x-show="!isEnabled" @click="isEnabled = true"></button>
          <button id="disable" x-show="isEnabled" @click="isEnabled = false"></button>
        </div>
      `,
    );
    expect(($('#enable') as HTMLButtonElement).style.display).toBe('');
    expect(($('#disable') as HTMLButtonElement).style.display).toBe('none');
    await click('#enable');
    expect(($('#enable') as HTMLButtonElement).style.display).toBe('');
    expect(($('#disable') as HTMLButtonElement).style.display).toBe('none');
  });
});

describe('x-show modifiers', () => {
  it('does not wait for transitions with .immediate', async () => {
    const { $, click } = await render(
      undefined,
      `
        <style>
            .transition { transition-property: background-color, border-color, color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
            .duration-100 { transition-duration: 100ms; }
        </style>
        <div x-data="{ show: true }">
            <span x-show.immediate="show">
                <h1 x-show="show" x-transition:leave="transition duration-100">thing</h1>
            </span>

            <button x-on:click="show = false"></button>
        </div>
      `,
    );
    expect($('h1').style.display).toBe('');
    await click('button');
    expect($('h1').style.display).toBe('');
    expect($('span').style.display).toBe('none');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect($('h1').style.display).toBe('none');
  });
  it('uses !important with .important', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
          <button x-show.important="show" @click="show = false"></button>
        </div>
      `,
    );
    expect($('button').style.display).toBe('');
    await click('button');
    expect($('button').style.display).toBe('none');
    expect($('button').getAttribute('style')).toBe('display: none !important;');
  });
});
