import { formatMoney } from './money';
import { buildUp, formatInput, stripDown } from './stringManipulations';
import type {
  ElementWithXAttributes,
  PluginCallback,
  XAttributes,
} from 'alpinets';

export const maskPlugin: PluginCallback = (Alpine) => {
  Alpine.directive(
    'mask',
    (el, { value, expression }, { effect, evaluateLater }) => {
      if (!isTextInputElement(el)) return;
      let templateFn: TemplateFn = () => expression;
      let lastInputValue = '';

      queueMicrotask(() => {
        if (['function', 'dynamic'].includes(value)) {
          // This is an x-mask:function directive.

          const evaluator = evaluateLater<TemplateFn | string>(expression);

          effect(() => {
            templateFn = (input) => {
              let result: string = '';

              // We need to prevent "auto-evaluation" of functions like
              // x-on expressions do so that we can use them as mask functions.
              Alpine.dontAutoEvaluateFunctions(() => {
                evaluator(
                  (value) => {
                    result = typeof value === 'function' ? value(input) : value;
                  },
                  {
                    scope: {
                      // These are "magics" we'll make available to the x-mask:function:
                      $input: input,
                      $money: (
                        input: string,
                        delimiter = '.',
                        thousands?: string,
                        precision = 2,
                      ) => {
                        queueMicrotask(() => {
                          if (
                            el.value.endsWith(delimiter) ||
                            !el.selectionStart
                          )
                            return;

                          if (el.value[el.selectionStart - 1] === delimiter) {
                            el.setSelectionRange(
                              el.selectionStart - 1,
                              el.selectionStart - 1,
                            );
                          }
                        });
                        return formatMoney(
                          input,
                          delimiter,
                          thousands,
                          precision,
                        );
                      },
                    },
                  },
                );
              });

              return result;
            };

            // Run on initialize which serves a dual purpose:
            // - Initializing the mask on the input if it has an initial value.
            // - Running the template function to set up reactivity, so that
            //   when a dependency inside it changes, the input re-masks.
            processInputValue(el, false);
          });
        } else {
          processInputValue(el, false);
        }

        // Override x-model's initial value...
        if (isModelledInput(el)) el._x_model.set(el.value);
      });

      el.addEventListener('input', () => processInputValue(el));
      // Don't "restoreCursorPosition" on "blur", because Safari
      // will re-focus the input and cause a focus trap.
      el.addEventListener('blur', () => processInputValue(el, false));

      const processInputValue = (
        el: TextInputElement,
        shouldRestoreCursor = true,
      ) => {
        const input = el.value;

        const template = templateFn(input);

        // If a template value is `falsy`, then don't process the input value
        if (!template || template === 'false') return false;

        // If they hit backspace, don't process input.
        if (lastInputValue.length - el.value.length === 1) {
          return (lastInputValue = el.value);
        }

        const setInput = () => {
          lastInputValue = el.value = formatInput(template, input);
        };

        if (shouldRestoreCursor) {
          // When an input element's value is set, it moves the cursor to the end
          // therefore we need to track, estimate, and restore the cursor after
          // a change was made.
          restoreCursorPosition(el, template, () => {
            setInput();
          });
        } else {
          setInput();
        }
      };
    },
  ).before('model');
};

export default maskPlugin;

export const restoreCursorPosition = (
  el: TextInputElement,
  template: string,
  callback: VoidFunction,
) => {
  const cursorPosition = el.selectionStart || Infinity;
  const unformattedValue = el.value;

  callback();

  const beforeLeftOfCursorBeforeFormatting = unformattedValue.slice(
    0,
    cursorPosition,
  );

  const newPosition = buildUp(
    template,
    stripDown(template, beforeLeftOfCursorBeforeFormatting),
  ).length;

  el.setSelectionRange(newPosition, newPosition);
};

const isModelledInput = (
  el: ElementWithXAttributes,
): el is ElementWithXAttributes<TextInputElement> &
  Required<Pick<XAttributes, '_x_model'>> =>
  !!el._x_model && isTextInputElement(el);

const isTextInputElement = (
  el: ElementWithXAttributes,
): el is ElementWithXAttributes<TextInputElement> =>
  el instanceof window.HTMLInputElement ||
  el instanceof window.HTMLTextAreaElement;

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

type TemplateFn = (input: string) => string;
