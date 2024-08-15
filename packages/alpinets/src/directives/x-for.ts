import { skipDuringClone } from '../clone';
import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { destroyTree, initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { reactive } from '../reactivity';
import { addScopeToNode, refreshScope } from '../scope';
import { ElementWithXAttributes } from '../types';
import { isNumeric, parseForExpression, warn } from '../utils';
import type { IteratorNames } from '../utils';

directive(
  'for',
  (
    el: ElementWithXAttributes<HTMLTemplateElement>,
    { expression },
    { effect, cleanup },
  ) => {
    const iteratorNames = parseForExpression(expression);

    const evaluateItems = evaluateLater<unknown[]>(el, iteratorNames.items);
    const evaluateKey = evaluateLater<string>(
      el,
      // the x-bind:key expression is stored for our use instead of evaluated.
      el._x_keyExpression || 'index',
    );

    el._x_lookup = {};
    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey));

    cleanup(() => {
      Object.values(el._x_lookup).forEach((el) => {
        mutateDom(() => {
          destroyTree(el);
          el.remove();
        });
      });

      delete el._x_lookup;
    });
  },
);

const isObject = (i: unknown): i is Record<string, unknown> =>
  typeof i === 'object' && !Array.isArray(i);

const loop = (
  templateEl: ElementWithXAttributes<HTMLTemplateElement>,
  iteratorNames: IteratorNames,
  evaluateItems: ReturnType<typeof evaluateLater<unknown[]>>,
  evaluateKey: ReturnType<typeof evaluateLater<string>>,
) => {
  evaluateItems((items) => {
    // Prepare yourself. There's a lot going on here. Take heart,
    // every bit of complexity in this function was added for
    // the purpose of making Alpine fast with large datas.

    // Support number literals. Ex: x-for="i in 100"
    if (isNumeric(items) && items >= 0)
      items = Array.from({ length: items }, (_, i) => i + 1);

    if (items === undefined) items = [];

    const lookup = templateEl._x_lookup;
    const newFragment = new window.DocumentFragment();
    const scopeEntries: [key: string, scope: Scope][] = [];

    if (isObject(items)) {
      // In order to preserve DOM elements (move instead of replace)
      // we need to generate all the keys for every iteration up
      // front. These will be our source of truth for diffing.
      Object.entries(items).forEach(([key, value]) => {
        const scope = getIterationScopeVariables(
          iteratorNames,
          value,
          key,
          items as Record<string, unknown>[],
        );

        evaluateKey((value) => scopeEntries.push([value, scope]), {
          scope: { index: key, ...scope },
        });
      });
    } else {
      (items as unknown[]).forEach((item, index) => {
        const scope = getIterationScopeVariables(
          iteratorNames,
          item,
          index,
          items as unknown[],
        );

        evaluateKey((value) => scopeEntries.push([value, scope]), {
          scope: { index, ...scope },
        });
      });
    }

    const added: ElementWithXAttributes[] = [];
    // This is the important part of the diffing algo. Identifying
    // which keys (future DOM elements) are new, which ones have
    // or haven't moved (noting where they moved to / from).
    const newChildren = scopeEntries.flatMap(([key, scope]) => {
      if (lookup[key]) {
        const el = lookup[key];
        el._x_refreshXForScope(scope);
        if (el._x_currentIfEl) return [el, el._x_currentIfEl];
        return el;
      }

      const clone = document.importNode(templateEl.content, true)
        .firstElementChild as ElementWithXAttributes;
      const reactiveScope = reactive(scope);
      addScopeToNode(clone, reactiveScope, templateEl);
      clone._x_refreshXForScope = (newScope: Record<string, unknown>) => {
        Object.entries(newScope).forEach(([key, value]) => {
          reactiveScope[key] = value;
        });
      };

      lookup[key] = clone;
      clone._x_forKey = key;
      added.push(clone);
      return clone;
    });

    mutateDom(() => {
      newFragment.append(...newChildren);
      const removedChildren = Object.values(lookup).filter(
        (el) => !newChildren.includes(el),
      );
      Array.prototype.forEach.call(
        removedChildren,
        (el: ElementWithXAttributes) => {
          console.error('removing element', el);
          destroyTree(el);
          delete lookup[el._x_forKey];
          el.remove();
        },
      );
      templateEl.after(newFragment);
      skipDuringClone(() => added.forEach((clone) => initTree(clone)))();
    });
  });
};

type Scope = Record<string, unknown>;

const getIterationScopeVariables = (
  iteratorNames: IteratorNames,
  item: unknown,
  index: string | number,
  items: Record<string, unknown> | unknown[],
): Scope => {
  // We must create a new object, so each iteration has a new scope
  const scopeVariables: Record<string, unknown> = {};

  // Support array destructuring ([foo, bar]).
  if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
    const names = iteratorNames.item
      .replace('[', '')
      .replace(']', '')
      .split(',')
      .map((i) => i.trim());

    names.forEach((name, i) => (scopeVariables[name] = item[i]));

    // Support object destructuring ({ foo: 'oof', bar: 'rab' }).
  } else if (
    /^\{.*\}$/.test(iteratorNames.item) &&
    !Array.isArray(item) &&
    typeof item === 'object'
  ) {
    const names = iteratorNames.item
      .replace('{', '')
      .replace('}', '')
      .split(',')
      .map((i) => i.trim());

    names.forEach((name) => (scopeVariables[name] = item[name]));
  } else scopeVariables[iteratorNames.item] = item;

  if (iteratorNames.index) scopeVariables[iteratorNames.index] = index;

  if (iteratorNames.collection)
    scopeVariables[iteratorNames.collection] = items;

  return scopeVariables;
};
