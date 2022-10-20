import { directive } from '../directives';
import { initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { addScopeToNode } from '../scope';
import { ElementWithXAttributes } from '../types';
import { warn } from '../utils/warn';

directive('teleport', (el, { expression }, { cleanup }) => {
  if (el.tagName.toLowerCase() !== 'template')
    warn('x-teleport can only be used on a <template> tag', el);

  const target = document.querySelector(expression);

  if (!target)
    warn(`Cannot find x-teleport element for selector: "${expression}"`);

  const clone = (el.content.cloneNode(true) as Element)
    .firstElementChild as ElementWithXAttributes;

  // Add reference to element on <template x-teleport, and visa versa.
  el._x_teleport = clone;
  clone._x_teleportBack = el;

  // Forward event listeners:
  if (el._x_forwardEvents) {
    el._x_forwardEvents.forEach((eventName) => {
      clone.addEventListener(eventName, (e) => {
        e.stopPropagation();

        el.dispatchEvent(new (Object.getPrototypeOf(e).constructor)(e.type, e));
      });
    });
  }

  addScopeToNode(clone, {}, el);

  mutateDom(() => {
    target.appendChild(clone);

    initTree(clone);

    clone._x_ignore = true;
  });

  cleanup(() => clone.remove());
});
