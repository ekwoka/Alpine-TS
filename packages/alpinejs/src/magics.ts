import { getElementBoundUtilities } from './directives';
import { interceptor } from './interceptor';
import { onElRemoved } from './mutation';
import { ElementWithXAttributes, MagicUtilities } from './types';
import { MaybeFunction } from './utils/typeWrap';

const magics: Record<string, MagicFn> = {};

type MagicFn = (
  el: ElementWithXAttributes,
  options: MagicUtilities
) => MaybeFunction<unknown>;

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
        return callback(el, { interceptor, ...utilities } as MagicUtilities);
      },

      enumerable: false,
    });
  });

  return obj;
}
