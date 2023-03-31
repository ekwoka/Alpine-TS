import Alpine, { Alpine as AlpineType } from './alpine';
import { MaybeArray, arrayWrap } from './utils';

export const plugin = (
  callback: MaybeArray<PluginFn>,
  ...callbacks: PluginFn[]
) => {
  if (callbacks.length) plugin(callbacks);
  arrayWrap(callback).forEach((cb) => cb(Alpine));
};

type PluginFn = (Alpine: AlpineType) => void;
