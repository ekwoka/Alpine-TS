import { morph } from './morph';
import type { PluginCallback } from 'alpinets';

export const morphPlugin: PluginCallback = (Alpine) => {
  Alpine.morph = morph;
};

declare module 'alpinets' {
  interface AlpineExtras {
    morph: typeof morph;
  }
}
