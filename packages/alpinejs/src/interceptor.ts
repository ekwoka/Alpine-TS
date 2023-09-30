// Warning: The concept of "interceptors" in Alpine is not public API and is subject to change
// without tagging a major release.

export const initInterceptors = (data: Record<string, unknown>) => {
  const isObject = (val: object): val is Record<string, unknown> =>
    typeof val === 'object' && !Array.isArray(val) && val !== null;

  const recurse = (obj: Record<string, unknown>, basePath = '') => {
    Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(
      ([key, { value, enumerable }]) => {
        // Skip getters.
        if (enumerable === false || value === undefined) return;

        const path = basePath === '' ? key : `${basePath}.${key}`;

        if (
          typeof value === 'object' &&
          value !== null &&
          value._x_interceptor
        ) {
          obj[key] = value.initialize(data, path, key);
        } else {
          if (isObject(value) && value !== obj && !(value instanceof Element)) {
            recurse(value, path);
          }
        }
      }
    );
  };

  return recurse(data);
};

type InterceptorCallback<T = unknown> = (
  initial: T,
  get: () => T,
  set: (val: T) => void,
  path: string,
  key: string
) => T;

type InterceptorObject<T = unknown> = {
  initialValue: T;
  _x_interceptor: true;
  initialize: (data: Record<string, unknown>, path: string, key: string) => T;
};

type InferInterceptor<T> = T extends InterceptorObject<infer U>
  ? U
  : T extends Record<string | number | symbol, unknown>
  ? {
      [K in keyof T]: InferInterceptor<T[K]>;
    }
  : T;

export type InferInterceptors<T> = {
  [K in keyof T]: InferInterceptor<T[K]>;
};

export const interceptor = <T>(
  callback: InterceptorCallback<T>,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  mutateObj: (obj: InterceptorObject<T>) => void = () => {}
) => {
  const obj: InterceptorObject<T> = {
    initialValue: undefined,
    _x_interceptor: true,
    initialize(data, path, key) {
      return callback(
        this.initialValue,
        () => get<T>(data, path),
        (value) => set(data, path, value),
        path,
        key
      );
    },
  };

  mutateObj(obj);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (initialValue: T) => {
    if (isInterceptor(initialValue)) {
      // Support nesting interceptors.
      const initialize = obj.initialize.bind(obj);

      obj.initialize = (data, path, key) => {
        const innerValue = initialValue.initialize(data, path, key);

        obj.initialValue = innerValue;

        return initialize(data, path, key);
      };
    } else {
      obj.initialValue = initialValue;
    }

    return obj;
  };
};

const isInterceptor = <T>(
  val: T | InterceptorObject<T>
): val is InterceptorObject<T> =>
  Boolean((val as InterceptorObject<T>)?._x_interceptor);

const get = <T>(obj: Record<string, unknown>, path: string): T =>
  path.split('.').reduce((carry, segment) => carry[segment], obj) as T;

const set = (
  obj: Record<string, unknown | Record<string, unknown>>,
  path: string | string[],
  value: unknown
): void => {
  if (typeof path === 'string') path = path.split('.');

  if (path.length === 1) return (obj[path[0]] = value) as void;
  if (path.length === 0) throw new Error('Invalid path');

  if (obj[path[0]])
    return set(obj[path[0]] as Record<string, unknown>, path.slice(1), value);

  obj[path[0]] = {};
  return set(obj[path[0]] as Record<string, unknown>, path.slice(1), value);
};
