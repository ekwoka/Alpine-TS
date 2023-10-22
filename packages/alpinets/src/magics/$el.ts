import { magic } from '../magics';

magic('el', (el) => el);

declare module '../magics' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Magics<T> {
    /**
     * Retrieve the current DOM node.
     */
    $el: HTMLElement;
  }
}
