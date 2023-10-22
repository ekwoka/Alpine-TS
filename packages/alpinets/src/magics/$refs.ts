import { magic } from '../magics';
import { mergeProxies } from '../scope';
import { ElementWithXAttributes } from '../types';

magic('refs', (el): Record<string, HTMLElement | undefined> => {
  if (el._x_refs_proxy) return el._x_refs_proxy;

  el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));

  return el._x_refs_proxy;
});

const getArrayOfRefObject = (el: ElementWithXAttributes) => {
  const refObjects: Record<string, HTMLElement>[] = [];

  let currentEl = el;

  while (currentEl) {
    if (currentEl._x_refs) refObjects.push(currentEl._x_refs);

    currentEl = currentEl.parentNode as ElementWithXAttributes;
  }

  return refObjects;
};

declare module '../magics' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Magics<T> {
    /**
     * Retrieve DOM elements marked with x-ref inside the component.
     */
    $refs: Record<string, HTMLElement | undefined>;
  }
}
