import { ElementWithXAttributes } from '../types';

export const tryCatch = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  el: ElementWithXAttributes,
  expression: string,
  callback: T,
  ...args: Parameters<T>
) => {
  try {
    return callback(...args);
  } catch (e) {
    handleError(e, el, expression);
  }
};

export const handleError = (
  error: Error,
  el: ElementWithXAttributes,
  expression: string = undefined,
) => {
  Object.assign(error, { el, expression });

  console.warn(
    `Alpine Expression Error: ${error.message}\n\n${
      expression ? 'Expression: "' + expression + '"\n\n' : ''
    }`,
    el,
  );

  setTimeout(() => {
    throw error;
  }, 0);
};
