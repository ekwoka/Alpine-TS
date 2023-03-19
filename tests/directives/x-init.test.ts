import { render } from '../utils';

describe('x-init', () => {
  it('runs on element initialization', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }" x-init="foo = 'baz'">
          <span x-text="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('baz');
  });
  it('can be used outside of x-data', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-init="$el.textContent = 'baz'"></div>
      `
    );
    expect($('div').textContent).toBe('baz');
  });
  it('runs before the rest of the component', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }" x-init="$refs.foo.textContent = 'fizz'">
          <span x-text="foo" x-ref="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
  });
  it('can defer changes with $nextTick', async () => {
    const { $, happyDOM } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }" x-init="$nextTick(function(){$refs.foo.textContent='fizz'})">
          <span x-text="foo" x-ref="foo"></span>
        </div>
      `
    );
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('fizz');
  });
  it('does not run on empty expressions', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }" x-init=" ">
          <span x-text="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
  });
  it('does not initialize components inside naked x-init', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-init="$el.dataset.inited = true">
          <span x-data="{ fizz: 'fizz' }" x-text="fizz" x-init="$el.textContent += 'buzz'"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('fizz');
  });
});
