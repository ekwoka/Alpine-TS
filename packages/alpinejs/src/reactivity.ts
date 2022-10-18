import { scheduler } from './scheduler';
import { ElementWithXAttributes } from './types';
import {
  ReactiveEffect,
  effect as Veffect,
  toRaw as Vraw,
  reactive as Vreactive,
  stop as Vrelease,
} from '@vue/reactivity';

let reactive: typeof Vreactive,
  effect: typeof Veffect,
  release: typeof Vrelease,
  raw: typeof Vraw;

let shouldSchedule = true;
export const disableEffectScheduling = (callback: () => void) => {
  shouldSchedule = false;

  callback();

  shouldSchedule = true;
};

export const setReactivityEngine = (engine: {
  reactive: typeof Vreactive;
  effect: typeof Veffect;
  release: typeof Vrelease;
  raw: typeof Vraw;
}) => {
  reactive = engine.reactive;
  release = engine.release;
  effect = (callback) =>
    engine.effect(callback, {
      scheduler: (task) => {
        if (shouldSchedule) {
          scheduler(task);
        } else {
          task();
        }
      },
    });
  raw = engine.raw;
};

export const overrideEffect = (override: typeof Veffect) => (effect = override);

export const elementBoundEffect = (
  el: ElementWithXAttributes
): ElementBoundEffects => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let cleanup = () => {};

  const wrappedEffect = <T>(callback: () => T) => {
    const effectReference = effect(callback);

    if (!el._x_effects) {
      el._x_effects = new Set();

      // Livewire depends on el._x_runEffects.
      el._x_runEffects = () => el._x_effects.forEach((i) => i());
    }

    el._x_effects.add(effectReference);

    cleanup = () => {
      if (effectReference === undefined) return;

      el._x_effects.delete(effectReference);

      release(effectReference);
    };

    return effectReference;
  };

  return [wrappedEffect, cleanup];
};

type ElementBoundEffects = [
  <T>(callback: () => T) => ReactiveEffect<T>,
  () => void
];

export { release, reactive, effect, raw };
