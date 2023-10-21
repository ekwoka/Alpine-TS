import { render } from '../utils';

describe('$nextTick', () => {
  it('runs code on the next tick', async () => {
    const { $, click, happyDOM } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          update() {
            this.$el.textContent = 'fizz';
            this.$nextTick(() => (this.$el.textContent = 'buzz'));
          },
        })),
      `
        <div x-data="x">
          <button @click="update">bar</button>
        </div>
      `,
    );
    expect($('button').textContent).toBe('bar');
    click('button');
    expect($('button').textContent).toBe('fizz');
    await happyDOM.whenAsyncComplete();
    await happyDOM.whenAsyncComplete();
    expect($('button').textContent).toBe('buzz');
  });
  it('waits for after x-for rendering', async () => {
    const { $, click, happyDOM } = await render(
      (Alpine) =>
        Alpine.data('x', () => ({
          items: [1, 2],
          check: 2,
          update() {
            this.items = [4, 5, 6];
            this.$nextTick(
              () => (this.check = this.$root.querySelectorAll('span').length),
            );
          },
        })),
      `
        <div x-data="x">
          <button @click="update" x-text="check"></button>
          <template x-for="item in items">
            <span x-text="item"></span>
          </template>
        </div>
      `,
    );
    expect($('button').textContent).toBe('2');
    await click('button');
    await happyDOM.whenAsyncComplete();
    expect($('button').textContent).toBe('3');
  });
  it('works with x-transition', async () => {
    const { $, click } = await render(
      (Alpine, window) =>
        Alpine.data('x', () => ({
          show: true,
          display: 'initial',
          init() {
            this.display = (
              window.document.querySelector(
                'h1',
              ) as unknown as HTMLHeadingElement
            ).style.display;
          },
          toggle() {
            this.show = !this.show;
            this.$nextTick(() => this.init());
          },
        })),
      `
          <div x-data="x">
            <h1 x-transition.duration.50 x-show="show"></h1>
            <button @click="toggle" x-text="display"></button>
          </div>
        `,
    );
    expect($('button').textContent).toBe('');
    await click('button');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect($('h1').style.display).toBe('none');
    await click('button');
    expect($('button').textContent).toBe('');
  });
});
