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
  it('accepts an array of callbacks', () => {
    const callbacks = Array.from({ length: 3 }, () => vi.fn());
    Alpine.plugin(callbacks);
    callbacks.forEach((callback) =>
      expect(callback).toHaveBeenCalledWith(Alpine)
    );
  });
});
