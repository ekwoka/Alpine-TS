import { render } from '../utils';

describe('$id', () => {
  it('generates a unique id', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <h1 :id="$id('foo')"></h1>
          <h2 :id="$id('foo')"></h2>
        </div>
      `
    );
    expect($('h1').id).not.toBe($('h2').id);
  });
  it('generates the same id within an id scope', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data x-id="['foo']">
          <h1 :id="$id('foo')"></h1>
          <h2 :id="$id('foo')"></h2>
        </div>
      `
    );
    expect($('h1').id).toBe($('h2').id);
  });
  it('can be further modified by keys', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data x-id="['foo']">
          <h1 :id="$id('foo', 1)"></h1>
          <h2 :id="$id('foo', 2)"></h2>
        </div>
      `
    );
    expect($('h1').id).not.toBe($('h2').id);
  });
  it('works in nested data scopes', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data x-id="['foo']">
          <h1 x-data :id="$id('foo')"></h1>
          <h2 x-data :id="$id('foo')"></h2>
        </div>
      `
    );
    expect($('h1').id).toBe($('h2').id);
  });
  it('groups scope by name', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
          <h1 :id="$id('fizz')"></h1>
          <h2 :id="$id('buzz')"></h2>
        </div>
      `
    );
    expect($('h1').id.split('-')[1]).toBe($('h2').id.split('-')[1]);
  });
  it('allows nested named scopes with different values', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data x-id="['foo', 'bar']">
          <h1 :id="$id('foo')"></h1>
          <h2 :id="$id('bar')"></h2>
          <div x-id="['foo']">
            <h3 :id="$id('foo')"></h3>
            <h4 :id="$id('bar')"></h4>
          </div>
          <h5 :id="$id('foo')"></h5>
          <h6 :id="$id('bar')"></h6>
        </div>
      `
    );
    expect($('h1').id).not.toBe($('h3').id);
    expect($('h2').id).toBe($('h4').id);
    expect($('h1').id).toBe($('h5').id);
    expect($('h2').id).toBe($('h6').id);
  });
});
