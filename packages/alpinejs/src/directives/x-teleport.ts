import { skipDuringClone } from '../clone';
import { directive } from '../directives';
import { initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { addScopeToNode } from '../scope';
import { ElementWithXAttributes } from '../types';
import { warn } from '../utils/warn';

const teleportContainerDuringClone = document.createElement('div');

directive(
  'teleport',
  (
    el: ElementWithXAttributes<HTMLTemplateElement>,
    { modifiers, expression },
    { cleanup }
  ) => {
    if (el.tagName.toLowerCase() !== 'template')
      warn('x-teleport can only be used on a <template> tag', el);

    const target = skipDuringClone(
      () => document.querySelector(expression),
      () => teleportContainerDuringClone
    )();

    if (!target)
      warn(`Cannot find x-teleport element for selector: "${expression}"`);

    const clone = (el.content.cloneNode(true) as Element)
      .firstElementChild as ElementWithXAttributes;

    // Add reference to element on <template x-teleport, and visa versa.
    el._x_teleport = clone;
    clone._x_teleportBack = el;

    // Forward event listeners:
    if (el._x_forwardEvents)
      el._x_forwardEvents.forEach((eventName) =>
        clone.addEventListener(eventName, (e) => {
          e.stopPropagation();
          el.dispatchEvent(
            new (Object.getPrototypeOf(e).constructor)(e.type, e)
          );
        })
      );

    addScopeToNode(clone, {}, el);

    mutateDom(() => {
      target[getModifierMethod(modifiers)](clone);

      initTree(clone);

      // prevents the teleported node from being pulled into any component it's inserted into
      clone._x_ignore = true;
    });

    cleanup(() => clone.remove());
  }
);

const getModifierMethod = (modifiers: string[]) => {
  for (const modifier of modifiers) {
    if (modifier === 'append' || modifier === 'after') return 'after';
    if (modifier === 'prepend' || modifier === 'before') return 'before';
  }
  return 'append';
};
