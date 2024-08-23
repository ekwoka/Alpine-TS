import { skipDuringClone } from '../clone';
import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { destroyTree, initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { reactive } from '../reactivity';
import { addScopeToNode } from '../scope';
import { ElementWithXAttributes } from '../types';
import { isNumeric, isObject, parseForExpression, warn } from '../utils';
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

    el._x_lookup = new Map();
    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey));

    cleanup(() => {
      el._x_lookup.forEach((el) => {
        mutateDom(() => {
          destroyTree(el);
          el.remove();
        });
      });

      delete el._x_lookup;
    });
  },
);

const makeRefresher =
  (scope: Record<string, unknown>) => (newScope: Record<string, unknown>) => {
    Object.entries(newScope).forEach(([key, value]) => {
      scope[key] = value;
    });
  };

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
    if (isNumeric(items))
      items = Array.from({ length: items }, (_, i) => i + 1);

    if (items === undefined) items = [];

    const oldLookup = templateEl._x_lookup;
    const lookup = new Map<string, ElementWithXAttributes>();
    templateEl._x_lookup = lookup;
    const scopeEntries: [key: string, scope: Scope][] = [];

    if (isObject(items)) {
      // In order to preserve DOM elements (move instead of replace)
      // we need to generate all the keys for every iteration up
      // front. These will be our source of truth for diffing.
      Object.entries(items).forEach(([prop, value]) => {
        const scope = getIterationScopeVariables(
          iteratorNames,
          value,
          prop,
          items,
        );

        evaluateKey(
          (key) => {
            if (oldLookup.has(key)) {
              lookup.set(key, oldLookup.get(key));
              oldLookup.delete(key);
            }
            scopeEntries.push([key, scope]);
          },
          {
            scope: { index: prop, ...scope },
          },
        );
      });
    } else {
      (items as unknown[]).forEach((item, index) => {
        const scope = getIterationScopeVariables(
          iteratorNames,
          item,
          index,
          items,
        );

        evaluateKey(
          (key) => {
            if (typeof key === 'object')
              warn(
                'x-for key cannot be an object, it must be a string or an integer',
                templateEl,
              );

            if (oldLookup.has(key)) {
              lookup.set(key, oldLookup.get(key));
              oldLookup.delete(key);
            }
            scopeEntries.push([key, scope]);
          },
          {
            scope: { index, ...scope },
          },
        );
      });
    }

    mutateDom(() =>
      oldLookup.forEach((el) => {
        destroyTree(el);
        el.remove();
      }),
    );

    const added = new Set<ElementWithXAttributes>();

    let prev: HTMLElement = templateEl;
    mutateDom(() => {
      scopeEntries.forEach(([key, scope]) => {
        if (lookup.has(key)) {
          const el = lookup.get(key)!;
          el._x_refreshXForScope(scope);
          if (el.previousElementSibling !== prev) prev.after(el);
          prev = el;
          if (el._x_currentIfEl) {
            if (el.nextElementSibling !== el._x_currentIfEl)
              prev.after(el._x_currentIfEl);
            prev = el._x_currentIfEl;
          }
          return;
        }

        const clone = document.importNode(templateEl.content, true)
          .firstElementChild as ElementWithXAttributes;
        const reactiveScope = reactive(scope);
        addScopeToNode(clone, reactiveScope, templateEl);
        clone._x_refreshXForScope = makeRefresher(reactiveScope);

        lookup.set(key, clone);
        added.add(clone);

        prev.after(clone);
        prev = clone;
      });
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
