import { on } from '../../src/utils/on';
import { on as oldOn } from '../../src/utils/on-old';
import { bench } from 'vitest';

describe('x-on Handler Creation', () => {
  bench(
    'New',
    () => {
      const el = {
        addEventListener() {},
      };
      on(
        el as any,
        'click',
        ['prevent', 'stop', 'self', 'dot', 'camel', 'once'],
        (_e) => {},
      );
    },
    { iterations: 1, time: 160 },
  );
  bench(
    'Old',
    () => {
      const el = {
        addEventListener() {},
      };
      oldOn(
        el as any,
        'click',
        ['prevent', 'stop', 'self', 'dot', 'camel', 'once'],
        (_e) => {},
      );
    },
    { iterations: 1, time: 160 },
  );
});
describe('x-on Handler Execution', () => {
  const event = {
    type: 'click',
    target: 'hello',
    currentTarget: 'hello',
    stopPropagation() {},
    preventDefault() {},
  };
  const oldel = {
    handler: null as (e: typeof event) => void | null,
    addEventListener(event: string, handler: (e: typeof event) => void) {
      this.handler = handler;
    },
    removeEventListener() {},
  };
  oldOn(
    oldel as any,
    'click',
    ['prevent', 'stop', 'self', 'dot', 'camel', 'once'],
    (_e) => {},
  );

  const newel = {
    handler: null as (e: typeof event) => void | null,
    addEventListener(event: string, handler: (e: typeof event) => void) {
      this.handler = handler;
    },
    removeEventListener() {},
  };
  on(
    newel as any,
    'click',
    ['prevent', 'stop', 'self', 'dot', 'camel', 'once'],
    (_e) => {},
  );

  bench(
    'Old',
    () => {
      oldel.handler!(event);
    },
    { iterations: 1, time: 160 },
  );
  bench(
    'New',
    () => {
      newel.handler!(event);
    },
    { iterations: 1, time: 160 },
  );
});
