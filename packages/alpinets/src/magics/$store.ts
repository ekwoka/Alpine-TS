import { magic } from '../magics';
import { Stores, getStores } from '../store';

magic('store', getStores);

declare module '../magics' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Magics<T> {
    /**
     * Access registered global Alpine stores.
     */
    $store: Stores;
  }
}
