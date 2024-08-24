import type { PluginCallback } from '@alpinets/alpinets';
import Alpine from '@alpinets/alpinets';
import { ElementWithXAttributes } from '@alpinets/alpinets';
import { Utilities } from '@alpinets/alpinets/src/types';
// @ts-expect-error
import Sortable from 'sortablejs';

export const Sort: PluginCallback = (Alpine) => {
  Alpine.directive(
    'sort',
    (
      el,
      { value, modifiers, expression },
      { evaluate, evaluateLater, cleanup },
    ) => {
      if (value === 'config') {
        return; // This will get handled by the main directive...
      }

      if (value === 'handle') {
        return; // This will get handled by the main directive...
      }

      if (value === 'group') {
        return; // This will get handled by the main directive...
      }

      // Supporting both `x-sort:item` AND `x-sort:key` (key for BC)...
      if (value === 'key' || value === 'item') {
        if ([undefined, null, ''].includes(expression)) return;

        el._x_sort_key = evaluate(expression);

        return;
      }

      const preferences = {
        hideGhost: !modifiers.includes('ghost'),
        useHandles: !!el.querySelector('[x-sort\\:handle]'),
        group: getGroupName(el, modifiers),
      };

      const handleSort = generateSortHandler(expression, evaluateLater);

      const config = getConfigurationOverrides(el, modifiers, evaluate);

      const sortable = initSortable(
        el,
        config,
        preferences,
        (key, position) => {
          handleSort(key, position);
        },
      );

      cleanup(() => sortable.destroy());
    },
  );
};

function generateSortHandler(
  expression: string,
  evaluateLater: Utilities['evaluateLater'],
) {
  // No handler was passed to x-sort...
  // biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional No-op
  if ([undefined, null, ''].includes(expression)) return () => {};

  const handle = evaluateLater(expression);

  return (key: string, position: number) => {
    // In the case of `x-sort="handleSort"`, let us call it manually...
    Alpine.dontAutoEvaluateFunctions(() => {
      handle(
        // If a function is returned, call it with the key/position params...
        (received) => {
          if (typeof received === 'function') received(key, position);
        },
        // Provide $key and $position to the scope in case they want to call their own function...
        {
          scope: {
            // Supporting both `$item` AND `$key` ($key for BC)...
            $key: key,
            $item: key,
            $position: position,
          },
        },
      );
    });
  };
}

function getConfigurationOverrides(
  el: ElementWithXAttributes,
  _modifiers: string[],
  evaluate: Utilities['evaluate'],
) {
  return el.hasAttribute('x-sort:config')
    ? evaluate(el.getAttribute('x-sort:config'))
    : {};
}

function initSortable(el, config, preferences, handle) {
  let ghostRef;

  const options = {
    animation: 150,

    handle: preferences.useHandles ? '[x-sort\\:handle]' : null,

    group: preferences.group,

    filter(e) {
      // Normally, we would just filter out any elements without `[x-sort:item]`
      // on them, however for backwards compatibility (when we didn't require
      // `[x-sort:item]`) we will check for x-sort\\:item being used at all
      if (!el.querySelector('[x-sort\\:item]')) return false;

      const itemHasAttribute = e.target.closest('[x-sort\\:item]');

      return itemHasAttribute ? false : true;
    },

    onSort(e) {
      // If item has been dragged between groups...
      if (e.from !== e.to) {
        // And this is the group it was dragged FROM...
        if (e.to !== e.target) {
          return; // Don't do anything, because the other group will call the handler...
        }
      }

      const key = e.item._x_sort_key;
      const position = e.newIndex;

      if (key !== undefined || key !== null) {
        handle(key, position);
      }
    },

    onStart() {
      document.body.classList.add('sorting');

      ghostRef = document.querySelector('.sortable-ghost');

      if (preferences.hideGhost && ghostRef) ghostRef.style.opacity = '0';
    },

    onEnd() {
      document.body.classList.remove('sorting');

      if (preferences.hideGhost && ghostRef) ghostRef.style.opacity = '1';

      ghostRef = undefined;

      keepElementsWithinMorphMarkers(el);
    },
  };

  return new Sortable(el, { ...options, ...config });
}

function keepElementsWithinMorphMarkers(el) {
  let cursor = el.firstChild;

  while (cursor.nextSibling) {
    if (cursor.textContent.trim() === '[if ENDBLOCK]><![endif]') {
      el.append(cursor);
      break;
    }

    cursor = cursor.nextSibling;
  }
}

function getGroupName(el, modifiers) {
  if (el.hasAttribute('x-sort:group')) {
    return el.getAttribute('x-sort:group');
  }

  return modifiers.indexOf('group') !== -1
    ? modifiers[modifiers.indexOf('group') + 1]
    : null;
}

export default Sort;
