import { magic } from '../magics';
import { Stores, getStores } from '../store';

magic('store', getStores);

declare module '../magics' {
  // biome-ignore lint/correctness/noUnusedVariables: Needed for Interface Extension
  interface Magics<T> {
    /**
     * Access registered global Alpine stores.
     */
    $store: Stores;
  }
}
