export const arrayWrap = <T>(value: MaybeArray<T>): T[] =>
  Array.isArray(value) ? value : [value];

export type MaybeArray<T> = T | T[];

export const functionWrap = <T>(value: MaybeFunction<T>): (() => T) => {
  return value instanceof Function ? value : () => value;
};

export type MaybeFunction<T> = T | (() => T);
