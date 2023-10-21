import type { DirectiveCallback, PluginCallback } from 'alpinets';

export const collapse: PluginCallback = (Alpine) => {
  const collapse: DirectiveCallback = (el, { modifiers }) => {
    const duration = modifierValue(modifiers, 'duration', 250) / 1000;
    const floor = modifierValue(modifiers, 'min', 0);
    const fullyHide = !modifiers.includes('min');

    if (!el._x_isShown) el.style.height = `${floor}px`;
    // We use the hidden attribute for the benefit of Tailwind
    // users as the .space utility will ignore [hidden] elements.
    // We also use display:none as the hidden attribute has very
    // low CSS specificity and could be accidentally overridden
    // by a user.
    if (!el._x_isShown && fullyHide) el.hidden = true;
    if (!el._x_isShown) el.style.overflow = 'hidden';

    // Override the setStyles function with one that won't
    // revert updates to the height style.
    const setFunction = (el, styles) => {
      const revertFunction = Alpine.setStyles(el, styles);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return styles.height ? () => {} : revertFunction;
    };

    const transitionStyles = {
      transitionProperty: 'height',
      transitionDuration: `${duration}s`,
      transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    };

    el._x_transition = {
      in() {
        if (fullyHide) el.hidden = false;
        if (fullyHide) el.style.display = null;

        let current = el.getBoundingClientRect().height;

        el.style.height = 'auto';

        const full = el.getBoundingClientRect().height;

        if (current === full) {
          current = floor;
        }

        Alpine.transition(
          el,
          Alpine.setStyles,
          {
            during: transitionStyles,
            start: { height: current + 'px' },
            end: { height: full + 'px' },
          },
          () => (el._x_isShown = true),
          () => {
            if (el.getBoundingClientRect().height == full) {
              el.style.overflow = null;
            }
          },
        );
      },

      out() {
        const full = el.getBoundingClientRect().height;

        Alpine.transition(
          el,
          setFunction,
          {
            during: transitionStyles,
            start: { height: full + 'px' },
            end: { height: floor + 'px' },
          },
          () => (el.style.overflow = 'hidden'),
          () => {
            el._x_isShown = false;

            // check if element is fully collapsed
            if (el.style.height == `${floor}px` && fullyHide) {
              el.style.display = 'none';
              el.hidden = true;
            }
          },
        );
      },
    };
  };

  Alpine.directive('collapse', collapse);

  // If we're using a "minimum height", we'll need to disable
  // x-show's default behavior of setting display: 'none'.
  collapse.inline = (el, { modifiers }) => {
    if (!modifiers.includes('min')) return;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    el._x_doShow = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    el._x_doHide = () => {};
  };
};

function modifierValue(
  modifiers: string[],
  key: string,
  fallback: number,
): number {
  // If the modifier isn't present, use the default.
  if (modifiers.indexOf(key) === -1) return fallback;

  // If it IS present, grab the value after it: x-show.transition.duration.500ms
  const rawValue = modifiers[modifiers.indexOf(key) + 1];

  return rawValue ? parseInt(rawValue) : fallback;
}
