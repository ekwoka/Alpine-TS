import { noop, render } from '../utils';
import { describe, expect, it } from 'vitest';

describe('x-bind:class', () => {
  it('merges strings', async () => {
    const { $, click } = await render(
      noop,
      `
        <div x-data="{ isOn: false }">
          <span class="foo" x-bind:class="isOn ? 'bar': ''"></span>

          <button @click="isOn = ! isOn">button</button>
        </div>
      `
    );
    expect($('span').classList.contains('foo')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(false);
    await click('button');
    expect($('span').classList.contains('foo')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(true);
  });
  it('adds strings', async () => {
    const { $ } = await render(
      noop,
      `
        <div x-data="{ initialClass: 'foo' }">
          <span x-bind:class="initialClass"></span>
        </div>
      `
    );
    expect($('span').classList.contains('foo')).toBe(true);
  });
  it('adds classes from array', async () => {
    const { $ } = await render(
      noop,
      `
        <div x-data="{ initialClass: 'foo' }">
          <span x-bind:class="[initialClass, 'bar']"></span>
        </div>
      `
    );
    expect($('span').classList.contains('foo')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(true);
  });
  it('adds classes from object', async () => {
    const { $, click } = await render(
      noop,
      `
        <div x-data="{ mode: 0 }">
          <span class="foo baz"
            x-bind:class="{
                      'foo bar border-blue-900' : mode === 0,
                      'foo bar border-red-900' : mode === 1,
                      'bar border-red-900' : mode === 2,
            }"></span>
          <button @click="mode = (mode + 1) % 3">button</button>
        </div>
      `
    );
    expect($('span').classList.contains('foo')).toBe(true);
    expect($('span').classList.contains('baz')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(true);
    expect($('span').classList.contains('border-blue-900')).toBe(true);
    expect($('span').classList.contains('border-red-900')).toBe(false);
    await click('button');
    expect($('span').classList.contains('foo')).toBe(true);
    expect($('span').classList.contains('baz')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(true);
    expect($('span').classList.contains('border-blue-900')).toBe(false);
    expect($('span').classList.contains('border-red-900')).toBe(true);
    await click('button');
    expect($('span').classList.contains('foo')).toBe(false);
    expect($('span').classList.contains('baz')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(true);
    expect($('span').classList.contains('border-blue-900')).toBe(false);
    expect($('span').classList.contains('border-red-900')).toBe(true);
  });
  it('removes classes before adding', async () => {
    const { $, click } = await render(
      noop,
      `
        <div x-data="{ isOpen: true }">
          <span class="text-red" :class="isOpen ? 'block' : 'hidden'"> Span </span>
          <button @click="isOpen = !isOpen">Toggle</button>
        </div>
      `
    );
    expect($('span').classList.contains('text-red')).toBe(true);
    expect($('span').classList.contains('block')).toBe(true);
    expect($('span').classList.contains('hidden')).toBe(false);
    await click('button');
    expect($('span').classList.contains('text-red')).toBe(true);
    expect($('span').classList.contains('block')).toBe(false);
    expect($('span').classList.contains('hidden')).toBe(true);
  });
  it('ignores excess whitespace', async () => {
    const { $ } = await render(
      noop,
      `
        <div x-data>
          <span x-bind:class="'  foo  bar  '"></span>
        </div>
      `
    );
    expect($('span').classList.contains('foo')).toBe(true);
    expect($('span').classList.contains('bar')).toBe(true);
  });
  it('resolves undefined binding to empty string', async () => {
    const { $ } = await render(
      noop,
      `
        <div
          x-data="{ errorClass(hasError) { if (hasError) return'red' } }">
          <span id="error" x-bind:class="errorClass(true)">should be red</span>
          <span id="empty" x-bind:class="errorClass(false)">should be empty</span>
        </div>
      `
    );
    expect($('#error').classList.contains('red')).toBe(true);
    expect($('#empty').classList.contains('red')).toBe(false);
  });
});
