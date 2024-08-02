const tickStack: (() => void)[] = [];

let isHolding = false;

// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
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
