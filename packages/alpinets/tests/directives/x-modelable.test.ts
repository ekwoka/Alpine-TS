import { render } from '../utils';

describe('x-modelable', () => {
  it('can expose data for binding', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ outer: 'foo' }">
            <div x-data="{ inner: 'bar' }" x-modelable="inner" x-model="outer">
                <h1 x-text="outer"></h1>
                <h2 x-text="inner"></h2>

                <button @click="outer = 'bob'" outer>change inner</button>
                <button @click="inner = 'lob'" inner>change outer</button>
            </div>
        </div>
      `,
    );
    expect($('h1').textContent).toBe('foo');
    expect($('h2').textContent).toBe('foo');
    await click('[outer]');
    expect($('h1').textContent).toBe('bob');
    expect($('h2').textContent).toBe('bob');
    await click('[inner]');
    expect($('h1').textContent).toBe('lob');
    expect($('h2').textContent).toBe('lob');
  });
  it('can be bound', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ outer: 'foo', thing: {
            ['x-modelable']: 'inner',
        } }">
            <div x-data="{ inner: 'bar' }" x-bind="thing" x-model="outer">
                <h1 x-text="outer"></h1>
                <h2 x-text="inner"></h2>

                <button @click="outer = 'bob'" outer>change inner</button>
                <button @click="inner = 'lob'" inner>change outer</button>
            </div>
        </div>
    `,
    );
    expect($('h1').textContent).toBe('foo');
    expect($('h2').textContent).toBe('foo');
    await click('[outer]');
    expect($('h1').textContent).toBe('bob');
    expect($('h2').textContent).toBe('bob');
    await click('[inner]');
    expect($('h1').textContent).toBe('lob');
    expect($('h2').textContent).toBe('lob');
  });
  it('clears x-model listener', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ outer: 'foo' }">
            <div x-data="{ inner: 'bar' }" x-modelable="inner" x-model="outer">
                <h1 x-text="outer"></h1>
                <h2 x-text="inner"></h2>
                <button @click="$dispatch('input', 'baz')"></button>
            </div>
        </div>
    `,
    );
    expect($('h1').textContent).toBe('foo');
    expect($('h2').textContent).toBe('foo');
    await click('button');
    expect($('h1').textContent).toBe('foo');
    expect($('h2').textContent).toBe('foo');
  });
});
