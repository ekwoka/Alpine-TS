import { initInterceptors } from './interceptor';
import { reactive } from './reactivity';

let stores: Record<string, Store> = {};
let isReactive = false;

type Store = Record<string, unknown> | number | string | boolean;

type StoreFn = {
  <T extends Store>(name: string, value: T): void;
  <T extends Store>(name: string, value: undefined): T;
};

export const store: StoreFn = <T extends Store>(name: string, value?: T) => {
  if (!isReactive) {
    stores = reactive(stores);
    isReactive = true;
  }

  if (value === undefined) return stores[name];

  stores[name] = value;

  if (
    typeof value === 'object' &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, 'init') &&
    typeof value.init === 'function'
  )
    value.init();

  initInterceptors(stores[name]);
};

export const getStores = () => stores;
