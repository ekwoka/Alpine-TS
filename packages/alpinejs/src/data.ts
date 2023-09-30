import type { InferInterceptors } from './interceptor';
import type { Magics } from './magics';

const Data: Record<string, DataFunction<unknown>> = {};

type DataFunction<T> = (...args: unknown[]) => AlpineComponent<T>;

export const data = <T extends Record<string | number | symbol, unknown>>(
  name: string,
  callback: DataFunction<T>
) => {
  Data[name] = callback;
};

export type AlpineComponent<T> = T &
  DataMethods &
  ThisType<InferInterceptors<T> & DataMethods & Magics<T>>;

type DataMethods = {
  /**
   * Will be executed before Alpine initializes teh rest of the component.
   */
  init?(): void;
  /**
   * Will be executed when the component is destroyed.
   */
  destroy?(): void;
};

export const injectDataProviders = (
  obj: Record<string, unknown>,
  context: Record<string, unknown>
) => {
  Object.entries(Data).forEach(([name, callback]) => {
    Object.defineProperty(obj, name, {
      get() {
        return (...args: unknown[]) => {
          return callback.call(context, ...args);
        };
      },
      enumerable: false,
    });
  });

  return obj;
};
