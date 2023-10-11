import { morph } from './morph';
import type { Alpine as AlpineType, PluginCallback } from 'alpinets';

export const morphPlugin: PluginCallback = (Alpine) => {
  (Alpine as AlpineType & { morph: typeof morph }).morph = morph;
};
