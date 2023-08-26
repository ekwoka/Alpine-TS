import {
  Bindings,
  applyBindingsObject,
  injectBindingProviders,
} from '../binds';
import {
  directive,
  into,
  mapAttributes,
  prefix,
  startingWith,
} from '../directives';
import { evaluateLater } from '../evaluator';
import { mutateDom } from '../mutation';
import { DirectiveCallback, ElementWithXAttributes } from '../types';
import { bind } from '../utils/bind';

mapAttributes(startingWith(':', into(prefix('bind:'))));

const handler: DirectiveCallback & { inline: DirectiveCallback } = (
  el,
  { value, modifiers, expression, original },
  { effect }
) => {
  if (!value) {
    const bindingProviders = {};
    injectBindingProviders(bindingProviders);

    const getBindings = evaluateLater<Bindings>(el, expression);

    getBindings(
      (bindings) => {
        applyBindingsObject(el, bindings, original);
      },
      { scope: bindingProviders }
    );

    return;
  }

  if (value === 'key') return storeKeyForXFor(el, expression);

  if (el._x_inlineBindings?.[value]?.extract) return;

  const evaluate = evaluateLater<string>(el, expression);

  effect(() =>
    evaluate((result) => {
      // If nested object key is undefined, set the default value to empty string.
      if (
        result === undefined &&
        typeof expression === 'string' &&
        expression.match(/\./)
      ) {
        result = '';
      }

      mutateDom(() => bind(el, value, result, modifiers));
    })
  );
};

handler.inline = (el, { value, expression }) => {
  if (!value) return;

  if (!el._x_inlineBindings) el._x_inlineBindings = {};

  el._x_inlineBindings[value] = { expression, extract: false };
};

directive('bind', handler);

const storeKeyForXFor = (el: ElementWithXAttributes, expression: string) =>
  (el._x_keyExpression = expression);
