export const debounce = <T extends (...args: Parameters<T>) => void>(
  func: T,
  wait = 400
): T => {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...(args as Parameters<T>)), wait);
  }) as T;
};
