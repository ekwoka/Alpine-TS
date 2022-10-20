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
import { ElementWithXAttributes } from '../types';
import { bind } from '../utils/bind';

mapAttributes(startingWith(':', into(prefix('bind:'))));

directive(
  'bind',
  (el, { value, modifiers, expression, original }, { effect }) => {
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
  }
);

const storeKeyForXFor = (el: ElementWithXAttributes, expression: string) =>
  (el._x_keyExpression = expression);
