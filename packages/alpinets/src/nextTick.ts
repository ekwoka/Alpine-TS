const tickStack: (() => void)[] = [];

let isHolding = false;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const nextTick = (callback = () => {}) => {
  queueMicrotask(() => {
    isHolding ||
      setTimeout(() => {
        releaseNextTicks();
      });
  });

  return new Promise((res) => {
    tickStack.push(() => {
      callback();
      res(null);
    });
  });
};

export const releaseNextTicks = () => {
  isHolding = false;

  while (tickStack.length) tickStack.shift()();
};

export const holdNextTicks = () => {
  isHolding = true;
};
