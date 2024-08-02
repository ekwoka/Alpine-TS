import type { PluginCallback } from '@alpinets/alpinets';

export const intersectFunction: PluginCallback = (Alpine) => {
  Alpine.directive(
    'intersect',
    (el, { value, expression, modifiers }, { evaluateLater, cleanup }) => {
      const evaluate = evaluateLater(expression);

      const options: IntersectionObserverInit = {
        rootMargin: getRootMargin(modifiers),
        threshold: getThreshold(modifiers),
      };

      const once = modifiers.includes('once');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // Ignore entry if intersecting in leave mode, or not intersecting in enter mode
          if (entry.isIntersecting === (value === 'leave')) return;

          evaluate();

          once && observer.disconnect();
        });
      }, options);

      observer.observe(el);

      cleanup(() => {
        observer.disconnect();
      });
    },
  );
};

export const getThreshold = (modifiers: string[]) => {
  if (modifiers.includes('full')) return 0.99;
  if (modifiers.includes('half')) return 0.5;
  if (!modifiers.includes('threshold')) return 0;

  const threshold = modifiers[modifiers.indexOf('threshold') + 1];

  if (threshold === '100') return 1;
  if (threshold === '0') return 0;

  return Number(`.${threshold}`);
};

export const getLengthValue = (rawValue: string) => {
  // Supported: -10px, -20 (implied px), 30 (implied px), 40px, 50%
  const match = rawValue.match(/^(-?[0-9]+)(px|%)?$/);
  return match ? match[1] + (match[2] || 'px') : null;
};

const fallback = '0px 0px 0px 0px';
export const getRootMargin = (modifiers: string[]) => {
  const key = 'margin';
  const index = modifiers.indexOf(key);

  // If the modifier isn't present, use the default.
  if (index === -1) return fallback;

  // Grab and parse the 4 subsequent length values after margin modifier: x-intersect.margin.300px.0.50%.0
  return (
    modifiers
      .slice(index + 1, index + 5)
      .map(getLengthValue)
      .filter(outUndefined)
      .join(' ')
      .trim() || fallback
  );
};

const outUndefined = <T>(value: T | undefined): value is T => value !== null;
