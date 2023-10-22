import { ElementWithXAttributes } from '../types';
import { kebabCase } from './stringTransformers';

export const setStyles = (
  el: ElementWithXAttributes,
  value: string | Partial<CSSStyleDeclaration>,
) => {
  if (typeof value === 'object' && value !== null)
    return setStylesFromObject(el, value);

  return setStylesFromString(el, value as string);
};

const setStylesFromObject = (
  el: ElementWithXAttributes,
  value: Partial<CSSStyleDeclaration>,
) => {
  const previousStyles = {};

  Object.entries(value).forEach(([key, value]) => {
    previousStyles[key] = el.style[key];

    // When we use javascript object, css properties use the camelCase
    // syntax but when we use setProperty, we need the css format
    // so we need to convert camelCase to kebab-case.
    // In case key is a CSS variable, leave it as it is.
    if (!key.startsWith('--')) key = kebabCase(key);

    el.style.setProperty(key, value as string);
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
