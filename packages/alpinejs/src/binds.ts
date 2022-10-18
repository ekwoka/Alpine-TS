import { attributesOnly, directives } from './directives';
import { ElementWithXAttributes } from './types';
import { functionWrap } from './utils/typeWrap';

const binds: Record<string, BindingFactory> = {};

export type Bindings = {
  [key: string]: string;
};

type BindingFactory = (...args: unknown[]) => Bindings;

export const bind = (
  name: string | ElementWithXAttributes,
  bindings: Bindings | BindingFactory
) => {
  const getBindings = functionWrap(bindings);

  if (name instanceof Element) applyBindingsObject(name, getBindings());
  else binds[name] = getBindings;
};

export const injectBindingProviders = (obj: Record<string, unknown>) => {
  Object.entries(binds).forEach(([name, callback]) => {
    Object.defineProperty(obj, name, {
      get() {
        return (...args: Parameters<typeof callback>) => {
          return callback(...args);
        };
      },
    });
  });

  return obj;
};

export const addVirtualBindings = (
  el: ElementWithXAttributes,
  bindings: Bindings | BindingFactory
) => {
  const getBindings = functionWrap(bindings);

  el._x_virtualDirectives = getBindings();
};

export const applyBindingsObject = (
  el: ElementWithXAttributes,
  bindings: Bindings,
  original?: string
) => {
  const cleanupRunners = [];

  while (cleanupRunners.length) cleanupRunners.pop()();

  const allAttributes = Object.entries(bindings).map(([name, value]) => ({
    name,
    value,
  }));

  const staticAttributes = attributesOnly(allAttributes);

  // Handle binding normal HTML attributes (non-Alpine directives).
  const attributes = allAttributes.map((attribute) => {
    if (staticAttributes.some((attr) => attr.name === attribute.name)) {
      return {
        name: `x-bind:${attribute.name}`,
        value: `"${attribute.value}"`,
      };
    }

    return attribute;
  });

  directives(el, attributes, original).map((handle) => {
    cleanupRunners.push(handle.runCleanups);

    handle();
  });
};
