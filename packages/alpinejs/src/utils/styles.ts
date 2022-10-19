import { ElementWithXAttributes } from '../types';

export const setStyles = (
  el: ElementWithXAttributes,
  value: string | Record<string, string>
) => {
  if (typeof value === 'object' && value !== null)
    return setStylesFromObject(el, value);

  return setStylesFromString(el, value as string);
};

const setStylesFromObject = (
  el: ElementWithXAttributes,
  value: Record<string, string>
) => {
  const previousStyles = {};

  Object.entries(value).forEach(([key, value]) => {
    previousStyles[key] = el.style[key];

    // When we use javascript object, css properties use the camelCase
    // syntax but when we use setProperty, we need the css format
    // so we need to convert camelCase to kebab-case.
    // In case key is a CSS variable, leave it as it is.
    if (!key.startsWith('--')) key = kebabCase(key);

    el.style.setProperty(key, value);
  });

  setTimeout(() => {
    if (el.style.length === 0) {
      el.removeAttribute('style');
    }
  });

  return () => {
    setStyles(el, previousStyles);
  };
};

const setStylesFromString = (el: ElementWithXAttributes, value: string) => {
  const cache = el.getAttribute('style') ?? '';

  el.setAttribute('style', value);

  return () => el.setAttribute('style', cache);
};

const kebabCase = (subject: string): string => {
  return subject.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};
