import type { InterceptorObject, PluginCallback } from 'alpinets';

export const persistPlugin: PluginCallback = (Alpine) => {
  const defaultStorage = getDefaultStorage();
  const persist = <T>() => {
    let alias: string;
    let storage = defaultStorage;

    return Alpine.interceptor(
      (initialValue: T, getter, setter, path): T => {
        const lookup = alias || `_x_${path}`;

        const initial = storageHas(lookup, storage)
          ? storageGet<T>(lookup, storage)
          : initialValue;

        setter(initial);

        Alpine.effect(() => {
          const value = getter();

          storageSet(lookup, value, storage);

          setter(value);
        });

        return initial;
      },
      (interceptor) =>
        Object.assign(interceptor, {
          as(key: string) {
            alias = key;
            return this;
          },
          using(altStorage: SimpleStorage) {
            storage = altStorage;
            return this;
          },
        }),
    );
  };

  Object.defineProperty(Alpine, '$persist', {
    get: () => persist(),
    configurable: true,
  });

  Alpine.magic('persist', persist);

  Alpine.persist = (key, { get, set }, storage = localStorage) => {
    const initial = storageHas(key, storage)
      ? storageGet<ReturnType<typeof get>>(key, storage)
      : get();

    set(initial);

    Alpine.effect(() => {
      const value = get();

      storageSet(key, value, storage);
      set(value);
    });
  };
};

export default persistPlugin;

export const storageHas = (key: string, storage: SimpleStorage) =>
  ![undefined, null].includes(storage.getItem(key));

export const storageGet = <T>(key: string, storage: SimpleStorage): T =>
  JSON.parse(storage.getItem(key));

export const storageSet = (
  key: string,
  value: unknown,
  storage: SimpleStorage,
) => storage.setItem(key, JSON.stringify(value));

export type PersistInterceptor<T> = InterceptorObject<T> & {
  as(name: string): PersistInterceptor<T>;
  using(storage: SimpleStorage): PersistInterceptor<T>;
};

export type SimpleStorage = {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
};

export type $persist = {
  <T>(value: T): PersistInterceptor<T>;
};

type persist = <T>(
  key: string,
  { get, set }: { get(): T; set(val: T): void },
  storage: SimpleStorage,
) => void;

declare module 'alpinets' {
  interface Alpine {
    $persist: $persist;
    persist: persist;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Magics<T> {
    $persist: $persist;
  }
}

const getDefaultStorage = (): SimpleStorage => {
  try {
    return localStorage;
  } catch (e) {
    console.error(e);
    console.warn(
      'Alpine: $persist is using temporary storage since localStorage is unavailable.',
    );

    const dummy = new Map();

    return {
      getItem: dummy.get.bind(dummy),
      setItem: dummy.set.bind(dummy),
    };
  }
};
