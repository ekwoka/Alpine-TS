import { render } from '../utils';

describe('$el', () => {
  it('returns the current element', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data>
          <button @click="$el.textContent = 'buzz'">fizz</span>
        </div>
      `
    );
    expect($('button').textContent).toBe('fizz');
    await click('button');
    expect($('button').textContent).toBe('buzz');
  });
});
