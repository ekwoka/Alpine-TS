export function throttle(func, limit) {
  let inThrottle;

  return function () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let context = this,
      args = arguments;

    if (!inThrottle) {
      func.apply(context, args);

      inThrottle = true;

      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
