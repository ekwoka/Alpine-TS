export const throttle = <T extends (...args: Parameters<T>) => void>(
  func: T,
  limit = 400
): T => {
  let throttled = false;
  return ((...args: Parameters<T>): void => {
    if (throttled) return;
    func(...args);
    throttled = true;
    setTimeout(() => (throttled = false), limit);
  }) as T;
};
