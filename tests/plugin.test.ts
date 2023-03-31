import { render } from './utils';

describe('Alpine.plugin', () => {
  let Alpine;
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
});
