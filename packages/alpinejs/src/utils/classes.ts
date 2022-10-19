import { ElementWithXAttributes } from '../types';

export const setClasses = (
  el: ElementWithXAttributes,
  value:
    | string
    | boolean
    | Record<string, boolean>
    | (() => string | boolean | Record<string, boolean>)
) => {
  if (Array.isArray(value)) return setClassesFromString(el, value.join(' '));
  if (typeof value === 'object' && value !== null)
    return setClassesFromObject(el, value);
  if (typeof value === 'function') return setClasses(el, value());

  return setClassesFromString(el, value as string | boolean);
};

const missingClasses = (classString: string, el: ElementWithXAttributes) =>
  classString
    .split(' ')
    .filter((i) => !el.classList.contains(i))
    .filter(Boolean);

const setClassesFromString = (
  el: ElementWithXAttributes,
  classString: string | boolean
) => {
  const addClassesAndReturnUndo = (classes: string[]) => {
    el.classList.add(...classes);

    return () => el.classList.remove(...classes);
  };

  // This is to allow short-circuit expressions like: :class="show || 'hidden'" && "show && 'block'"
  classString = classString === true ? '' : classString || '';

  return addClassesAndReturnUndo(missingClasses(classString, el));
};

const setClassesFromObject = (
  el: ElementWithXAttributes,
  classObject: Record<string, boolean>
) => {
  const split = (classString: string) => classString.split(' ').filter(Boolean);

  const forAdd = Object.entries(classObject)
    .flatMap<string | false>(([classString, bool]) =>
      bool ? split(classString) : false
    )
    .filter<string>((val): val is string => Boolean(val));
  const forRemove = Object.entries(classObject)
    .flatMap<string | false>(([classString, bool]) =>
      !bool ? split(classString) : false
    )
    .filter<string>((val): val is string => Boolean(val));

  const added: string[] = [];
  const removed: string[] = [];

  forRemove.forEach((str) => {
    if (el.classList.contains(str)) {
      el.classList.remove(str);
      removed.push(str);
    }
  });

  forAdd.forEach((str) => {
    if (!el.classList.contains(str)) {
      el.classList.add(str);
      added.push(str);
    }
  });

  return () => {
    removed.forEach((str) => el.classList.add(str));
    added.forEach((str) => el.classList.remove(str));
  };
};
