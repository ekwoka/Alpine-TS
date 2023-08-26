const Data: Record<string, DataFunction<unknown>> = {};

type DataFunction<T> = (...args: unknown[]) => AlpineComponent<T>;

export const data = <T extends Record<string | symbol, unknown>>(
  name: string,
  callback: DataFunction<T>
) => {
  Data[name] = callback;
};

export type AlpineComponent<T> = T &
  XDataContext &
  ThisType<T & XDataContext & AlpineMagics<T>>;

type XDataContext = {
  /**
   * Will be executed before Alpine initializes teh rest of the component.
   */
  init?(): void;
  /**
   * Will be executed when the component is destroyed.
   */
  destroy?(): void;
};

type AlpineMagics<T> = {
  /**
   * Access to current Alpine data.
   */
  $data: T;
  /**
   * Retrieve the current DOM node.
   */
  $el: HTMLElement;
  /**
   * Retrieve DOM elements marked with x-ref inside the component.
   */
  $refs: Record<string, HTMLElement>;
  /**
   * Access registered global Alpine stores.
   */
  $store: XDataContext | string | number | boolean;
  /**
   * Dispatch browser events.
   *
   * @param event the event name
   * @param data an event-dependent value associated with the event, the value is then available to the handler using the CustomEvent.detail property
   */
  $dispatch: (event: string, data?: any) => void;
  /**
   * Generate an element's ID and ensure that it won't conflict with other IDs of the same name on the same page.
   *
   * @param name the name of the id
   * @param key suffix on the end of the generated ID, usually helpful for the purpose of identifying id in a loop
   */
  $id: (name: string, key?: number | string) => string;
  /**
   * Execute a given expression AFTER Alpine has made its reactive DOM updates.
   *
   * @param callback a callback that will be fired after Alpine finishes updating the DOM
   */
  $nextTick: (callback?: () => void) => Promise<void>;
  /**
   * Fire the given callback when the value in the property is changed.
   *
   * @param property the component property
   * @param callback a callback that will fire when a given property is changed
   */
  $watch: <
    K extends keyof T | string,
    V extends K extends keyof T ? T[K] : any
  >(
    property: K,
    callback: (newValue: V, oldValue: V) => void
  ) => void;
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
