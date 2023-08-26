import { initInterceptors } from './interceptor';
import { reactive } from './reactivity';

let stores: Record<string, Store> = {};
let isReactive = false;

type Store =
  | Record<string, unknown>
  | Array<unknown>
  | number
  | string
  | boolean;

type StoreFn = {
  <T extends Store>(name: string): T;
  <T extends Store>(name: string, value: T): void;
};

export const store: StoreFn = <T extends Store>(name: string, value?: T) => {
  if (!isReactive) {
    stores = reactive(stores);
    isReactive = true;
  }

  if (value === undefined) return stores[name];

  stores[name] = value;

  const reactiveValue = stores[name];

  if (
    typeof reactiveValue === 'object' &&
    reactiveValue !== null &&
    Object.prototype.hasOwnProperty.call(reactiveValue, 'init') &&
    !Array.isArray(reactiveValue) &&
    typeof reactiveValue.init === 'function'
  )
    reactiveValue.init();

  initInterceptors(reactiveValue as Record<string, unknown>);
};

export const getStores = () => stores;
