import { render } from '../utils';

describe('x-bind', () => {
  it('sets attribute on init', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <span x-bind:foo="foo"></span>
      </div>
    `
    );
    expect($('span').getAttribute('foo')).toBe('bar');
  });
  it('works with shorthand', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: 'bar' }">
        <span :foo="foo"></span>
      </div>
    `
    );
    expect($('span').getAttribute('foo')).toBe('bar');
  });
  it('sets undefined nested keys to empty string', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data="{ foo: {} }">
        <span x-bind:foo="foo.bar"></span>
      </div>
    `
    );
    expect($('span').getAttribute('foo')).toBe('');
  });
  it('adds class attributes  to class list', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data>
        <span class="bar" :class="'foo'"></span>
      </div>
    `
    );
    expect($('span').classList.contains('bar')).toBe(true);
    expect($('span').classList.contains('foo')).toBe(true);
  });
  it('casts aria-pressed/checked attributes to string', async () => {
    const { $ } = await render(
      undefined,
      `
      <div x-data>
        <span :aria-pressed="true" :aria-checked="false"></span>
      </div>
    `
    );
    expect($('span').getAttribute('aria-pressed')).toBe('true');
    expect($('span').getAttribute('aria-checked')).toBe('false');
  });
  it('removes non-boolean attributes when set to nullish or false', async () => {
    const { $$ } = await render(
      undefined,
      `
      <div x-data>
            <a href="#hello" x-bind:href="null">null</a>
            <a href="#hello" x-bind:href="false">false</a>
            <a href="#hello" x-bind:href="undefined">undefined</a>
            <!-- custom attribute see https://github.com/alpinejs/alpine/issues/280 -->
            <span visible="true" x-bind:visible="null">null</span>
            <span visible="true" x-bind:visible="false">false</span>
            <span visible="true" x-bind:visible="undefined">undefined</span>
      </div>
    `
    );
    $$('a').forEach((a) => expect(a.getAttribute('href')).toBe(null));
    $$('span').forEach((span) =>
      expect(span.getAttribute('visible')).toBe(null)
    );
  });
  it('does not remove non-boolean on empty string', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
              <a href="#hello" x-bind:href="''">empty string</a>
        </div>
      `
    );
    expect($('a').getAttribute('href')).toBe('');
  });
  it('sets boolean attributes to their attribute name or remove', async () => {
    const { $$ } = await render(
      undefined,
      `
      <div x-data>
        <input type="checkbox" x-bind:checked="true" />
        <input type="checkbox" x-bind:checked="false" />
      </div>
    `
    );
    $$('input').forEach((input, idx) =>
      expect(input.getAttribute('checked')).toBe(idx ? null : 'checked')
    );
  });
  it('does not remove booleans on empty string', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
              <input type="checkbox" x-bind:checked="''" />
        </div>
      `
    );
    expect($('input').getAttribute('checked')).toBe('checked');
  });
  it('leaves checkboxes unchecked by default', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
              <input type="checkbox" :value="'test'" />
        </div>
      `
    );
    expect($('input').getAttribute('checked')).toBe(null);
  });
  it('leaves radios unchecked by default', async () => {
    const { $ } = await render(
      undefined,
      `
        <div x-data>
              <input type="radio" :value="'test'" />
        </div>
      `
    );
    expect($('input').getAttribute('checked')).toBe(null);
  });
  it('sets checkbox/radio values correctly', async () => {
    const values = ['foo', true, false, 1];
    const { $$ } = await render(
      (Alpine) => Alpine.data('x', () => ({ values })),
      `
      <div x-data="x">
        <template x-for="value in values">
          <input type="checkbox" x-bind:value="value" />
        </template>
        <template x-for="value in values">
          <input type="radio" x-bind:value="value" />
        </template>
      </div>
    `
    );
    $$('input').forEach((input, idx) => {
      const value = values[idx % values.length];
      expect(input.value).toBe(
        idx < values.length && typeof value === 'boolean'
          ? 'on'
          : value.toString()
      );
      expect(input.checked).toBe(
        idx < values.length && typeof value === 'boolean' && value
      );
    });
  });
});
