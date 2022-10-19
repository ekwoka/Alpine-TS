export const once = <T extends (...args: Parameters<T>) => void>(
  func: T,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback = () => {}
): T => {
  let called = false;
  return ((...args: Parameters<T>): void => {
    if (called) return fallback();

    called = true;
    func(...args);
  }) as T;
};
