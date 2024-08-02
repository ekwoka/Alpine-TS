import { PluginCallback } from '@alpinets/alpinets';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';

const positions = [
  'top',
  'top-start',
  'top-end',
  'right',
  'right-start',
  'right-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
] as const;

export const anchorPlugin: PluginCallback = (Alpine) => {
  Alpine.magic('anchor', (el) => {
    if (!el._x_anchor)
      throw 'Alpine: No x-anchor directive found on element using $anchor...';

    return el._x_anchor;
  });

  Alpine.directive(
    'anchor',
    (el, { expression, modifiers }, { cleanup, evaluate }) => {
      el._x_anchor = Alpine.reactive({ x: 0, y: 0 });

      const reference = evaluate<Element>(expression);

      if (!reference) throw 'Alpine: no element provided to x-anchor...';

      const placement = positions.find((i) => modifiers.includes(i));

      let offsetValue = 0;

      const unstyled = modifiers.includes('no-style');

      if (modifiers.includes('offset')) {
        const idx = modifiers.findIndex((i) => i === 'offset');

        offsetValue =
          modifiers[idx + 1] !== undefined
            ? Number(modifiers[idx + 1])
            : offsetValue;
      }

      const release = autoUpdate(reference, el, () => {
        let previousValue: string;

        computePosition(reference, el, {
          placement,
          middleware: [flip(), shift({ padding: 5 }), offset(offsetValue)],
        }).then(({ x, y }) => {
          // Only trigger Alpine reactivity when the value actually changes...
          if (JSON.stringify({ x, y }) !== previousValue) {
            unstyled || setStyles(el, x, y);
            Object.assign(el._x_anchor, { x, y });
          }

          previousValue = JSON.stringify({ x, y });
        });
      });

      cleanup(() => release());
    },
  );
};

const setStyles = (el: HTMLElement, x: number, y: number) =>
  Object.assign(el.style, {
    left: x + 'px',
    top: y + 'px',
    position: 'absolute',
  });

export default anchorPlugin;

declare module '@alpinets/alpinets' {
  interface XAttributes {
    _x_anchor: {
      x: number;
      y: number;
    };
  }
}
