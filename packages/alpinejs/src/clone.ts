import { initTree, isRoot } from './lifecycle';
import { effect, overrideEffect, release } from './reactivity';
import { DirectiveCallback, ElementWithXAttributes } from './types';
import { walk } from './utils/walk';
import { ReactiveEffect } from '@vue/reactivity';

export let isCloning = false;
export let isCloningLegacy = false;

export const skipDuringClone = <
  T extends (...args: Parameters<T>) => ReturnType<T>,
>(
  callback: T,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback = (() => {}) as T,
) => {
  return ((...args: Parameters<T>): ReturnType<T> =>
    isCloning ? fallback(...args) : callback(...args)) as T;
};

export const onlyDuringClone = (
  callback: DirectiveCallback,
): DirectiveCallback => {
  return (...args) => isCloning && callback(...args);
};

export const cloneNode = (
  from: ElementWithXAttributes,
  to: ElementWithXAttributes,
) => {
  // Transfer over existing runtime Alpine state from
  // the existing dom tree over to the new one...
  if (from._x_dataStack) {
    to._x_dataStack = from._x_dataStack;

    // Set a flag to signify the new tree is using
    // pre-seeded state (used so x-data knows when
    // and when not to initialize state)...
    to.setAttribute('data-has-alpine-state', 'true');
  }

  isCloning = true;

  // We don't need reactive effects in the new tree.
  // Cloning is just used to seed new server HTML with
  // Alpine before "morphing" it onto live Alpine...
  dontRegisterReactiveSideEffects(() => {
    initTree(to, (el, callback) => {
      // We're hijacking the "walker" so that we
      // only initialize the element we're cloning...
      callback(el, () => {});
    });
  });

  isCloning = false;
};

/**
 * @deprecated
 * @param oldEl
 * @param newEl
 */
export const clone = (
  oldEl: ElementWithXAttributes,
  newEl: ElementWithXAttributes,
) => {
  if (!newEl._x_dataStack) newEl._x_dataStack = oldEl._x_dataStack;

  isCloning = true;
  isCloningLegacy = true;

  dontRegisterReactiveSideEffects(() => {
    cloneTree(newEl);
  });

  isCloning = false;
};

/**
 * @deprecated
 * @param el
 */
export const cloneTree = (el: ElementWithXAttributes) => {
  let hasRunThroughFirstEl = false;

  const shallowWalker = (
    el: ElementWithXAttributes,
    callback: (el: ElementWithXAttributes, skip: () => void) => void,
  ) => {
    walk(el, (el: ElementWithXAttributes, skip: () => void) => {
      if (hasRunThroughFirstEl && isRoot(el)) return skip();

      hasRunThroughFirstEl = true;

      callback(el, skip);
    });
  };

  initTree(el, shallowWalker);
};

const dontRegisterReactiveSideEffects = (callback: () => void) => {
  const cache = effect;

  overrideEffect((callback, _el) => {
    const storedEffect = cache(callback);

    release(storedEffect);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return (() => {}) as ReactiveEffect<ReturnType<typeof callback>>;
  });

  callback();

  overrideEffect(cache);
};

// If we are cloning a tree, we only want to evaluate x-data if another
// x-data context DOESN'T exist on the component.
// The reason a data context WOULD exist is that we graft root x-data state over
// from the live tree before hydrating the clone tree.
export const shouldSkipRegisteringDataDuringClone = (el: HTMLElement) => {
  if (!isCloning) return false;
  if (isCloningLegacy) return true;

  return el.hasAttribute('data-has-alpine-state');
};
