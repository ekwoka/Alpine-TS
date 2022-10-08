import Alpine, { Alpine as AlpineType } from './alpine';

export const plugin = (callback: PluginFn) => callback(Alpine);

type PluginFn = (Alpine: AlpineType) => void;
