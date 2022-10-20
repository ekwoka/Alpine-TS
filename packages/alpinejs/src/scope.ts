import { ElementWithXAttributes } from './types';

export const scope = (node: ElementWithXAttributes) =>
  mergeProxies(closestDataStack(node));

export const addScopeToNode = (
  node: ElementWithXAttributes,
  data: Record<string, unknown>,
  referenceNode?: ElementWithXAttributes
) => {
  node._x_dataStack = [data, ...closestDataStack(referenceNode || node)];

  return () => {
    node._x_dataStack = node._x_dataStack.filter((i) => i !== data);
  };
};

export const hasScope = (node: ElementWithXAttributes) => !!node._x_dataStack;

export const refreshScope = (
  element: ElementWithXAttributes,
  scope: Record<string, unknown>
) => {
  const existingScope = element._x_dataStack[0];

  Object.entries(scope).forEach(([key, value]) => {
    existingScope[key] = value;
  });
};

export const closestDataStack = (node: ElementWithXAttributes) => {
  if (node._x_dataStack) return node._x_dataStack;

  if (typeof ShadowRoot === 'function' && node instanceof ShadowRoot)
    return closestDataStack(node.host as ElementWithXAttributes);

  if (!node.parentNode) return [];

  return closestDataStack(node.parentNode as ElementWithXAttributes);
};

export const closestDataProxy = (el: ElementWithXAttributes) =>
  mergeProxies(closestDataStack(el));

export const mergeProxies = (objects: Record<string, unknown>[]) => {
  const thisProxy = new Proxy(
    {},
    {
      ownKeys: () =>
        Array.from(new Set(objects.flatMap((i) => Object.keys(i)))),
      has: (_, name) =>
        objects.some((obj) => Object.prototype.hasOwnProperty.call(obj, name)),
      get: (_, name) =>
        (objects.find((obj) => {
          if (Object.prototype.hasOwnProperty.call(obj, name)) {
            const descriptor = Object.getOwnPropertyDescriptor(obj, name);
            let getter = descriptor.get as PropertyDescriptor['get'] & {
              _x_alreadyBound?: boolean;
            };
            let setter = descriptor.set as PropertyDescriptor['get'] & {
              _x_alreadyBound?: boolean;
            };

            // If we already bound this getter, don't rebind.
            if (
              (getter && getter._x_alreadyBound) ||
              (setter && setter._x_alreadyBound)
            )
              return true;

            // Properly bind getters and setters to this wrapper Proxy.
            if ((getter || setter) && descriptor.enumerable) {
              // Only bind user-defined getters, not our magic properties.
              const property = descriptor;

              getter = getter && getter.bind(thisProxy);
              setter = setter && setter.bind(thisProxy);

              if (getter) getter._x_alreadyBound = true;
              if (setter) setter._x_alreadyBound = true;

              Object.defineProperty(obj, name, {
                ...property,
                get: getter,
                set: setter,
              });
            }

            return true;
          }

          return false;
        }) || {})[name as string],
      set: (_, name, value) => {
        const closestObjectWithKey = objects.find((obj) =>
          Object.prototype.hasOwnProperty.call(obj, name)
        );

        if (closestObjectWithKey) closestObjectWithKey[name as string] = value;
        else objects[objects.length - 1][name as string] = value;

        return true;
      },
    }
  );

  return thisProxy;
};
