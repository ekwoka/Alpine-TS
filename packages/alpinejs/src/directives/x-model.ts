import { isCloning } from '../clone';
import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { mutateDom } from '../mutation';
import { nextTick } from '../nextTick';
import { DirectiveData, ElementWithXAttributes } from '../types';
import { bind, checkedAttrLooseCompare } from '../utils/bind';
import { isNumeric, on } from '../utils/on';

export let fromModel = false;

directive(
  'model',
  (
    el: ElementWithXAttributes<HTMLInputElement>,
    { modifiers, expression },
    { effect, cleanup }
  ) => {
    const evaluate = evaluateLater<unknown>(el, expression);
    const assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
    const evaluateAssignment = evaluateLater<void>(el, assignmentExpression);

    // If the element we are binding to is a select, a radio, or checkbox
    // we'll listen for the change event instead of the "input" event.
    const event =
      el.tagName.toLowerCase() === 'select' ||
      ['checkbox', 'radio'].includes(el.type) ||
      modifiers.includes('lazy')
        ? 'change'
        : 'input';

    const assigmentFunction = generateAssignmentFunction(
      el,
      modifiers,
      expression
    );

    const removeListener = on(el, event, modifiers, (e) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      evaluateAssignment(() => {}, {
        scope: {
          $event: e,
          rightSideOfExpression: assigmentFunction,
        },
      });
    });

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
            nextTick(() => el._x_model && el._x_model.set(el.value))
          );
      cleanup(() => removeResetListener());
    }

    // Allow programmatic overiding of x-model.
    const evaluateSetModel = evaluateLater(el, `${expression} = __placeholder`);
    el._x_model = {
      get() {
        let result: unknown;
        evaluate((value) => (result = value));
        return result;
      },
      set(value) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        evaluateSetModel(() => {}, { scope: { __placeholder: value } });
      },
    };

    el._x_forceModelUpdate = () => {
      evaluate((value) => {
        // If nested model key is undefined, set the default value to empty string.
        if (value === undefined && expression.match(/\./)) value = '';

        // @todo: This is nasty
        fromModel = true;
        mutateDom(() => bind(el, 'value', value));
        fromModel = false;
      });
    };

    effect(() => {
      // Don't modify the value of the input if it's focused.
      if (
        modifiers.includes('unintrusive') &&
        document.activeElement.isSameNode(el)
      )
        return;

      el._x_forceModelUpdate();
    });
  }
);

const generateAssignmentFunction = (
  el: ElementWithXAttributes<HTMLInputElement>,
  modifiers: DirectiveData['modifiers'],
  expression: DirectiveData['expression']
) => {
  if (el.type === 'radio') {
    // Radio buttons only work properly when they share a name attribute.
    // People might assume we take care of that for them, because
    // they already set a shared "x-model" attribute.
    mutateDom(() => {
      if (!el.hasAttribute('name')) el.setAttribute('name', expression);
    });
  }

  return (event: Event, currentValue: unknown) =>
    mutateDom(() => {
      // Check for event.detail due to an issue where IE11 handles other events as a CustomEvent.
      // Safari autofill triggers event as CustomEvent and assigns value to target
      // so we return event.target.value instead of event.detail
      const eventTarget = event.target as ElementWithXAttributes &
        HTMLInputElement;
      if (event instanceof CustomEvent)
        return event.detail ?? eventTarget.value;
      if (el.type === 'checkbox') {
        // If the data we are binding to is an array, toggle its value inside the array.
        if (Array.isArray(currentValue)) {
          const newValue = modifiers.includes('number')
            ? safeParseNumber(eventTarget.value)
            : eventTarget.value;

          return eventTarget.checked
            ? currentValue.concat([newValue])
            : currentValue.filter(
                (el) => !checkedAttrLooseCompare(el, newValue)
              );
        }
        return eventTarget.checked;
      }
      if (el.tagName.toLowerCase() === 'select' && el.multiple)
        return modifiers.includes('number')
          ? Array.from(
              (eventTarget as unknown as HTMLSelectElement).selectedOptions
            ).map((option) => {
              const rawValue = option.value || option.text;
              return safeParseNumber(rawValue);
            })
          : Array.from(
              (eventTarget as unknown as HTMLSelectElement).selectedOptions
            ).map((option) => option.value || option.text);
      const rawValue = eventTarget.value;
      return modifiers.includes('number')
        ? safeParseNumber(rawValue)
        : modifiers.includes('trim')
        ? rawValue.trim()
        : rawValue;
    });
};

const safeParseNumber = (rawValue: string) => {
  const number = rawValue ? parseFloat(rawValue) : null;

  return isNumeric(number) ? number : rawValue;
};
