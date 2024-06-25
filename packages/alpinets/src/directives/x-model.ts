import { isCloning } from '../clone';
import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { mutateDom } from '../mutation';
import { nextTick } from '../nextTick';
import { ElementWithXAttributes } from '../types';
import { bind, checkedAttrLooseCompare } from '../utils/bind';
import { isNumeric, on } from '../utils/on';

export let fromModel = false;
directive(
  'model',
  (
    el: ElementWithXAttributes<HTMLInputElement>,
    { modifiers, expression },
    { effect, cleanup },
  ) => {
    const scopeTarget = modifiers.includes('parent')
      ? (el.parentNode as ElementWithXAttributes)
      : el;
    const generateSetEvaluator = (expression: string | (() => string)) => {
      const expressionString: unknown =
        typeof expression === 'string' ? expression : expression();
      if (typeof expressionString === 'string')
        return evaluateLater(scopeTarget, `${expression} = __placeholder`);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    };
    const evaluateGet = evaluateLater<unknown>(scopeTarget, expression);
    const evaluateSet = generateSetEvaluator(expression);

    const getValue = () => {
      let result: unknown;
      evaluateGet((value) => (result = value));
      return isGetterSetter(result) ? result.get() : result;
    };

    const setValue = (value: unknown) => {
      let result;

      evaluateGet((value) => (result = value));

      if (isGetterSetter(result)) result.set(value);
      else {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        evaluateSet(() => {}, {
          scope: { __placeholder: value },
        });
      }
    };

    if (typeof expression === 'string' && el.type === 'radio') {
      // Radio buttons only work properly when they share a name attribute.
      // People might assume we take care of that for them, because
      // they already set a shared "x-model" attribute.
      mutateDom(() => {
        if (!el.hasAttribute('name')) el.setAttribute('name', expression);
      });
    }

    // If the element we are binding to is a select, a radio, or checkbox
    // we'll listen for the change event instead of the "input" event.
    const event =
      el.tagName.toLowerCase() === 'select' ||
      ['checkbox', 'radio'].includes(el.type) ||
      modifiers.includes('lazy')
        ? 'change'
        : 'input';

    const removeListener = isCloning
      ? // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {}
      : on(el, event, modifiers, (e) => {
          setValue(getInputValue(el, modifiers, e, getValue()));
        });

    if (
      modifiers.includes('fill') &&
      [null, ''].includes(getValue() as string)
    ) {
      el.dispatchEvent(new Event(event, {}));
    }

    // Register the listener removal callback on the element, so that
    // in addition to the cleanup function, x-modelable may call it.
    // Also, make this a keyed object if we decide to reintroduce
    // "named modelables" some time in a future Alpine version.
    if (!el._x_removeModelListeners) el._x_removeModelListeners = {};
    el._x_removeModelListeners['default'] = removeListener;

    cleanup(() => el._x_removeModelListeners['default']());

    // If the input/select/textarea element is linked to a form
    // we listen for the reset event on the parent form (the event
    // does not trigger on the single inputs) and update
    // on nextTick so the page doesn't end up out of sync
    if (el.form) {
      const removeResetListener = isCloning
        ? // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {}
        : on(el.form, 'reset', [], () =>
            nextTick(() => el._x_model && el._x_model.set(el.value)),
          );
      cleanup(removeResetListener);
    }

    // Allow programmatic overiding of x-model.
    el._x_model = {
      get() {
        return getValue();
      },
      set(value) {
        setValue(value);
      },
    };

    el._x_forceModelUpdate = (value) => {
      value = value === undefined ? getValue() : value;

      // If nested model key is undefined, set the default value to empty string.
      if (
        value === undefined &&
        typeof expression === 'string' &&
        expression.match(/\./)
      )
        value = '';

      // @todo: This is nasty
      fromModel = true;
      mutateDom(() => bind(el, 'value', value));
      fromModel = false;
    };

    effect(() => {
      // We need to make sure we're always "getting" the value up front,
      // so that we don't run into a situation where because of the early
      // the reactive value isn't gotten and therefore disables future reactions.
      const value = getValue();

      // Don't modify the value of the input if it's focused.
      if (
        modifiers.includes('unintrusive') &&
        document.activeElement.isSameNode(el)
      )
        return;

      el._x_forceModelUpdate(value);
    });
  },
);

const getInputValue = (
  el: ElementWithXAttributes<HTMLInputElement | HTMLSelectElement>,
  modifiers: string[],
  event: Event,
  currentValue: unknown | unknown[],
) => {
  return mutateDom(() => {
    // Check for event.detail due to an issue where IE11 handles other events as a CustomEvent.
    // Safari autofill triggers event as CustomEvent and assigns value to target
    // so we return event.target.value instead of event.detail
    if (event instanceof CustomEvent && event.detail !== undefined)
      return event.detail ?? el.value;
    else if (isCheckbox(el)) {
      // If the data we are binding to is an array, toggle its value inside the array.
      if (Array.isArray(currentValue)) {
        const newValue = modifiers.includes('number')
          ? safeParseNumber(el.value)
          : el.value;

        return el.checked
          ? currentValue.concat([newValue])
          : currentValue.filter((el) => !checkedAttrLooseCompare(el, newValue));
      } else {
        return el.checked;
      }
    } else if (isSelect(el) && el.multiple) {
      return modifiers.includes('number')
        ? Array.from(el.selectedOptions).map((option) => {
            const rawValue = option.value || option.text;
            return safeParseNumber(rawValue);
          })
        : Array.from(el.selectedOptions).map(
            (option) => option.value || option.text,
          );
    } else {
      const rawValue = el.value;
      return modifiers.includes('number')
        ? safeParseNumber(rawValue)
        : modifiers.includes('trim')
          ? rawValue.trim()
          : rawValue;
    }
  });
};

const safeParseNumber = (rawValue: string) => {
  const number = rawValue ? parseFloat(rawValue) : null;

  return isNumeric(number) ? number : rawValue;
};

const isCheckbox = (
  el: HTMLInputElement | HTMLSelectElement,
): el is HTMLInputElement => el.type === 'checkbox';

const isSelect = (
  el: HTMLInputElement | HTMLSelectElement,
): el is HTMLSelectElement => el.tagName.toLowerCase() === 'select';

const isGetterSetter = (value: unknown | GetterSetter): value is GetterSetter =>
  value !== null &&
  typeof value === 'object' &&
  typeof (value as GetterSetter).get === 'function' &&
  typeof (value as GetterSetter).set === 'function';

type GetterSetter<T = unknown> = {
  get: () => T;
  set: (val: T) => void;
};
