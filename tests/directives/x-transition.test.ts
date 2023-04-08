import { render } from '../utils';
import { IElement } from 'happy-dom';

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
            ['x-transition.opacity.duration.500']: '',
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingString"></button>
      </div>
    `
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 200));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
    ).toBe('inline-block');
    await new Promise((res) => setTimeout(res, 400));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
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
            ['x-transition.opacity.duration.500']: true,
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingTrue"></button>
      </div>
    `
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 200));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
    ).toBe('inline-block');
    await new Promise((res) => setTimeout(res, 400));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
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
            ['x-transition.opacity.duration.500']: false,
          },
        })),
      `
      <div x-data="x">
        <button x-bind="bindingFalse"></button>
      </div>
    `
    );
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
    ).toBe('inline-block');
    click('button');
    await new Promise((res) => setTimeout(res, 200));
    expect(
      window.getComputedStyle($('button') as unknown as IElement).display
    ).toBe('none');
  });
});
