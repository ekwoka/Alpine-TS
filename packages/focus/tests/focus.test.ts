import { render } from '../../../test-utils';
import focusPlugin, { Focus } from '../src';

describe('Focus Plugin', () => {
  it('can focus elements', async () => {
    const { $, window, happyDOM } = await render(
      focusPlugin,
      `
        <div>
          <button id="one">First</button>
          <button id="two">Second</button>
        </div>
      `,
    );
    const $focus = new Focus($('div'));

    $focus.focus($('#two'));
    await happyDOM.whenAsyncComplete();
    expect(window.document.activeElement).toEqual($('#two'));
    expect($focus.focused()).toEqual($('#two'));
    expect($focus.lastFocused()).toEqual(undefined);

    $focus.focus($('#one'));
    await happyDOM.whenAsyncComplete();
    expect(window.document.activeElement).toEqual($('#one'));
    expect($focus.focused()).toEqual($('#one'));
    expect($focus.lastFocused()).toEqual($('#two'));
  });
  it('can focus through list of elements', async () => {
    const { $, happyDOM } = await render(
      focusPlugin,
      `
        <div>
          <button id="one">First</button>
          <button id="two">Second</button>
          <button id="three">Second</button>
        </div>
      `,
    );
    const $focus = new Focus($('div'));
    expect($focus.all().toString()).toEqual(
      [$('#one'), $('#two'), $('#three')].toString(),
    );
    expect($focus.getFirst()).toEqual($('#one'));
    expect($focus.getLast()).toEqual($('#three'));

    $focus.first();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#one'));
    expect($focus.getNext()).toEqual($('#two'));
    expect($focus.getPrevious()).toEqual(undefined);

    $focus.next();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#two'));
    expect($focus.getNext()).toEqual($('#three'));
    expect($focus.getPrevious()).toEqual($('#one'));

    $focus.last();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#three'));
    expect($focus.getNext()).toEqual(undefined);
    expect($focus.getPrevious()).toEqual($('#two'));

    $focus.previous();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#two'));
    expect($focus.getNext()).toEqual($('#three'));
    expect($focus.getPrevious()).toEqual($('#one'));
  });
  it('can wrap focus around list', async () => {
    const { $, happyDOM } = await render(
      focusPlugin,
      `
        <div>
          <button id="one">First</button>
          <button id="two">Second</button>
          <button id="three">Second</button>
        </div>
      `,
    );
    const $focus = new Focus($('div')).wrap();

    $focus.first();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#one'));

    $focus.next();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#two'));

    $focus.next();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#three'));

    $focus.next();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#one'));

    $focus.previous();
    await happyDOM.whenAsyncComplete();
    expect($focus.focused()).toEqual($('#three'));
  });

  /**
   * Skipped due to Tabbable not working in a lazy initialized happydom environment
   */
  it.skip('can identify focusables', async () => {
    const { $ } = await render(
      focusPlugin,
      `
        <div>
          <button id="one">First</button>
        </div>
      `,
    );
    const $focus = new Focus($('div'));
    expect($focus.focusable($('div'))).toBe(false);
    expect($focus.focusable($('button'))).toBe(false);
  });
});
