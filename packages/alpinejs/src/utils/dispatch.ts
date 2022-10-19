import { ElementWithXAttributes } from '../types';

export const dispatch = (
  el: ElementWithXAttributes | Window | Document,
  name: string,
  detail = {}
) =>
  el.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      // Allows events to pass the shadow DOM barrier.
      composed: true,
      cancelable: true,
    })
  );
