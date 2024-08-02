import { magic } from '../magics';
import { nextTick } from '../nextTick';

magic('nextTick', () => nextTick);

declare module '../magics' {
  // biome-ignore lint/correctness/noUnusedVariables: Needed for Interface Extension
  interface Magics<T> {
    /**
     * Execute a given expression AFTER Alpine has made its reactive DOM updates.
     *
     * @param callback a callback that will be fired after Alpine finishes updating the DOM
     */
    $nextTick: (callback?: () => void) => Promise<void>;
  }
}
