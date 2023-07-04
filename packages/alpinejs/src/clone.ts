import { initTree, isRoot } from './lifecycle';
import { effect, overrideEffect, release } from './reactivity';
import { DirectiveCallback, ElementWithXAttributes } from './types';
import { walk } from './utils/walk';
import { ReactiveEffect } from '@vue/reactivity';

export let isCloning = false;

export const skipDuringClone = <
  T extends (...args: Parameters<T>) => ReturnType<T>
>(
  callback: T,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback = (() => {}) as T
) => {
  return ((...args: Parameters<T>): ReturnType<T> =>
    isCloning ? fallback(...args) : callback(...args)) as T;
};

export const onlyDuringClone = (
  callback: DirectiveCallback
): DirectiveCallback => {
  return (...args) => isCloning && callback(...args);
};

export const interuptCrawl = (
  callback: DirectiveCallback
): DirectiveCallback => {
  return (...args) => isCloning || callback(...args);
};

export const clone = (
  oldEl: ElementWithXAttributes,
  newEl: ElementWithXAttributes
) => {
  if (!newEl._x_dataStack) newEl._x_dataStack = oldEl._x_dataStack;

  isCloning = true;

  dontRegisterReactiveSideEffects(() => {
    cloneTree(newEl);
  });

  isCloning = false;
};

export const cloneTree = (el: ElementWithXAttributes) => {
  let hasRunThroughFirstEl = false;

  const shallowWalker = (
    el: ElementWithXAttributes,
    callback: (el: ElementWithXAttributes, skip: () => void) => void
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
