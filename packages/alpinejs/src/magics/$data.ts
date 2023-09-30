import { magic } from '../magics';
import { scope } from '../scope';

magic('data', (el) => scope(el));

declare module '../magics' {
  interface Magics<T> {
    /**
     * Access to current Alpine data.
     */
    $data: T;
  }
}
