import Alpine, { Alpine as AlpineType } from './alpine';

export const plugin = (...callbacks: PluginFn[]) =>
  callbacks.flat(Infinity).forEach((callback) => callback(Alpine));

type PluginFn = (Alpine: AlpineType) => void;
