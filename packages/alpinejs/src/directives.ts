import Alpine from './alpine';
import { evaluate, evaluateLater } from './evaluator';
import { onAttributeRemoved } from './mutation';
import { elementBoundEffect } from './reactivity';
import {
  DirectiveCallback,
  DirectiveData,
  ElementWithXAttributes,
  Utilities,
} from './types';

let prefixAsString = 'x-';

export const prefix = (subject = '') => prefixAsString + subject;

export const setPrefix = (newPrefix: string) => (prefixAsString = newPrefix);

const directiveHandlers: Record<string, DirectiveCallback> = {};

export const directive = (name: string, callback: DirectiveCallback) => {
  directiveHandlers[name] = callback;

  return {
    before(directive: string) {
      if (!directiveHandlers[directive]) {
        console.warn(
          'Cannot find directive `${directive}`. ' +
            '`${name}` will use the default order of execution',
        );
        return;
      }
      const pos = directiveOrder.indexOf(directive);
      directiveOrder.splice(
        pos >= 0 ? pos : directiveOrder.indexOf('DEFAULT'),
        0,
        name,
      );
    },
  };
};

export const directives = (
  el: ElementWithXAttributes,
  attributes:
    | Array<{ name: string; value: string | (() => unknown) }>
    | NamedNodeMap,
  originalAttributeOverride?: string,
) => {
  attributes = Array.from(attributes);

  if (el._x_virtualDirectives) {
    let vAttributes = Object.entries(el._x_virtualDirectives).map(
      ([name, value]) => ({ name, value }),
    );

    const staticAttributes = attributesOnly(vAttributes);

    // Handle binding normal HTML attributes (non-Alpine directives).
    vAttributes = vAttributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`,
        };
      }

      return attribute;
    });

    attributes = attributes.concat(vAttributes);
  }

  const transformedAttributeMap = {};

  const directives = attributes
    .map(
      toTransformedAttributes(
        (newName, oldName) => (transformedAttributeMap[newName] = oldName),
      ),
    )
    .filter(outNonAlpineAttributes)
    .map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride))
    .sort(byPriority);

  return directives.map((directive) => {
    return getDirectiveHandler(el, directive);
  });
};

export function attributesOnly(attributes: Attribute[]) {
  return Array.from(attributes)
    .map(toTransformedAttributes())
    .filter((attr) => !outNonAlpineAttributes(attr));
}

let isDeferringHandlers = false;
const directiveHandlerStacks = new Map();
let currentHandlerStackKey = Symbol();

export function deferHandlingDirectives(callback) {
  isDeferringHandlers = true;

  const key = Symbol();

  currentHandlerStackKey = key;

  directiveHandlerStacks.set(key, []);

  const flushHandlers = () => {
    while (directiveHandlerStacks.get(key).length)
      directiveHandlerStacks.get(key).shift()();

    directiveHandlerStacks.delete(key);
  };

  const stopDeferring = () => {
    isDeferringHandlers = false;
    flushHandlers();
  };

  callback(flushHandlers);

  stopDeferring();
}

export const getElementBoundUtilities = (
  el: ElementWithXAttributes,
): [Utilities, () => void] => {
  const cleanups: (() => void)[] = [];

  const cleanup = (callback: () => void) => cleanups.push(callback);

  const [effect, cleanupEffect] = elementBoundEffect(el);

  cleanups.push(cleanupEffect);

  const utilities: Utilities = {
    Alpine,
    effect,
    cleanup,
    evaluateLater: evaluateLater.bind(evaluateLater, el),
    evaluate: evaluate.bind(evaluate, el),
  };

  const doCleanup = () => cleanups.forEach((i) => i());

  return [utilities, doCleanup];
};

export const getDirectiveHandler = (el: ElementWithXAttributes, directive) => {
  const handler =
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    directiveHandlers[directive.type] || ((() => {}) as DirectiveCallback);

  const [utilities, cleanup] = getElementBoundUtilities(el);

  onAttributeRemoved(el, directive.original, cleanup);

  const fullHandler = () => {
    if (el._x_ignore || el._x_ignoreSelf) return;

    if (handler.inline) handler.inline(el, directive, utilities);

    const boundHandler = handler.bind(handler, el, directive, utilities);

    isDeferringHandlers
      ? directiveHandlerStacks.get(currentHandlerStackKey).push(boundHandler)
      : boundHandler();
  };

  fullHandler.runCleanups = cleanup;

  return fullHandler;
};

export const startingWith =
  (subject: string, replacement: string) =>
  ({ name, value }: Attribute): Attribute => {
    if (name.startsWith(subject)) name = name.replace(subject, replacement);

    return { name, value };
  };

export const into = <T>(i: T): T => i;

const toTransformedAttributes =
  (
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callback: (newName: string, oldName: string) => void = () => {},
  ) =>
  ({ name, value }: Attribute): Attribute => {
    const { name: newName, value: newValue } = attributeTransformers.reduce(
      (carry, transform) => transform(carry),
      { name, value },
    );

    if (newName !== name) callback(newName, name);

    return { name: newName, value: newValue };
  };

const attributeTransformers: AttributeTransformer[] = [];

type AttributeTransformer = (attribute: Attribute) => Attribute;

type Attribute = { name: string; value: string | (() => unknown) };

export const mapAttributes = (callback: AttributeTransformer) => {
  attributeTransformers.push(callback);
};

const outNonAlpineAttributes = ({ name }: Attribute) => {
  return alpineAttributeRegex().test(name);
};

const alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);

const toParsedDirectives = (
  transformedAttributeMap,
  originalAttributeOverride,
) => {
  return ({ name, value }) => {
    const typeMatch = name.match(alpineAttributeRegex());
    const valueMatch = name.match(/:([a-zA-Z0-9\-_:]+)/);
    const modifiers: string[] = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    const original =
      originalAttributeOverride || transformedAttributeMap[name] || name;

    return {
      type: typeMatch ? typeMatch[1] : null,
      value: valueMatch ? valueMatch[1] : null,
      modifiers: modifiers.map((i) => i.replace('.', '')),
      expression: value,
      original,
    };
  };
};

const DEFAULT = 'DEFAULT';

const directiveOrder = [
  'ignore',
  'ref',
  'data',
  'id',
  // @todo: provide better directive ordering mechanisms so
  // that I don't have to manually add things like "tabs"
  // to the order list...
  'tabs',
  'radio',
  'switch',
  'disclosure',
  'bind',
  'init',
  'for',
  'mask',
  'model',
  'modelable',
  'transition',
  'show',
  'if',
  DEFAULT,
  'teleport',
];

const byPriority = (a: DirectiveData, b: DirectiveData) => {
  const typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
  const typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;

  return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
};
