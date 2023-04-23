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

export const magic = (name: string, callback: MagicFn) => {
  magics[name] = callback;
};

export const injectMagics = (
  obj: Record<string, unknown>,
  el: ElementWithXAttributes
) => {
  let memoizedUtilities = null;
  function getUtilities() {
    if (memoizedUtilities) {
      return memoizedUtilities;
    } else {
      const [utilities, cleanup] = getElementBoundUtilities(el);

      memoizedUtilities = { interceptor, ...utilities };

      onElRemoved(el, cleanup);
      return memoizedUtilities;
    }
  }
  Object.entries(magics).forEach(([name, callback]) =>
    Object.defineProperty(obj, `$${name}`, {
      get() {
        return callback(el, getUtilities());
      },
      enumerable: false,
    })
  );

  return obj;
};
