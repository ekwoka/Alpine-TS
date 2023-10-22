import { ElementWithXAttributes } from '../types';

export type WalkerCallback = (
  el: ElementWithXAttributes,
  skip: () => void,
) => void;
export const walk = (el: ElementWithXAttributes, callback: WalkerCallback) => {
  if (typeof ShadowRoot === 'function' && el instanceof ShadowRoot)
    return Array.prototype.forEach.call(
      el.children,
      (el: ElementWithXAttributes) => walk(el, callback),
    );

  let skip = false;

  callback(el, () => (skip = true));

  if (skip) return;

  let node = el.firstElementChild as ElementWithXAttributes;

  while (node) {
    walk(node, callback);

    node = node.nextElementSibling as ElementWithXAttributes;
  }
};
