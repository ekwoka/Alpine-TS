import { collapse } from '../../packages/collapse/src';
import { render, sleep } from '../utils';
import { IElement } from 'happy-dom';

describe('Collapse Plugin', () => {
  it('can collapse and expand element', async () => {
    const {
      $,
      click,
      window: { getComputedStyle },
    } = await render(
      (Alpine) => Alpine.plugin(collapse),
      `
        <div x-data="{ expanded: false }">
          <button @click="expanded = ! expanded">toggle</button>
          <h1 x-show="expanded" x-collapse>
            contents <a href="#">focusable content</a>
          </h1>
        </div>
      `,
    );
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe('0px');
    expect($('h1').getAttribute('style')).toBe(
      'display: none; height: 0px; overflow: hidden;',
    );
    expect($('h1').getAttribute('hidden')).not.toBe(null);
    await click('button');
    await sleep(500);
    expect($('h1').style.height).toBe('auto');
    expect($('h1').getAttribute('hidden')).toBe(null);
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe('0px');
    expect($('h1').getAttribute('style')).toBe(
      'display: none; height: 0px; overflow: hidden;',
    );
  });

  it('can collapse and expand with a minimum height instead of "display: none"', async () => {
    const {
      $,
      click,
      window: { getComputedStyle },
    } = await render(
      (Alpine) => Alpine.plugin(collapse),
      `
      <div x-data="{ expanded: false }">
        <button @click="expanded = ! expanded">toggle</button>
        <h1 x-show="expanded" x-collapse.min.25px>
          contents <a href="#">focusable content</a>
        </h1>
      </div>
    `,
    );

    expect(getComputedStyle($('h1') as unknown as IElement).height).toEqual(
      '25px',
    );
    expect($('h1').getAttribute('hidden')).toBe(null);
    await click('button');
    await sleep(500);
    expect($('h1').style.height).not.toBe('25px');
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toEqual(
      '25px',
    );
  });

  it('avoids a race condition with @click.away', async () => {
    const {
      $,
      click,
      window: { getComputedStyle },
    } = await render(
      (Alpine) => Alpine.plugin(collapse),
      `
      <div x-data="{ show: false }">
        <button @click="show = true">Show</button>

        <h1 x-show="show" @click.away="show = false" x-collapse>h1</h1>
      </div>
    `,
    );
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe('0px');
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe(
      'auto',
    );
  });
  it('avoids race condition with @click.away and borders', async () => {
    const {
      $,
      click,
      window: { getComputedStyle },
    } = await render(
      (Alpine) => Alpine.plugin(collapse),
      `
          <div x-data="{ show: false }">
            <button @click="show = true">Show</button>

            <h1
            style="border: 1x solid"
            x-show="show"
            @click.away="show = false"
            x-collapse>
            h1
            </h1>
          </div>
        `,
    );
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe('0px');
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe(
      'auto',
    );
  });

  // https://github.com/alpinejs/alpine/issues/2335
  it('does not get mixed up by rapid condition changes', async () => {
    const {
      $,
      click,
      window: { getComputedStyle },
    } = await render(
      (Alpine) => Alpine.plugin(collapse),
      `
          <div x-data="{ expanded: false }">
            <button @click="expanded = ! expanded">toggle</button>
            <h1 x-show="expanded" x-collapse>contents</h1>
          </div>
        `,
    );
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe('0px');
    expect(getComputedStyle($('h1') as unknown as IElement).overflow).toBe(
      'hidden',
    );
    await click('button');
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe('0px');
    expect(getComputedStyle($('h1') as unknown as IElement).overflow).toBe(
      'hidden',
    );
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe(
      'auto',
    );
    await click('button');
    await click('button');
    await sleep(500);
    expect(getComputedStyle($('h1') as unknown as IElement).height).toBe(
      'auto',
    );
  });
});
