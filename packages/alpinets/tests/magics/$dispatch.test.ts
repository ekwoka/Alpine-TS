import { cleanTextContent, render } from '../utils';

describe('$dispatch', () => {
  it('dispatches an event', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }" x-on:dispatched-event="foo = $event.detail">
          <button @click="$dispatch('dispatched-event', 'baz')" x-text="foo">click</button>
        </div>
      `,
    );
    expect(cleanTextContent($('div').textContent)).toBe('bar');
    await click('button');
    expect(cleanTextContent($('div').textContent)).toBe('baz');
  });
});
