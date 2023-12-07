import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { destroyTree, initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { addScopeToNode } from '../scope';
import { ElementWithXAttributes } from '../types';

directive(
  'if',
  (
    templateEl: ElementWithXAttributes<HTMLTemplateElement>,
    { expression },
    { effect, cleanup },
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
        mutateDom(() => {
          destroyTree(clone);
          clone.remove();
        });

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
  },
);
