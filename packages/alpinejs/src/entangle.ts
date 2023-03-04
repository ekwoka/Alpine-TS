import { effect, release } from './reactivity';

export const entangle = <T>(
  { get: outerGet, set: outerSet }: Entangler<T>,
  { get: innerGet, set: innerSet }: Entangler<T>
) => {
  let firstRun = true;
  let outerHash: string, outerHashLatest: string;

  const reference = effect(() => {
    let outer: T, inner: T;
    if (firstRun) {
      outer = outerGet();
      innerSet(outer);
      inner = innerGet();
      firstRun = false;
    } else {
      outer = outerGet();
      inner = innerGet();

      outerHashLatest = JSON.stringify(outer);

      if (outerHashLatest !== outerHash) {
        // If outer changed...
        inner = innerGet();
        innerSet(outer);
        inner = outer; // Assign inner to outer so that it can be serialized for diffing...
      } else {
        // If inner changed...
        outerSet(inner);
        outer = inner; // Assign outer to inner so that it can be serialized for diffing...
      }
    }

    // Re serialize values...
    outerHash = JSON.stringify(outer);
  });

  return () => {
    release(reference);
  };
};

type Entangler<T> = {
  get: () => T;
  set: (value: T) => void;
};
