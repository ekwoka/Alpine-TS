import { monkeyPatchDomSetAttributeToAllowAtSymbols, morph } from './morph';
import type { PluginCallback } from 'alpinets';

export const morphPlugin: PluginCallback = (Alpine) => {
  monkeyPatchDomSetAttributeToAllowAtSymbols();
  Alpine.morph = morph;
};

export default morphPlugin;

declare module 'alpinets' {
  export interface Alpine {
    morph: typeof morph;
  }
}
