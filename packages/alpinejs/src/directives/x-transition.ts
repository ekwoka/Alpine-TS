import { directive } from '../directives';
import { mutateDom } from '../mutation';
import { holdNextTicks, releaseNextTicks } from '../nextTick';
import {
  DirectiveData,
  ElementWithXAttributes,
  TransitionStages,
} from '../types';
import { setClasses } from '../utils/classes';
import { once } from '../utils/once';
import { setStyles } from '../utils/styles';

directive(
  'transition',
  (el, { value, modifiers, expression }, { evaluate, cleanup }) => {
    if (typeof expression === 'function') expression = evaluate(expression);
    if (expression === (false as unknown as string)) return;
    const expressionOrMod =
      expression && typeof expression !== 'boolean' ? expression : modifiers;
    cleanup(registerTransitionWithReducedMotion(el, expressionOrMod, value));
  }
);

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
);

const registerTransitionWithReducedMotion = (
  el: ElementWithXAttributes,
  expressionOrMod: string | string[],
  stage: string
): (() => void) => {
  const handler = ({ matches }: MediaQueryListEvent | MediaQueryList) => {
    if (matches) return removeTransitions(el);
    if (typeof expressionOrMod === 'string')
      registerTransitionsFromClassString(el, expressionOrMod, stage);
    else registerTransitionsFromHelper(el, expressionOrMod, stage);
  };
  prefersReducedMotion.addEventListener('change', handler);
  handler(prefersReducedMotion);
  return () => prefersReducedMotion.removeEventListener('change', handler);
};

const removeTransitions = (el: ElementWithXAttributes) => {
  delete el._x_transition;
};

const registerTransitionsFromClassString = (
  el: ElementWithXAttributes,
  classString: string,
  stage: string
) => {
  registerTransitionObject(el, setClasses, '');

  const directiveStorageMap = {
    enter: (classes: string) => {
      el._x_transition.enter.during = classes;
    },
    'enter-start': (classes: string) => {
      el._x_transition.enter.start = classes;
    },
    'enter-end': (classes: string) => {
      el._x_transition.enter.end = classes;
    },
    leave: (classes: string) => {
      el._x_transition.leave.during = classes;
    },
    'leave-start': (classes: string) => {
      el._x_transition.leave.start = classes;
    },
    'leave-end': (classes: string) => {
      el._x_transition.leave.end = classes;
    },
  };

  directiveStorageMap[stage](classString);
};

const registerTransitionsFromHelper = (
  el: ElementWithXAttributes,
  modifiers: DirectiveData['modifiers'],
  stage: string
) => {
  registerTransitionObject(el, setStyles);

  const doesntSpecify =
    !modifiers.includes('in') && !modifiers.includes('out') && !stage;
  const transitioningIn =
    doesntSpecify || modifiers.includes('in') || ['enter'].includes(stage);
  const transitioningOut =
    doesntSpecify || modifiers.includes('out') || ['leave'].includes(stage);

  if (modifiers.includes('in') && !doesntSpecify) {
    modifiers = modifiers.filter(
      (_, index) => index < modifiers.indexOf('out')
    );
  }

  if (modifiers.includes('out') && !doesntSpecify) {
    modifiers = modifiers.filter(
      (_, index) => index > modifiers.indexOf('out')
    );
  }

  const wantsAll =
    !modifiers.includes('opacity') && !modifiers.includes('scale');
  const wantsOpacity = wantsAll || modifiers.includes('opacity');
  const wantsScale = wantsAll || modifiers.includes('scale');
  const opacityValue = wantsOpacity ? 0 : 1;
  const scaleValue = wantsScale
    ? modifierValue(modifiers, 'scale', 95) / 100
    : 1;
  const delay = modifierValue(modifiers, 'delay', 0);
  const origin = modifierValue(modifiers, 'origin', 'center');
  const property = 'opacity, transform';
  const durationIn = modifierValue(modifiers, 'duration', 150) / 1000;
  const durationOut = modifierValue(modifiers, 'duration', 75) / 1000;
  const easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;

  if (transitioningIn) {
    el._x_transition.enter.during = {
      transformOrigin: origin,
      transitionDelay: String(delay),
      transitionProperty: property,
      transitionDuration: `${durationIn}s`,
      transitionTimingFunction: easing,
    };

    el._x_transition.enter.start = {
      opacity: String(opacityValue),
      transform: `scale(${scaleValue})`,
    };

    el._x_transition.enter.end = {
      opacity: String(1),
      transform: 'scale(1)',
    };
  }

  if (transitioningOut) {
    el._x_transition.leave.during = {
      transformOrigin: origin,
      transitionDelay: String(delay),
      transitionProperty: property,
      transitionDuration: `${durationOut}s`,
      transitionTimingFunction: easing,
    };

    el._x_transition.leave.start = {
      opacity: String(1),
      transform: 'scale(1)',
    };

    el._x_transition.leave.end = {
      opacity: String(opacityValue),
      transform: `scale(${scaleValue})`,
    };
  }
};

const registerTransitionObject = (
  el: ElementWithXAttributes,
  setFunction: typeof setClasses | typeof setStyles,
  defaultValue = {}
) => {
  if (!el._x_transition)
    el._x_transition = {
      enter: { during: defaultValue, start: defaultValue, end: defaultValue },

      leave: { during: defaultValue, start: defaultValue, end: defaultValue },

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      in(before = () => {}, after = () => {}) {
        transition(
          el,
          setFunction,
          {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end,
          },
          before,
          after
        );
      },

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      out(before = () => {}, after = () => {}) {
        transition(
          el,
          setFunction,
          {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end,
          },
          before,
          after
        );
      },
    };
};

(
  window.Element.prototype as Element &
    Pick<ElementWithXAttributes, '_x_toggleAndCascadeWithTransitions'>
)._x_toggleAndCascadeWithTransitions = function (el, value, show, hide) {
  // We are running this function after one tick to prevent
  // a race condition from happening where elements that have a
  // @click.away always view themselves as shown on the page.
  // If the tab is active, we prioritise requestAnimationFrame which plays
  // nicely with nested animations otherwise we use setTimeout to make sure
  // it keeps running in background. setTimeout has a lower priority in the
  // event loop so it would skip nested transitions but when the tab is
  // hidden, it's not relevant.
  const nextTick =
    document.visibilityState === 'visible' ? requestAnimationFrame : setTimeout;
  const clickAwayCompatibleShow = () => nextTick(show);

  if (value) {
    if (
      el._x_transition &&
      (el._x_transition.enter || el._x_transition.leave)
    ) {
      // This fixes a bug where if you are only transitioning OUT and you are also using @click.outside
      // the element when shown immediately starts transitioning out. There is a test in the manual
      // transition test file for this: /tests/cypress/manual-transition-test.html
      el._x_transition.enter &&
      (Object.entries(el._x_transition.enter.during).length ||
        Object.entries(el._x_transition.enter.start).length ||
        Object.entries(el._x_transition.enter.end).length)
        ? el._x_transition.in(show)
        : clickAwayCompatibleShow();
    } else {
      el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
    }

    return;
  }

  // Livewire depends on el._x_hidePromise.
  el._x_hidePromise = el._x_transition
    ? new Promise((resolve, reject) => {
        el._x_transition.out(
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {},
          () => resolve(hide)
        );

        el._x_transitioning.beforeCancel(() =>
          reject({ isFromCancelledTransition: true })
        );
      })
    : Promise.resolve(hide);

  queueMicrotask(() => {
    const closest = closestHide(el);

    if (closest) {
      if (!closest._x_hideChildren) closest._x_hideChildren = [];

      closest._x_hideChildren.push(el);
    } else {
      nextTick(() => {
        const hideAfterChildren = (el: ElementWithXAttributes) => {
          const carry = Promise.all([
            el._x_hidePromise,
            ...(el._x_hideChildren || []).map(hideAfterChildren),
          ]).then(([i]) => i());

          delete el._x_hidePromise;
          delete el._x_hideChildren;

          return carry;
        };

        hideAfterChildren(el).catch((e) => {
          if (!e.isFromCancelledTransition) throw e;
        });
      });
    }
  });
};

const closestHide = (el: ElementWithXAttributes) => {
  const parent = el.parentNode as ElementWithXAttributes;

  if (!parent) return;

  return parent._x_hidePromise ? parent : closestHide(parent);
};

export const transition = (
  el: ElementWithXAttributes,
  setFunction: typeof setClasses | typeof setStyles,
  { during, start, end }: TransitionStages,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  before = () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  after = () => {}
) => {
  if (el._x_transitioning) el._x_transitioning.cancel();

  if (
    Object.keys(during).length === 0 &&
    Object.keys(start).length === 0 &&
    Object.keys(end).length === 0
  ) {
    // Execute right away if there is no transition.
    before();
    after();
    return;
  }

  let undoStart: () => void, undoDuring: () => void, undoEnd: () => void;

  performTransition(el, {
    start() {
      undoStart = setFunction(el, start as string);
    },
    during() {
      undoDuring = setFunction(el, during as string);
    },
    before,
    end() {
      undoStart();

      undoEnd = setFunction(el, end as string);
    },
    after,
    cleanup() {
      undoDuring();
      undoEnd();
    },
  });
};

export const performTransition = (
  el: ElementWithXAttributes,
  stages: Record<string, () => void>
) => {
  // All transitions need to be truly "cancellable". Meaning we need to
  // account for interruptions at ALL stages of the transitions and
  // immediately run the rest of the transition.
  let interrupted: boolean, reachedBefore: boolean, reachedEnd: boolean;

  const finish = once(() => {
    mutateDom(() => {
      interrupted = true;

      if (!reachedBefore) stages.before();

      if (!reachedEnd) {
        stages.end();

        releaseNextTicks();
      }

      stages.after();

      // Adding an "isConnected" check, in case the callback removed the element from the DOM.
      if (el.isConnected) stages.cleanup();

      delete el._x_transitioning;
    });
  });

  el._x_transitioning = {
    beforeCancels: [],
    beforeCancel(callback) {
      this.beforeCancels.push(callback);
    },
    cancel: once(function (this: { beforeCancels: (() => void)[] }) {
      while (this.beforeCancels.length) {
        this.beforeCancels.shift()();
      }
      finish();
    }),
    finish,
  };

  mutateDom(() => {
    stages.start();
    stages.during();
  });

  holdNextTicks();

  requestAnimationFrame(() => {
    if (interrupted) return;

    // Note: Safari's transitionDuration property will list out comma separated transition durations
    // for every single transition property. Let's grab the first one and call it a day.
    let duration =
      Number(
        getComputedStyle(el)
          .transitionDuration.replace(/,.*/, '')
          .replace('s', '')
      ) * 1000;
    const delay =
      Number(
        getComputedStyle(el).transitionDelay.replace(/,.*/, '').replace('s', '')
      ) * 1000;

    if (duration === 0)
      duration =
        Number(getComputedStyle(el).animationDuration.replace('s', '')) * 1000;

    mutateDom(() => {
      stages.before();
    });

    reachedBefore = true;

    requestAnimationFrame(() => {
      if (interrupted) return;

      mutateDom(() => {
        stages.end();
      });

      releaseNextTicks();

      setTimeout(el._x_transitioning.finish, duration + delay);

      reachedEnd = true;
    });
  });
};

export const modifierValue = <T extends string | number>(
  modifiers: DirectiveData['modifiers'],
  key: string,
  fallback: T
): T => {
  // If the modifier isn't present, use the default.
  if (modifiers.indexOf(key) === -1) return fallback;

  // If it IS present, grab the value after it: x-show.transition.duration.500ms
  const rawValue = modifiers[modifiers.indexOf(key) + 1];

  if (!rawValue) return fallback;

  if (key === 'scale') {
    // Check if the very next value is NOT a number and return the fallback.
    // If x-show.transition.scale, we'll use the default scale value.
    // That is how a user opts out of the opacity transition.
    if (isNaN(Number(rawValue))) return fallback;
  }

  if (key === 'duration') {
    // Support x-transition.duration.500ms && duration.500
    const match = rawValue.match(/([0-9]+)ms/);
    if (match) return match[1] as T;
  }

  // Support chaining origin directions: x-show.transition.top.right
  if (
    key === 'origin' &&
    ['top', 'right', 'left', 'center', 'bottom'].includes(
      modifiers[modifiers.indexOf(key) + 2]
    )
  )
    return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(' ') as T;

  return rawValue as T;
};
