import { HTMLInputElement } from 'happy-dom';
import { render } from '../../../test-utils';
import { morphPlugin } from '../src';

describe('Morph Plugin', () => {
  it('can morph DOM Trees while preserving Alpine State', async () => {
    const {
      $,
      Alpine,
      click,
      window: { happyDOM },
    } = await render(
      morphPlugin,
      `
        <div x-data="{ foo: 'bar' }">
          <button @click="foo = 'baz'">Change Foo</button>
          <span x-text="foo"></span>
          <h1>Some other content</h1>
        </div>
      `,
    );

    const toHTML = $('div').outerHTML;
    $('h1').remove();
    expect($('span').textContent).toEqual('bar');
    expect($('h1')).toEqual(null);
    await click('button');
    expect($('span').textContent).toEqual('baz');
    Alpine.morph($('div'), toHTML);
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toEqual('baz');
    expect($('h1')).not.toEqual(null);
  });
  it('morphs using outer Alpine Scope', async () => {
    const {
      $,
      click,
      Alpine,
      window: { happyDOM },
    } = await render(
      morphPlugin,
      `
        <article x-data="{ foo: 'bar' }">
            <div>
                <button @click="foo = 'baz'">Change Foo</button>
                <span x-text="foo"></span>
            </div>
        </article>
      `,
    );
    const toHTML = $('div').outerHTML.replace('Change Foo', 'Changed Foo');
    expect($('span').textContent).toBe('bar');
    expect($('button').textContent).toBe('Change Foo');
    await click('button');
    expect($('span').textContent).toBe('baz');
    Alpine.morph($('div'), toHTML);
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('baz');
    expect($('button').textContent).toBe('Changed Foo');
  });
  it('preserves nested Alpine Scope', async () => {
    const {
      $,
      click,
      Alpine,
      window: { happyDOM },
    } = await render(
      morphPlugin,
      `
        <div x-data="{ foo: 'bar' }">
            <button @click="foo = 'baz'">Change Foo</button>
            <span x-text="foo"></span>

            <div x-data="{ bob: 'lob' }">
                <a href="#" @click.prevent="bob = 'law'">Change Bob</a>
                <h1 x-text="bob"></h1>
            </div>
        </div>
    `,
    );
    const toHTML = $('div').outerHTML.replaceAll('Change', 'Changed');
    (
      [
        ['button', 'Change Foo'],
        ['a', 'Change Bob'],
        ['span', 'bar'],
        ['h1', 'lob'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toBe(content),
    );
    await click('button');
    await click('a');
    (
      [
        ['span', 'baz'],
        ['h1', 'law'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toBe(content),
    );
    Alpine.morph($('div'), toHTML);
    await happyDOM.whenAsyncComplete();
    (
      [
        ['button', 'Changed Foo'],
        ['a', 'Changed Bob'],
        ['span', 'baz'],
        ['h1', 'law'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toBe(content),
    );
  });

  /**
   * Skipped due to happyDOM Support
   * Human verified in Browser
   */
  it.skip('can morph teleports', async () => {
    const {
      $,
      click,
      Alpine,
      window: { happyDOM },
    } = await render(
      morphPlugin,
      `
        <div x-data="{ count: 1 }" id="a">
          <button @click="count++">Inc</button>
          <template x-teleport="#b">
            <div>
              <h1 x-text="count"></h1>
              <h2>hey</h2>
            </div>
          </template>
        </div>
        <div id="b"></div>
      `,
    );
    const toHTML = $('div').outerHTML.replace('hey', 'there');
    (
      [
        ['h1', '1'],
        ['h2', 'hey'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toBe(content),
    );
    await click('button');
    (
      [
        ['h1', '2'],
        ['h2', 'hey'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toBe(content),
    );
    Alpine.morph($('div'), toHTML);
    await happyDOM.whenAsyncComplete();
    (
      [
        ['h1', '2'],
        ['h2', 'there'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toBe(content),
    );
  });

  /**
   * Skipped due to happyDOM Support
   * Requires `Element.isEqualNode` support
   */
  it.skip('can morph with lookahead', async () => {
    const {
      $,
      type,
      Alpine,
      window: { happyDOM, document },
    } = await render(
      morphPlugin,
      `
        <ul>
            <li>foo<input></li>
        </ul>
      `,
    );
    const toHTML = `
      <ul>
        <li>bar<input></li>
        <li>baz<input></li>
        <li>foo<input></li>
      </ul>
    `;
    await type('input', 'foo');
    Alpine.morph($('ul'), toHTML, { lookahead: true });
    await happyDOM.whenAsyncComplete();
    expect(document.querySelectorAll('li').length).toEqual(3);
    (
      [
        ['li:nth-of-type(1)', 'bar'],
        ['li:nth-of-type(2)', 'baz'],
        ['li:nth-of-type(3)', 'foo'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toEqual(content),
    );
    (
      [
        ['li:nth-of-type(1) input', ''],
        ['li:nth-of-type(2) input', ''],
        ['li:nth-of-type(3) input', 'foo'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect(($(selector) as any as HTMLInputElement).value).toEqual(content),
    );
  });

  it('can morph with keys', async () => {
    const {
      $,
      type,
      Alpine,
      window: { happyDOM, document },
    } = await render(
      morphPlugin,
      `
        <ul>
            <li key="2">foo<input></li>
        </ul>
      `,
    );
    const toHTML = `
      <ul>
        <li key="1">bar<input></li>
        <li key="3">baz<input></li>
        <li key="2">foo<input></li>
      </ul>
    `;
    await type('input', 'foo');
    Alpine.morph($('ul'), toHTML);
    await happyDOM.whenAsyncComplete();
    await Alpine.nextTick();
    expect($('ul').outerHTML.trim()).toEqual(toHTML.trim());
    expect(document.querySelectorAll('li').length).toEqual(3);
    (
      [
        ['li:nth-of-type(1)', 'bar'],
        ['li:nth-of-type(2)', 'baz'],
        ['li:nth-of-type(3)', 'foo'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect($(selector).textContent).toEqual(content),
    );
    (
      [
        ['li:nth-of-type(1) input', ''],
        ['li:nth-of-type(2) input', ''],
        ['li:nth-of-type(3) input', 'foo'],
      ] satisfies [string, string][]
    ).forEach(([selector, content]) =>
      expect(($(selector) as any as HTMLInputElement).value).toEqual(content),
    );
  });
});
