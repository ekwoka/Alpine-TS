import { getElementBoundUtilities } from './directives';
import { interceptor } from './interceptor';
import { onElRemoved } from './mutation';
import { ElementWithXAttributes } from './types';
import { MaybeFunction } from './utils/typeWrap';

const magics: Record<string, MagicFn> = {};

type MagicFn = (
  el: ElementWithXAttributes,
  options: Utilities
) => MaybeFunction<unknown>;

type Utilities = ReturnType<typeof getElementBoundUtilities>[0] & {
  interceptor: typeof interceptor;
};

export function magic(name: string, callback: MagicFn) {
  magics[name] = callback;
}

export function injectMagics(
  obj: Record<string, unknown>,
  el: ElementWithXAttributes
) {
  Object.entries(magics).forEach(([name, callback]) => {
    Object.defineProperty(obj, `$${name}`, {
      get() {
        const [utilities, cleanup] = getElementBoundUtilities(el);
        onElRemoved(el, cleanup);
        return callback(el, { interceptor, ...utilities } as Utilities);
      },

      enumerable: false,
    });
  });

  return obj;
}
