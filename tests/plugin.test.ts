import { render } from './utils';
import { Alpine } from '@/alpinejs/alpine';

describe('Alpine.plugin', () => {
  let Alpine: Alpine;
  beforeAll(async () => {
    Alpine = (await render()).Alpine;
  });
  it('calls back with Alpine', () => {
    const callback = vi.fn();
    Alpine.plugin(callback);
    expect(callback).toHaveBeenCalledWith(Alpine);
  });
  it('calls all arguments', () => {
    const callbacks = Array.from({ length: 3 }, () => vi.fn());
    Alpine.plugin(...callbacks);
    callbacks.forEach((callback) =>
      expect(callback).toHaveBeenCalledWith(Alpine)
    );
  });
  it('accepts an array of callbacks', () => {
    const callbacks = Array.from({ length: 3 }, () => vi.fn());
    Alpine.plugin(callbacks);
    callbacks.forEach((callback) =>
      expect(callback).toHaveBeenCalledWith(Alpine)
    );
  });
  it('accepts arbitrarily nested plugin arrays', () => {
    const nested = callbacksOrNest(4, true) as (() => void)[];
    Alpine.plugin(nested);
    nested
      .flat(Infinity)
      .forEach((callback) => expect(callback).toHaveBeenCalledWith(Alpine));
  });
});

const callbacksOrNest = (n: number, force = false) => {
  if (force || (Math.random() * n) | 0)
    return Array.from({ length: (Math.random() * 10) | 0 }, () =>
      callbacksOrNest(n - 1)
    );
  return [vi.fn()];
};
