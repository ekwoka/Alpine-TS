import { render, sleep } from '../utils';
import { KeyboardEvent } from 'happy-dom';

describe('x-on', () => {
  it('registers listeners', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }">
            <button @click="foo = 'buzz'"></button>
        </div>
      `
    );
    expect(getData(null, 'foo')).toBe('bar');
    await click('button');
    expect(getData(null, 'foo')).toBe('buzz');
  });
  it('can call a method without ()', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar', updateFoo() { this.foo = 'buzz' } }">
            <button @click="updateFoo"></button>
        </div>
      `
    );
    expect(getData(null, 'foo')).toBe('bar');
    await click('button');
    expect(getData(null, 'foo')).toBe('buzz');
  });
  it('passes event object', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar', updateText(e) { this.foo = e.currentTarget.dataset.text } }">
            <button @click="updateText" data-text="buzz"></button>
        </div>
      `
    );
    expect(getData(null, 'foo')).toBe('bar');
    await click('button');
    expect(getData(null, 'foo')).toBe('buzz');
  });
  it('exposed $event', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar' }">
            <button @click="foo = $event.currentTarget.dataset.text" data-text="buzz"></button>
        </div>
      `
    );
    expect(getData(null, 'foo')).toBe('bar');
    await click('button');
    expect(getData(null, 'foo')).toBe('buzz');
  });
  it('can call curried methods', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ foo: 'bar', updateWithPrefix(str) { return function(e) { this.foo = str + e.currentTarget.dataset.text } } }">
            <button @click="updateWithPrefix('fizz')" data-text="buzz"></button>
        </div>
      `
    );
    expect(getData(null, 'foo')).toBe('bar');
    await click('button');
    expect(getData(null, 'foo')).toBe('fizzbuzz');
  });
  it('reactively updates nested attributes', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ nested: { foo: 'bar' } }">
            <button @click="nested.foo = 'buzz'"></button>
            <span x-text="nested.foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('bar');
    await click('button');
    expect($('span').textContent).toBe('buzz');
  });
  it('can start with if', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ foo: '', show: false }">
            <button id="foo" @click="if (show) foo = 'bar'"></button>
            <button id="show" @click="show = true"></button>
            <span x-show="show" x-text="foo"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('');
    await click('button#foo');
    expect($('span').textContent).toBe('');
    await click('button#show');
    expect($('span').textContent).toBe('');
    await click('button#foo');
    expect($('span').textContent).toBe('bar');
  });
  it('cleans up global listeners when element removed', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
            <div @click.window="count++" x-ref="rm"></div>
            <button @click="$refs.rm.remove()" x-text="count.toString()"></button>
        </div>
      `
    );
    expect($('button').textContent).toBe('0');
    await click('div');
    expect($('button').textContent).toBe('1');
    await click('button');
    expect($('button').textContent).toBe('1');
    await click('div');
    expect($('button').textContent).toBe('1');
  });
  it('handles await in invalid right hand expressions', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ text: 'original' }">
          <button @click="let value = 'new string'; text = await Promise.resolve(value)"></button>
          <span x-text="text"></span>
        </div>
      `
    );
    expect($('span').textContent).toBe('original');
    await click('button');
    expect($('span').textContent).toBe('new string');
  });
});
describe('x-on modifiers', () => {
  it('can prevent default', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ prevented: null }">
            <button @click.prevent="prevented = $event.defaultPrevented" x-text="prevented"></button>
        </div>
      `
    );
    expect(getData(null, 'prevented')).toBe(null);
    await click('button');
    expect(getData(null, 'prevented')).toBe(true);
  });
  it('can be passive', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ prevented: null }">
            <button @click.passive="$event.preventDefault(); prevented = $event.defaultPrevented"></button>
        </div>
      `
    );
    expect(getData(null, 'prevented')).toBe(null);
    await click('button');
    expect(getData(null, 'prevented')).toBe(false);
  });
  it('can be stopped', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ stopped: null }">
            <button @click.stop="stopped = $event.cancelBubble;"></button>
        </div>
      `
    );
    expect(getData(null, 'stopped')).toBe(null);
    await click('button');
    expect(getData(null, 'stopped')).toBe(true);
  });
  it.skip('can capture', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ captured: null }">
            <button @click.capture="captured = $event.eventPhase"></button>
        </div>
      `
    );
    expect(getData(null, 'captured')).toBe(null);
    await click('button');
    expect(getData(null, 'captured')).toBe(1);
  });
  it('can act only on self event', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ self: null }">
            <button @click.self="self = true"><span @click="self = false"></span></button>
        </div>
      `
    );
    expect(getData(null, 'self')).toBe(null);
    await click('span');
    expect(getData(null, 'self')).toBe(false);
    await click('button');
    expect(getData(null, 'self')).toBe(true);
  });
  it('can listen on the window', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ window: null }">
            <button @click.window="window = true"></button>
        </div>
      `
    );
    expect(getData(null, 'window')).toBe(null);
    await click('div');
    expect(getData(null, 'window')).toBe(true);
  });
  it('can listen on the document', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ document: null }">
            <button @click.document="document = true"></button>
        </div>
      `
    );
    expect(getData(null, 'document')).toBe(null);
    await click('div');
    expect(getData(null, 'document')).toBe(true);
  });
  it('can listen only once', async () => {
    const { click, getData } = await render(
      undefined,
      `
        <div x-data="{ once: 0 }">
            <button @click.once="once++"></button>
        </div>
      `
    );
    expect(getData(null, 'once')).toBe(0);
    await click('button');
    expect(getData(null, 'once')).toBe(1);
    await click('button');
    expect(getData(null, 'once')).toBe(1);
  });
  it('can be debounced', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ debounced: 0 }">
            <button @click.debounce="debounced++"></button>
            <span x-text="debounced.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('0');
    await sleep(500);
    expect($('[x-text]').textContent).toBe('1');
  });
  it('can be throttled', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ throttled: 0 }">
            <button @click.throttle="throttled++"></button>
            <span x-text="throttled.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('1');
    await click('button');
    expect($('[x-text]').textContent).toBe('1');
    await sleep(500);
    expect($('[x-text]').textContent).toBe('1');
    await click('button');
    expect($('[x-text]').textContent).toBe('2');
  });
});

describe('@keydown / @keyup modifiers', () => {
  it('listens once on keyup', async () => {
    const { $, happyDOM } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
          <input @keyup.once="count++">
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    $('input').dispatchEvent(new Event('keyup'));
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('1');
    $('input').dispatchEvent(new Event('keyup'));
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('1');
  });
  it('listens once on keyup with key', async () => {
    const { $, happyDOM } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
          <input @keyup.enter.once="count++">
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    $('input').dispatchEvent(
      new KeyboardEvent('keyup', { key: 'a' }) as unknown as Event
    );
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('0');
    $('input').dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Enter' }) as unknown as Event
    );
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('1');
    $('input').dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Enter' }) as unknown as Event
    );
    await happyDOM.whenAsyncComplete();
    expect($('span').textContent).toBe('1');
  });
  it('discerns between different keys', async () => {
    const { $, keydown } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
          <input type="text"
            x-on:keydown="count++"
            x-on:keydown.enter="count++"
            x-on:keydown.space="count++"
            x-on:keydown.up="count++"
            x-on:keydown.down="count++"
            x-on:keydown.right="count++"
            x-on:keydown.left="count++"
            x-on:keydown.cmd="count++"
            x-on:keydown.meta="count++"
            x-on:keydown.escape="count++"
            x-on:keydown.esc="count++"
            x-on:keydown.ctrl="count++"
            x-on:keydown.slash="count++"
            x-on:keydown.period="count++"
            x-on:keydown.equal="count++"
          >
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await keydown('input', 'f');
    expect($('[x-text]').textContent).toBe('1');
    await keydown('input', 'Enter');
    expect($('[x-text]').textContent).toBe('3');
    await keydown('input', ' ');
    expect($('[x-text]').textContent).toBe('5');
    await keydown('input', 'up');
    expect($('[x-text]').textContent).toBe('7');
    await keydown('input', 'down');
    expect($('[x-text]').textContent).toBe('9');
    await keydown('input', 'right');
    expect($('[x-text]').textContent).toBe('11');
    await keydown('input', 'left');
    expect($('[x-text]').textContent).toBe('13');
    await keydown('input', 'Cmd');
    expect($('[x-text]').textContent).toBe('15');
    await keydown('input', 'esc');
    expect($('[x-text]').textContent).toBe('17');
    await keydown('input', 'ctrl');
    expect($('[x-text]').textContent).toBe('19');
    await keydown('input', '/');
    expect($('[x-text]').textContent).toBe('21');
    await keydown('input', '.');
    expect($('[x-text]').textContent).toBe('23');
    await keydown('input', '=');
    expect($('[x-text]').textContent).toBe('25');
  });
  it('discerns between space minus and underscore', async () => {
    const { $, keydown } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
            <input id="space" type="text" x-on:keydown.space="count++" />
            <input id="minus" type="text" x-on:keydown.-="count++" />
            <input id="underscore" type="text" x-on:keydown._="count++" />
            <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await keydown('#space', ' ');
    expect($('[x-text]').textContent).toBe('1');
    await keydown('#minus', '-');
    expect($('[x-text]').textContent).toBe('2');
    await keydown('#underscore', '_');
    expect($('[x-text]').textContent).toBe('3');
    await keydown('#space', '-');
    expect($('[x-text]').textContent).toBe('3');
    await keydown('#minus', ' ');
    expect($('[x-text]').textContent).toBe('3');
    await keydown('#underscore', ' ');
    expect($('[x-text]').textContent).toBe('3');
  });
  it('accepts keydown modifiers', async () => {
    const { $, keydown } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
            <input type="text" x-on:keydown.space="count++" x-on:keydown.space.ctrl="count++" />
            <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await keydown('input', ' ');
    expect($('[x-text]').textContent).toBe('1');
    await keydown('input', ' ', { ctrlKey: true });
    expect($('[x-text]').textContent).toBe('3');
  });
  it('stops only the matching key', async () => {
    const { $, keydown } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }">
            <section @keydown="count++">
              <input @keydown.g.stop />
            </section>
            <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await keydown('input', 'g');
    expect($('[x-text]').textContent).toBe('0');
    await keydown('input', 'f');
    expect($('[x-text]').textContent).toBe('1');
  });
});
describe('@click modifiers', () => {
  it('listens for clicks outside', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 1 }">
          <button @click.outside="count++" @click="count--"></button>
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('1');
    await click('button');
    expect($('[x-text]').textContent).toBe('0');
    await click('span');
    expect($('[x-text]').textContent).toBe('1');
  });
  it('does not race with x-show', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ show: false }">
          <button @click="show = true"></button>
          <span x-show="show" @click.outside="show = false"></span>
        </div>
      `
    );
    expect($('span').style.display).toBe('none');
    await click('button');
    expect($('span').style.display).toBe('');
    await click('div');
    expect($('span').style.display).toBe('none');
  });
});
describe('@window / @document modifiers', () => {
  it('listens on the window', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }" @click.window="count++">
          <button></button>
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('1');
  });
  it('listens on the document', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }" @click.document="count++">
          <button></button>
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('1');
  });
});
describe('event name behaviors', () => {
  it('handles custom events', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }" @custom-event="count++">
          <button @click="$dispatch('custom-event')"></button>
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('1');
  });
  it('handles namespaced events', async () => {
    const { $, click } = await render(
      undefined,
      `
        <div x-data="{ count: 0 }" @custom:event="count++">
          <button @click="$dispatch('custom:event')"></button>
          <span x-text="count.toString()"></span>
        </div>
      `
    );
    expect($('[x-text]').textContent).toBe('0');
    await click('button');
    expect($('[x-text]').textContent).toBe('1');
  });
  describe('.camel', () => {
    it('converts event names to camelcase', async () => {
      const { $, click } = await render(
        undefined,
        `
          <div x-data="{ count: 0 }" @custom-event.camel="count++">
            <button @click="$dispatch('customEvent')"></button>
            <span x-text="count.toString()"></span>
          </div>
        `
      );
      expect($('[x-text]').textContent).toBe('0');
      await click('button');
      expect($('[x-text]').textContent).toBe('1');
    });
    it('does not break namespaces', async () => {
      const { $, click } = await render(
        undefined,
        `
          <div x-data="{ count: 0 }" @custom:camel-event.camel="count++">
            <button @click="$dispatch('custom:camelEvent')"></button>
            <span x-text="count.toString()"></span>
          </div>
        `
      );
      expect($('[x-text]').textContent).toBe('0');
      await click('button');
      expect($('[x-text]').textContent).toBe('1');
    });
  });
  describe('.dot', () => {
    it('can convert names to dots with .dot', async () => {
      const { $, click } = await render(
        undefined,
        `
          <div x-data="{ count: 0 }" @custom-event.dot="count++">
            <button @click="$dispatch('custom.event')"></button>
            <span x-text="count.toString()"></span>
          </div>
        `
      );
      expect($('[x-text]').textContent).toBe('0');
      await click('button');
      expect($('[x-text]').textContent).toBe('1');
    });
    it('does not break namespaces', async () => {
      const { $, click } = await render(
        undefined,
        `
          <div x-data="{ count: 0 }" @custom:dot-event.dot="count++">
            <button @click="$dispatch('custom:dot.event')"></button>
            <span x-text="count.toString()"></span>
          </div>
        `
      );
      expect($('[x-text]').textContent).toBe('0');
      await click('button');
      expect($('[x-text]').textContent).toBe('1');
    });
  });
});
