import { skipDuringClone } from '../clone';
import {
  directive,
  into,
  mapAttributes,
  prefix,
  startingWith,
} from '../directives';
import { evaluateLater } from '../evaluator';
import { ElementWithXAttributes } from '../types';
import { on } from '../utils/on';

mapAttributes(startingWith('@', into(prefix('on:'))));

directive(
  'on',
  skipDuringClone(
    (
      el: ElementWithXAttributes,
      { value, modifiers, expression },
      { cleanup },
    ) => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
      const evaluate = expression ? evaluateLater(el, expression) : () => {};

      // Forward event listeners on portals.
      if (el.tagName.toLowerCase() === 'template') {
        if (!el._x_forwardEvents) el._x_forwardEvents = [];
        if (!el._x_forwardEvents.includes(value))
          el._x_forwardEvents.push(value);
      }

      const removeListener = on(el, value, modifiers, (e) => {
        // biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
        evaluate(() => {}, { scope: { $event: e }, params: [e] });
      });

      cleanup(() => removeListener());
    },
  ),
);
