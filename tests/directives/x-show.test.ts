import { render } from '../utils';

describe('x-show', () => {
  it('toggles display: none based on expressions truthiness', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show">
                foo
            </h1>
            <button @click="show = false">hide</button>
        </div>
      `
    );
    expect($('h1').style.display).toBe('');
    await click('button');
    expect($('h1').style.display).toBe('none');
  });
  it('evaluates on page load', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show" style="display: none;">
                foo
            </h1>
            <h2 x-show="!show">foo</h2>
            <h3 x-show="show">foo</h3>
            <h4 x-show="!show" style="display: none;">foo</h4>
        </div>
      `
    );
    expect($('h1').style.display).toBe('');
    expect($('h2').style.display).toBe('none');
    expect($('h3').style.display).toBe('');
    expect($('h4').style.display).toBe('none');
  });
  it('does not clobber existing styles', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: true }">
            <h1 x-show="show" style="color: red;">
                foo
            </h1>
            <button @click="show = false">hide</button>
        </div>
      `
    );
    expect($('h1').style.display).toBe('');
    expect($('h1').style.color).toBe('red');
    await click('button');
    expect($('h1').style.display).toBe('none');
    expect($('h1').style.color).toBe('red');
  });
});
