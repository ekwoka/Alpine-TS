import { effect, release } from './reactivity';

export const entangle = <T>(
  { get: outerGet, set: outerSet }: Entangler<T>,
  { get: innerGet, set: innerSet }: Entangler<T>,
) => {
  let firstRun = true;
  let previousHash: string | undefined;

  const reference = effect(() => {
    const outer = outerGet();
    const inner = innerGet();
    if (firstRun) {
      innerSet(cloneIfObject(outer));
      firstRun = false;
      previousHash = JSON.stringify(outer);
    } else {
      const latestHash = JSON.stringify(outer);
      if (latestHash !== previousHash) {
        innerSet(cloneIfObject(outer));
        previousHash = latestHash;
      } else {
        outerSet(cloneIfObject(inner));
        previousHash = JSON.stringify(inner);
      }
    }
    JSON.stringify(innerGet());
    JSON.stringify(outerGet());
  });

  return () => {
    release(reference);
  };
};

type Entangler<T> = {
  get: () => T;
  set: (value: T) => void;
};

const cloneIfObject = (value: unknown) => {
  return typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
};
