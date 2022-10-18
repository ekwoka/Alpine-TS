import { injectMagics } from './magics';
import { closestDataStack, mergeProxies } from './scope';
import { ElementWithXAttributes } from './types';
import { handleError, tryCatch } from './utils/error';

let shouldAutoEvaluateFunctions = true;

export const dontAutoEvaluateFunctions = (callback: () => void) => {
  const cache = shouldAutoEvaluateFunctions;

  shouldAutoEvaluateFunctions = false;

  callback();

  shouldAutoEvaluateFunctions = cache;
};

export const evaluate = <T>(
  el: ElementWithXAttributes,
  expression: string | (() => T),
  extras = {}
): T => {
  let result: T;

  evaluateLater<T>(el, expression)((value: T) => (result = value), extras);

  return result;
};

export const evaluateLater = <T>(
  el: ElementWithXAttributes,
  expression: string | (() => T)
) => theEvaluatorFunction<T>(el, expression);

type Evaluator = <T>(
  el: ElementWithXAttributes,
  expression: string | (() => T)
) => (
  callback: (value: T) => void,
  extras: { scope?: object; params?: unknown[] }
) => void;

export const setEvaluator = (newEvaluator: Evaluator) => {
  theEvaluatorFunction = newEvaluator;
};

export const normalEvaluator: Evaluator = (el, expression) => {
  const overriddenMagics = {};

  injectMagics(overriddenMagics, el);

  const dataStack: Record<string, unknown>[] = [
    overriddenMagics,
    ...closestDataStack(el),
  ];

  if (typeof expression === 'function')
    return generateEvaluatorFromFunction(dataStack, expression);

  const evaluator = generateEvaluatorFromString(dataStack, expression, el);

  return tryCatch.bind(null, el, expression, evaluator);
};

let theEvaluatorFunction: Evaluator = normalEvaluator;

export const generateEvaluatorFromFunction =
  (
    dataStack: Record<string, unknown>[],
    func: () => void
  ): ReturnType<Evaluator> =>
  <T>(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    receiver: (val: T) => void = () => {},
    { scope = {}, params = [] } = {}
  ) => {
    const result = func.apply(mergeProxies([scope, ...dataStack]), params);

    runIfTypeOfFunction(receiver, result);
  };

const evaluatorMemo: Record<string, AsyncEvaluator | Promise<void>> = {};

type AsyncEvaluator = (
  status: { finished: boolean; result: unknown },
  scope: unknown
) => Promise<unknown>;

const generateFunctionFromString = (
  expression: string,
  el: ElementWithXAttributes
) => {
  if (evaluatorMemo[expression]) return evaluatorMemo[expression];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const AsyncFunction = (async () => {}).constructor as (
    ...args: string[]
  ) => AsyncEvaluator;

  // Some expressions that are useful in Alpine are not valid as the right side of an expression.
  // Here we'll detect if the expression isn't valid for an assignement and wrap it in a self-
  // calling function so that we don't throw an error AND a "return" statement can b e used.
  const rightSideSafeExpression =
    0 ||
    // Support expressions starting with "if" statements like: "if (...) doSomething()"
    /^[\n\s]*if.*\(.*\)/.test(expression) ||
    // Support expressions starting with "let/const" like: "let foo = 'bar'"
    /^(let|const)\s/.test(expression)
      ? `(() => { ${expression} })()`
      : expression;

  const safeAsyncFunction = () => {
    try {
      return AsyncFunction(
        'status',
        'scope',
        `with (scope) { status.result = ${rightSideSafeExpression} }; status.finished = true; return status.result;`
      );
    } catch (error) {
      handleError(error, el, expression);
      return Promise.resolve();
    }
  };
  const func = safeAsyncFunction();

  evaluatorMemo[expression] = func;

  return func;
};

const generateEvaluatorFromString = (
  dataStack: Record<string, unknown>[],
  expression: string,
  el: ElementWithXAttributes
): ReturnType<Evaluator> => {
  const func = generateFunctionFromString(expression, el);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return (receiver = () => {}, { scope = {}, params = [] } = {}) => {
    const status: {
      finished: boolean;
      result: unknown;
    } = {
      result: undefined,
      finished: false,
    };

    // Run the function.

    const completeScope = mergeProxies([scope, ...dataStack]);

    if (typeof func === 'function') {
      const promise = func(status, completeScope).catch((error) =>
        handleError(error, el, expression)
      );

      // Check if the function ran synchronously,
      if (status.finished) {
        // Return the immediate result.
        runIfTypeOfFunction(receiver, status.result, completeScope, params, el);
        // Once the function has run, we clear status.result so we don't create
        // memory leaks. func is stored in the evaluatorMemo and every time
        // it runs, it assigns the evaluated expression to result which could
        // potentially store a reference to the DOM element that will be removed later on.
        status.result = undefined;
      } else {
        // If not, return the result when the promise resolves.
        promise
          .then((result) => {
            runIfTypeOfFunction(receiver, result, completeScope, params, el);
          })
          .catch((error) => handleError(error, el, expression))
          .finally(() => (status.result = undefined));
      }
    }
  };
};

export const runIfTypeOfFunction = <T>(
  receiver: (value: T) => unknown,
  value: T,
  scope?: Record<string, unknown>,
  params?: unknown[],
  el?: ElementWithXAttributes
) => {
  if (!shouldAutoEvaluateFunctions || typeof value !== 'function')
    return receiver(value);
  const result: T | Promise<T> = value.apply(scope, params);

  if (result instanceof Promise)
    return result
      .then((i) => runIfTypeOfFunction(receiver, i, scope, params))
      .catch((error) => handleError(error, el, value));

  return receiver(result);
};
