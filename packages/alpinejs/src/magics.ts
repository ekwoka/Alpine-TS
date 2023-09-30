import { getElementBoundUtilities } from './directives';
import { interceptor } from './interceptor';
import { onElRemoved } from './mutation';
import { ElementWithXAttributes, MagicUtilities } from './types';
import { MaybeFunction } from './utils/typeWrap';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Magics<T> {
  [key: `$${string}`]: unknown;
}

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
  Object.entries(magics).forEach(([name, callback]) =>
    Object.defineProperty(obj, `$${name}`, {
      get: () =>
        callback(
          el,
          memoizedUtilities ?? (memoizedUtilities = getUtilities(el))
        ),
      enumerable: false,
    })
  );

  return obj;
};

const getUtilities = (el: ElementWithXAttributes) => {
  const [utilities, cleanup] = getElementBoundUtilities(el);
  onElRemoved(el, cleanup);
  return { interceptor, ...utilities };
};
