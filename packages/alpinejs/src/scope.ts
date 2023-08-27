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
    acc[key] = Reflect.get(this, key);
    return acc;
  }, {} as Record<string | symbol | number, unknown>);
  return collapsed;
}

export const mergeProxies = <
  T extends Record<string | number | symbol, unknown>
>(
  objects: T[]
) => {
  const thisProxy = new Proxy({ objects }, proxyMerger);

  return thisProxy as unknown as T;
};

type wrappedProxy = {
  objects: Record<string | number | symbol, unknown>[];
};

const proxyMerger: ProxyHandler<wrappedProxy> = {
  ownKeys(proxies) {
    return Array.from(new Set(proxies.objects.flatMap((i) => Object.keys(i))));
  },
  has(proxies, name) {
    if (name == Symbol.unscopables) return false;
    return proxies.objects.some((obj) =>
      Object.prototype.hasOwnProperty.call(obj, name)
    );
  },
  get(proxies, name, thisProxy) {
    if (name == 'toJSON') return collapseProxies;
    return Reflect.get(
      proxies.objects.find((obj) =>
        Object.prototype.hasOwnProperty.call(obj, name)
      ) ?? {},
      name as string,
      thisProxy
    );
  },
  set(proxies, name, value) {
    return Reflect.set(
      proxies.objects.find((obj) =>
        Object.prototype.hasOwnProperty.call(obj, name)
      ) ?? proxies.objects.at(-1),
      name,
      value
    );
  },
};
