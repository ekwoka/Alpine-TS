const Data: Record<string, DataFunction> = {};

type DataFunction = (...args: unknown[]) => Record<string, unknown>;

export const data = (name: string, callback: DataFunction) => {
  Data[name] = callback;
};

export function injectDataProviders(
  obj: Record<string, unknown>,
  context: Record<string, unknown>
) {
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
}
