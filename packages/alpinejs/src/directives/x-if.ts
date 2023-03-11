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
    templateEl: ElementWithXAttributes<HTMLTemplateElement>,
    { expression },
    { effect, cleanup }
  ) => {
    const evaluate = evaluateLater(templateEl, expression);

    const show = () => {
      if (templateEl._x_currentIfEl) return templateEl._x_currentIfEl;

      const clone = (
        templateEl.content.cloneNode(true) as ElementWithXAttributes
      ).firstElementChild as ElementWithXAttributes;

      addScopeToNode(clone, {}, templateEl);

      mutateDom(() => {
        templateEl.after(clone);

        initTree(clone);
      });

      templateEl._x_currentIfEl = clone;

      templateEl._x_undoIf = () => {
        walk(clone, (node) => {
          if (node._x_effects) {
            node._x_effects.forEach(dequeueJob);
          }
        });

        clone.remove();

        delete templateEl._x_currentIfEl;
      };

      return clone;
    };

    const hide = () => {
      if (!templateEl._x_undoIf) return;

      templateEl._x_undoIf();

      delete templateEl._x_undoIf;
    };

    effect(() => evaluate((value) => (value ? show() : hide())));

    cleanup(() => templateEl._x_undoIf && templateEl._x_undoIf());
  }
);
