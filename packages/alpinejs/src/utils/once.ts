export const once = <T extends (...args: Parameters<T>) => void>(
  func: T,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback: T = (() => {}) as T
): T => {
  let called = false;
  return ((...args: Parameters<T>): void => {
    if (called) return fallback(...args);

    called = true;
    func(...args);
  }) as T;
};
