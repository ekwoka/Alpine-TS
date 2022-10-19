import { ElementWithXAttributes } from '../types';

export const walk = (
  el: ElementWithXAttributes,
  callback: (el: ElementWithXAttributes, skip: () => void) => void
) => {
  if (typeof ShadowRoot === 'function' && el instanceof ShadowRoot)
    return Array.from(el.children).forEach((el) =>
      walk(el as ElementWithXAttributes, callback)
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
