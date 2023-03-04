import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { dequeueJob } from '../scheduler';
import { addScopeToNode } from '../scope';
import { ElementWithXAttributes } from '../types';
import { walk } from '../utils/walk';

directive(
  'if',
  (
    el: ElementWithXAttributes<HTMLTemplateElement>,
    { expression },
    { effect, cleanup }
  ) => {
    const evaluate = evaluateLater(el, expression);

    const show = () => {
      if (el._x_currentIfEl) return el._x_currentIfEl;

      const clone = (el.content.cloneNode(true) as ElementWithXAttributes)
        .firstElementChild as ElementWithXAttributes;

      addScopeToNode(clone, {}, el);

      mutateDom(() => {
        el.after(clone);

        initTree(clone);
      });

      el._x_currentIfEl = clone;

      el._x_undoIf = () => {
        walk(clone, (node) => {
          if (node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });

        clone.remove();

        delete el._x_currentIfEl;
      };

      return clone;
    };

    const hide = () => {
      if (!el._x_undoIf) return;

      el._x_undoIf();

      delete el._x_undoIf;
    };

    effect(() => evaluate((value) => (value ? show() : hide())));

    cleanup(() => el._x_undoIf && el._x_undoIf());
  }
);
