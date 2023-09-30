import { initInterceptors } from './interceptor';
import { reactive } from './reactivity';

export interface Stores {
  [key: string | symbol]: unknown;
}
let stores: Stores = {};
let isReactive = false;

type StoreFn = {
  <T extends keyof Stores>(name: T): Stores[T];
  <T extends keyof Stores>(name: T, value: Stores[T]): void;
};

export const store: StoreFn = <T extends keyof Stores>(
  name: T,
  value?: Stores[T]
) => {
  if (!isReactive) {
    stores = reactive(stores);
    isReactive = true;
  }
  if (value === undefined) return stores[name];

  stores[name] = value;

  const reactiveValue = stores[name];

  if (isInitable(reactiveValue)) reactiveValue.init();

  initInterceptors(reactiveValue as Record<string, unknown>);
};

const isInitable = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any | { init(): void }
): value is { init: () => void } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'init') &&
    typeof value.init === 'function'
  );
};

export const getStores = () => stores;
