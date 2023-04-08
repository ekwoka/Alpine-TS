import { render } from '../utils';

describe('x-teleport', () => {
  it('teleports the tree with reactive scope', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button type="button" @click="count++">+</button>
            <template x-teleport="#target">
                <span x-text="count"></span>
            </template>
        </div>

        <section id="target"></section>
      `
    );
    expect($('section').textContent).toBe('1');
    expect($('section').firstElementChild.tagName).toBe('SPAN');
    await click('button');
    expect($('section').textContent).toBe('2');
  });
  it('can teleport multiple templates to the same target', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button type="button" @click="count++">+</button>
            <template x-teleport="#target">
                <h1 x-text="count"></h1>
            </template>
            <template x-teleport="#target">
                <h2 x-text="count+1"></h2>
            </template>
        </div>

        <section id="target"></section>
      `
    );
    expect($('section').textContent).toBe('12');
    expect($('section').firstElementChild.tagName).toBe('H1');
    expect($('section').firstElementChild.nextElementSibling.tagName).toBe(
      'H2'
    );
    await click('button');
    expect($('section').textContent).toBe('23');
  });
  it('forwards bubbled events from the teleported element to the original tempalte', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
            <template x-teleport="#target" @click="count++">
                <button x-text="count"></button>
            </template>
        </div>

        <section id="target"></section>
      `
    );
    expect($('section').textContent).toBe('1');
    await click('button');
    expect($('section').textContent).toBe('2');
  });
  it('removes clone when template is removed', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <template x-teleport="#target" @click="$el.remove()">
              <button x-text="count"></button>
          </template>
        </div>

        <section id="target"></section>
      `
    );
    expect($('section').textContent).toBe('1');
    expect($('button')).toBeDefined();
    await click('button');
    expect($('section').textContent).toBe('');
    expect($('button')).toBeNull();
  });
  it('properly assigns refs in the scope', async () => {
    const { $, click } = await render(
      undefined,
      `
          <div x-data="{ count: 1 }" @click="$refs.button.remove()">
            <template x-teleport="#target" @click>
                <button type="button" x-ref="button" x-text="count"></button>
            </template>
          </div>

          <section id="target"></section>
        `
    );
    expect($('section').textContent).toBe('1');
    await click('button');
    expect($('section').textContent).toBe('');
    expect($('button')).toBeNull();
  });
  it('properly passes the $root scope', async () => {
    const { $ } = await render(
      undefined,
      `
          <div x-data id="fizzbussin">
            <template x-teleport="#target">
                <button type="button" x-text="$root.id"></button>
            </template>
          </div>

          <section id="target"></section>
        `
    );
    expect($('section').textContent).toBe('fizzbussin');
  });
  it('properly forwards $id values to the clonted template', async () => {
    const { $ } = await render(
      undefined,
      `
          <div x-data x-id="['foo']">
            <h1 x-text="$id('foo')"></h2>
            <template x-teleport="#target">
                <h2 x-text="$id('foo')"></h2>
            </template>
          </div>

          <section id="target"></section>
        `
    );
    expect($('h1').textContent).toBe($('h2').textContent);
  });
});

describe('x-teleport modifiers', () => {
  it('can teleport after target with .append', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button type="button" @click="count++">+</button>
            <template x-teleport.append="#target">
                <span x-text="count"></span>
            </template>
        </div>

        <section id="target"></section>
      `
    );

    expect($('section').textContent).toBe('');
    expect($('section').nextElementSibling.tagName).toBe('SPAN');
    expect($('section').nextElementSibling.textContent).toBe('1');
    await click('button');
    expect($('section').nextElementSibling.textContent).toBe('2');
  });
  it('can teleport after target with .after', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button type="button" @click="count++">+</button>
            <template x-teleport.after="#target">
                <span x-text="count"></span>
            </template>
        </div>

        <section id="target"></section>
      `
    );

    expect($('section').textContent).toBe('');
    expect($('section').nextElementSibling.tagName).toBe('SPAN');
    expect($('section').nextElementSibling.textContent).toBe('1');
    await click('button');
    expect($('section').nextElementSibling.textContent).toBe('2');
  });
  it('can teleport after target with .prepend', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button type="button" @click="count++">+</button>
            <template x-teleport.prepend="#target">
                <span x-text="count"></span>
            </template>
        </div>

        <section id="target"></section>
      `
    );

    expect($('section').textContent).toBe('');
    expect($('section').previousElementSibling.tagName).toBe('SPAN');
    expect($('section').previousElementSibling.textContent).toBe('1');
    await click('button');
    expect($('section').previousElementSibling.textContent).toBe('2');
  });
  it('can teleport after target with .before', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button type="button" @click="count++">+</button>
            <template x-teleport.before="#target">
                <span x-text="count"></span>
            </template>
        </div>

        <section id="target"></section>
      `
    );

    expect($('section').textContent).toBe('');
    expect($('section').previousElementSibling.tagName).toBe('SPAN');
    expect($('section').previousElementSibling.textContent).toBe('1');
    await click('button');
    expect($('section').previousElementSibling.textContent).toBe('2');
  });
});
