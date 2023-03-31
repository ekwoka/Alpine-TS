import Alpine, { Alpine as AlpineType } from './alpine';
import { MaybeArray } from './utils';

export const plugin = (...callbacks: PluginParam[]) =>
  (callbacks as PluginFn[])
    .flat(Infinity)
    .forEach((callback) => callback(Alpine));

type PluginFn = (Alpine: AlpineType) => void;

type PluginParam = MaybeArray<PluginFn | PluginParam[]>;
