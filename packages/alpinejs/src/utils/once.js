// eslint-disable-next-line @typescript-eslint/no-empty-function
export function once(callback, fallback = () => {}) {
  let called = false;

  return function () {
    if (!called) {
      called = true;

      callback.apply(this, arguments);
    } else {
      fallback.apply(this, arguments);
    }
  };
}
