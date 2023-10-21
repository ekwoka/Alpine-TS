import { morphPlugin } from '../../packages/morph/src';
import { render } from '../utils';

describe('Morph Plugin', () => {
  it('can morph DOM Trees while preserving Alpine State', async () => {
    const {
      $,
      Alpine,
      click,
      window: { happyDOM },
    } = await render(
      (Alpine) => Alpine.plugin(morphPlugin),
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
});
