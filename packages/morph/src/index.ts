import type { PluginCallback } from '@alpinets/alpinets';
import {
  monkeyPatchDomSetAttributeToAllowAtSymbols,
  setupMorph,
} from './morph';

export const morphPlugin: PluginCallback = (Alpine) => {
  monkeyPatchDomSetAttributeToAllowAtSymbols();
  Alpine.morph = setupMorph(Alpine);
};

export default morphPlugin;

declare module '@alpinets/alpinets' {
  export interface Alpine {
    morph: ReturnType<typeof setupMorph>;
  }
}
