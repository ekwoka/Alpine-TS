import { effect, release } from './reactivity';

export const entangle = <T>(
  { get: outerGet, set: outerSet }: Entangler<T>,
  { get: innerGet, set: innerSet }: Entangler<T>,
) => {
  let firstRun = true;
  let previous: T;

  const reference = effect(() => {
    const outer = outerGet();
    const inner = innerGet();
    if (firstRun) {
      innerSet(outer); // We need to break internal references using parse/stringify... (do we though?)
      firstRun = false;
      previous = outer;
    } else if (outer !== previous) innerSet((previous = outer));
    else outerSet((previous = inner));
  });

  return () => {
    release(reference);
  };
};

type Entangler<T> = {
  get: () => T;
  set: (value: T) => void;
};
