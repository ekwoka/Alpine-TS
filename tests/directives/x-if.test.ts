import { render } from '../utils';

describe('x-if', () => {
  it('reacts to state changes', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ open: false, foo: 'baz' }">

          <button @click="open = true"></button>
          <template x-if="open">
            <span x-text="foo">
              bar
            </span>
          </template>
        </div>
      `
    );
    expect($('span')).toBeNull();
    await click('button');
    expect($('span')).not.toBeNull();
    expect($('span').textContent).toBe('baz');
  });
});
