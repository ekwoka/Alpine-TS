import { initTree, isRoot } from './lifecycle';
import { effect, overrideEffect, release } from './reactivity';
import { walk } from './utils/walk';

let isCloning = false;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function skipDuringClone(callback, fallback = () => {}) {
  return (...args) => (isCloning ? fallback(...args) : callback(...args));
}

export function onlyDuringClone(callback) {
  return (...args) => isCloning && callback(...args);
}

export function interuptCrawl(callback) {
  return (...args) => isCloning || callback(...args);
}

export function clone(oldEl, newEl) {
  if (!newEl._x_dataStack) newEl._x_dataStack = oldEl._x_dataStack;

  isCloning = true;

  dontRegisterReactiveSideEffects(() => {
    cloneTree(newEl);
  });

  isCloning = false;
}

export function cloneTree(el) {
  let hasRunThroughFirstEl = false;

  let shallowWalker = (el, callback) => {
    walk(el, (el, skip) => {
      if (hasRunThroughFirstEl && isRoot(el)) return skip();

      hasRunThroughFirstEl = true;

      callback(el, skip);
    });
  };

  initTree(el, shallowWalker);
}

function dontRegisterReactiveSideEffects(callback) {
  let cache = effect;

  overrideEffect((callback, _el) => {
    let storedEffect = cache(callback);

    release(storedEffect);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  });

  callback();

  overrideEffect(cache);
}
