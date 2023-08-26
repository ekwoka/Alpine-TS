import Alpine, { Alpine as AlpineType } from './alpine';

export const plugin = (callbacks: PluginParam) =>
  (Array.isArray(callbacks) ? callbacks : [callbacks]).forEach((callback) =>
    callback(Alpine)
  );

type PluginFn = (Alpine: AlpineType) => void;

type PluginParam = PluginFn | PluginFn[];
