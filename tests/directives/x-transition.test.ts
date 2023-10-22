import { render } from '../utils';
import { IElement } from 'happy-dom';

describe('x-transition', () => {
  it('transitions in', async () => {
    const { $, click, Alpine } = await render(
      undefined,
      `
      <style>
        .transition { transition-property: background-color, border-color, color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .duration-100 { transition-duration: 100ms; }
      </style>
      <div x-data="{ show: false }">
        <button x-on:click="show = !show"></button>

        <span
          x-show="show"
          x-transition:enter="transition duration-100 enter"
          x-transition:enter-start="enter-start"
          x-transition:enter-end="enter-end"
        >
          thing
        </span>
      </div>
    `,
    );
    expect($('span').classList.length).toBe(0);
    click('button');
    await new Promise<void>(queueMicrotask);

    expect([...$('span').classList.values()]).toEqual(
      expect.arrayContaining([
        'enter',
        'enter-start',
        'transition',
        'duration-100',
      ]),
    );
    await Alpine.nextTick();
    expect([...$('span').classList.values()]).toEqual(
      expect.arrayContaining([
        'enter',
        'enter-end',
        'transition',
        'duration-100',
      ]),
    );
    await new Promise((res) => setTimeout(res, 110));
    expect([...$('span').classList.values()]).toEqual([]);
  });
  it('transitions out', async () => {
    const { $, click, Alpine } = await render(
      undefined,
      `
      <style>
        .transition { transition-property: background-color, border-color, color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .duration-100 { transition-duration: 100ms; }
      </style>
      <div x-data="{ show: true }">
        <button x-on:click="show = !show"></button>

        <span
          x-show="show"
          x-transition:leave="transition duration-100 leave"
          x-transition:leave-start="leave-start"
          x-transition:leave-end="leave-end"
        >
          thing
        </span>
      </div>
    `,
    );
    expect($('span').classList.length).toBe(0);
    click('button');
    await new Promise<void>(queueMicrotask);
    expect([...$('span').classList.values()]).toEqual(
      expect.arrayContaining([
        'leave',
        'leave-start',
        'transition',
        'duration-100',
      ]),
    );
    await Alpine.nextTick();
    expect([...$('span').classList.values()]).toEqual(
      expect.arrayContaining([
        'leave',
        'leave-end',
        'transition',
        'duration-100',
      ]),
    );
    await new Promise((res) => setTimeout(res, 110));
    expect([...$('span').classList.values()]).toEqual([]);
  });
  it('should transition in nested x-shows', async () => {
    const { $, click, window } = await render(
      undefined,
      `
        <style>
          .transition { transition: opacity 1s ease; }
          .opacity-0 { opacity: 0 }
          .opacity-1 { opacity: 1 }
        </style>
        <div x-data="{ show: false }">
          <button x-on:click="show = !show"></button>
          <span x-show="show">
            <h1 x-show="show"
              x-transition:enter="transition"
              x-transition:enter-start="opacity-0"
              x-transition:enter-end="opacity-1">
              thing
            </h1>
          </span>
        </div>
      `,
    );
    click('button');
    await new Promise<void>((res) => queueMicrotask(() => setTimeout(res, 0)));
    let computedStyles = window.getComputedStyle(
      $('h1') as unknown as IElement,
    );
    expect(computedStyles.display).not.toBe('none');
    expect(computedStyles.opacity).not.toBe('1');
    await window.happyDOM.whenAsyncComplete();
    computedStyles = window.getComputedStyle($('h1') as unknown as IElement);
    expect(computedStyles.display).not.toBe('none');
    expect(computedStyles.opacity).toBe('1');
  });
});
describe('x-transition in x-bind', () => {
  it('can bind with empty string', async () => {
    const { $, click, window } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          show: true,
          bindingString: {
            ['x-show']() {
              return this.show;
            },
            ['@click']() {
              this.show = false;
            },
            ['x-transition.opacity.duration.100']: '',
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingString"></button>
      </div>
    `,
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 50));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    await new Promise((res) => setTimeout(res, 60));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('none');
  });
  it('can bind with boolean true', async () => {
    const { $, click, window } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          show: true,
          bindingTrue: {
            ['x-show']() {
              return this.show;
            },
            ['@click']() {
              this.show = false;
            },
            ['x-transition.opacity.duration.100']: true,
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingTrue"></button>
      </div>
    `,
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 50));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    await new Promise((res) => setTimeout(res, 60));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('none');
  });
  it('can skip binding with boolean false', async () => {
    const { $, click, window } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          show: true,
          bindingFalse: {
            ['x-show']() {
              return this.show;
            },
            ['@click']() {
              this.show = false;
            },
            ['x-transition.opacity.duration.100']: false,
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingFalse"></button>
      </div>
    `,
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 50));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display,
    ).toBe('none');
  });
});
