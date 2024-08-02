import { magic } from '../magics';

magic('el', (el) => el);

declare module '../magics' {
  // biome-ignore lint/correctness/noUnusedVariables: Needed for Interface Extension
  interface Magics<T> {
    /**
     * Retrieve the current DOM node.
     */
    $el: HTMLElement;
  }
}
