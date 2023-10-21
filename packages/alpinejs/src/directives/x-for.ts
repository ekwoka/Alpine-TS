import { directive } from '../directives';
import { evaluateLater } from '../evaluator';
import { initTree } from '../lifecycle';
import { mutateDom } from '../mutation';
import { reactive } from '../reactivity';
import { dequeueJob } from '../scheduler';
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

    el._x_prevKeys = [];
    el._x_lookup = {};

    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey));

    cleanup(() => {
      Object.values(el._x_lookup).forEach((el) => el.remove());

      delete el._x_prevKeys;
      delete el._x_lookup;
    });
  },
);

const loop = (
  templateEl: ElementWithXAttributes<HTMLTemplateElement>,
  iteratorNames: IteratorNames,
  evaluateItems: ReturnType<typeof evaluateLater<unknown[]>>,
  evaluateKey: ReturnType<typeof evaluateLater<string>>,
) => {
  const isObject = (i: unknown): i is Record<string, unknown> =>
    typeof i === 'object' && !Array.isArray(i);

  evaluateItems((items) => {
    // Prepare yourself. There's a lot going on here. Take heart,
    // every bit of complexity in this function was added for
    // the purpose of making Alpine fast with large datas.

    // Support number literals. Ex: x-for="i in 100"
    if (isNumeric(items) && items >= 0)
      items = Array.from({ length: items }, (_, i) => i + 1);

    if (items === undefined) items = [];

    const lookup = templateEl._x_lookup;
    let prevKeys = templateEl._x_prevKeys;
    const scopes: Scope[] = [];
    const keys: string[] = [];

    // In order to preserve DOM elements (move instead of replace)
    // we need to generate all the keys for every iteration up
    // front. These will be our source of truth for diffing.
    if (isObject(items)) {
      items = Object.entries(items).map(([key, value]) => {
        const scope = getIterationScopeVariables(
          iteratorNames,
          value,
          key,
          items as Record<string, unknown>[],
        );

        evaluateKey((value) => keys.push(value), {
          scope: { index: key, ...scope },
        });

        scopes.push(scope);
      });
    } else {
      (items as unknown[]).forEach((item, index) => {
        const scope = getIterationScopeVariables(
          iteratorNames,
          item,
          index,
          items as unknown[],
        );

        evaluateKey((value) => keys.push(value), {
          scope: { index, ...scope },
        });

        scopes.push(scope);
      });
    }

    // Rather than making DOM manipulations inside one large loop, we'll
    // instead track which mutations need to be made in the following
    // arrays. After we're finished, we can batch them at the end.
    const adds: [string, number][] = [];
    const moves: [string, string][] = [];
    const removes: string[] = [];
    const sames: string[] = [];

    // First, we track elements that will need to be removed.
    prevKeys.forEach((key) => keys.indexOf(key) === -1 && removes.push(key));

    // Notice we're mutating prevKeys as we go. This makes it
    // so that we can efficiently make incremental comparisons.
    prevKeys = prevKeys.filter((key) => !removes.includes(key));

    let lastKey = 'template';

    // This is the important part of the diffing algo. Identifying
    // which keys (future DOM elements) are new, which ones have
    // or haven't moved (noting where they moved to / from).
    keys.forEach((key, index) => {
      const prevIndex = prevKeys.indexOf(key);

      if (prevIndex === -1) {
        // New key found.
        prevKeys.splice(index, 0, key);

        adds.push([lastKey, index]);
      } else if (prevIndex !== index) {
        // A key has moved.
        const keyInSpot = prevKeys.splice(index, 1)[0];
        const keyForSpot = prevKeys.splice(prevIndex - 1, 1)[0];

        prevKeys.splice(index, 0, keyForSpot);
        prevKeys.splice(prevIndex, 0, keyInSpot);

        moves.push([keyInSpot, keyForSpot]);
      } else {
        // This key hasn't moved, but we'll still keep track
        // so that we can refresh it later on.
        sames.push(key);
      }

      lastKey = key;
    });

    // Now that we've done the diffing work, we can apply the mutations
    // in batches for both separating types work and optimizing
    // for browser performance.

    // We'll remove all the nodes that need to be removed,
    // letting the mutation observer pick them up and
    // clean up any side effects they had.
    removes.forEach((key) => {
      // Remove any queued effects that might run after the DOM node has been removed.
      if (lookup[key]._x_effects) lookup[key]._x_effects.forEach(dequeueJob);

      lookup[key].remove();

      lookup[key] = null;
      delete lookup[key];
    });

    // Here we'll move elements around, skipping
    // mutation observer triggers by using "mutateDom".
    moves.forEach(([keyInSpot, keyForSpot]) => {
      const elInSpot = lookup[keyInSpot];
      const elForSpot = lookup[keyForSpot];

      const marker = document.createElement('div');

      mutateDom(() => {
        elForSpot.after(marker);
        elInSpot.after(elForSpot);
        elForSpot._x_currentIfEl && elForSpot.after(elForSpot._x_currentIfEl);
        marker.before(elInSpot);
        elInSpot._x_currentIfEl && elInSpot.after(elInSpot._x_currentIfEl);
        marker.remove();
      });

      refreshScope(elForSpot, scopes[keys.indexOf(keyForSpot)], true);
    });

    // We can now create and add new elements.
    adds.forEach(([lastKey, index]) => {
      let lastEl = lastKey === 'template' ? templateEl : lookup[lastKey];
      // If the element is a x-if template evaluated to true,
      // point lastEl to the if-generated node
      if (lastEl._x_currentIfEl) lastEl = lastEl._x_currentIfEl;

      const scope = scopes[index];
      const key = keys[index];

      const clone = document.importNode(templateEl.content, true)
        .firstElementChild as ElementWithXAttributes;

      addScopeToNode(clone, reactive(scope), templateEl);
      clone._x_forScope = clone._x_dataStack[0];

      mutateDom(() => {
        lastEl.after(clone);

        initTree(clone);
      });

      if (typeof key === 'object') {
        warn(
          'x-for key cannot be an object, it must be a string or an integer',
          templateEl,
        );
      }

      lookup[key] = clone;
    });

    // If an element hasn't changed, we still want to "refresh" the
    // data it depends on in case the data has changed in an
    // "unobservable" way.
    sames.forEach((key) =>
      refreshScope(lookup[key], scopes[keys.indexOf(key)], true),
    );

    // Now we'll log the keys (and the order they're in) for comparing
    // against next time.
    templateEl._x_prevKeys = keys;
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
