import {
  monkeyPatchDomSetAttributeToAllowAtSymbols,
  setupMorph,
} from './morph';
import type { PluginCallback } from 'alpinets';

export const morphPlugin: PluginCallback = (Alpine) => {
  monkeyPatchDomSetAttributeToAllowAtSymbols();
  Alpine.morph = setupMorph(Alpine);
};

export default morphPlugin;

declare module 'alpinets' {
  export interface Alpine {
    morph: ReturnType<typeof setupMorph>;
  }
}
