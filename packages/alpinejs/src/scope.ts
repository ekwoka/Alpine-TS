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
  scope: Record<string, unknown>,
  fromXFor = false
) => {
  const existingScope =
    (fromXFor && element._x_forScope) || element._x_dataStack[0];

  Object.assign(existingScope, scope);
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

function collapseProxies(this: Record<string, unknown>) {
  const keys = Reflect.ownKeys(this);
  const collapsed = keys.reduce((acc, key) => {
    console.log(key);
    acc[key] = Reflect.get(this, key);
    return acc;
  }, {} as Record<string | symbol | number, unknown>);
  return collapsed;
}

export const mergeProxies = (objects: Record<string, unknown>[]) => {
  const thisProxy = new Proxy(
    {},
    {
      ownKeys: () =>
        Array.from(new Set(objects.flatMap((i) => Object.keys(i)))),
      has: (_, name) =>
        objects.some((obj) => Object.prototype.hasOwnProperty.call(obj, name)),
      get: (_, name) => {
        if (name == 'toJSON') return collapseProxies;
        return Reflect.get(
          objects.find((obj) =>
            Object.prototype.hasOwnProperty.call(obj, name)
          ) ?? {},
          name as string,
          thisProxy
        );
      },
      set: (_, name, value) =>
        Reflect.set(
          objects.find((obj) =>
            Object.prototype.hasOwnProperty.call(obj, name)
          ) ?? {},
          name,
          value
        ),
    }
  );

  return thisProxy;
};
