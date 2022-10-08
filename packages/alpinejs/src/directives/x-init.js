import { skipDuringClone } from '../clone';
import { directive, prefix } from '../directives';
import { addInitSelector } from '../lifecycle';

addInitSelector(() => `[${prefix('init')}]`);

directive(
  'init',
  skipDuringClone((el, { expression }, { evaluate }) => {
    if (typeof expression === 'string') {
      return !!expression.trim() && evaluate(expression, {}, false);
    }

    return evaluate(expression, {}, false);
  })
);
