export const debounce = function <T extends (...args: Parameters<T>) => void>(
  func: T,
  wait = 400,
): T {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
};
