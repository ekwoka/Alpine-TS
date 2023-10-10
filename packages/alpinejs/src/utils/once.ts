export const once = <T extends (...args: Parameters<T>) => void>(
  func: T,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback: T = (() => {}) as T,
): T => {
  let called = false;
  return function (this: unknown, ...args: Parameters<T>): void {
    if (called) return fallback.apply(this, args);
    called = true;
    func.apply(this, args);
  } as T;
};
