import { ElementWithXAttributes } from 'alpinets/dist/types';

const defaultGetKey = (el: Element) => el.getAttribute('key');
const noop = () => {};
export const morph = (
  from: Element,
  to: string | Element,
  options: Partial<MorphOptions> = {},
) => {
  // We're defining these globals and methods inside this function (instead of outside)
  // because it's an async function and if run twice, they would overwrite
  // each other.
  const toEl = (
    typeof to === 'string' ? createElement(to) : to
  ) as ElementWithXAttributes;
  const {
    key = defaultGetKey,
    lookahead = false,
    updating = noop,
    updated = noop,
    removing = noop,
    removed = noop,
    adding = noop,
    added = noop,
  } = options;

  const patch = (from: ElementWithXAttributes, to: ElementWithXAttributes) => {
    if (differentElementNamesTypesOrKeys(from, to)) {
      return swapElements(from, to);
    }

    let updateChildrenOnly = false;

    if (shouldSkip(updating, from, to, () => (updateChildrenOnly = true)))
      return;

    // Initialize the server-side HTML element with Alpine...
    if (from.nodeType === 1) {
      Alpine.cloneNode(from, to);
    }

    if (textOrComment(to)) {
      patchNodeValue(from, to);

      updated(from, to);

      return;
    }

    if (!updateChildrenOnly) {
      patchAttributes(from, to);
    }

    updated(from, to);

    patchChildren(from, to);
  };

  const differentElementNamesTypesOrKeys = (from: Element, to: Element) => {
    return (
      from.nodeType != to.nodeType ||
      from.nodeName != to.nodeName ||
      getKey(from) != getKey(to)
    );
  };

  const swapElements = (
    from: ElementWithXAttributes,
    to: ElementWithXAttributes,
  ) => {
    if (shouldSkip(removing, from)) return;

    const toCloned = to.cloneNode(true);

    if (shouldSkip(adding, toCloned)) return;

    from.replaceWith(toCloned);

    removed(from);
    added(toCloned);
  };

  const patchNodeValue = (from: Node, to: Node) => {
    const value = to.nodeValue;

    if (from.nodeValue !== value) {
      // Change text node...
      from.nodeValue = value;
    }
  };

  const patchAttributes = (
    from: ElementWithXAttributes,
    to: ElementWithXAttributes,
  ) => {
    if (from._x_transitioning) return;

    if (from._x_isShown != !to._x_isShown && (to._x_isShown || from._x_isShown))
      return;

    for (const attr of [...from.attributes]) // spread to make a static copy of the nodemap
      if (!to.hasAttribute(attr.name)) from.removeAttribute(attr.name);

    for (const attr of to.attributes)
      if (from.getAttribute(attr.name) !== attr.value)
        from.setAttribute(attr.name, attr.value);
  };

  const patchChildren = (
    from: ElementWithXAttributes | Block,
    to: ElementWithXAttributes | Block,
  ) => {
    const fromKeys = keyToMap(from.children);
    const fromKeyHoldovers = {} as Record<string, Node>;

    let currentTo: Node = getFirstNode(to);
    let currentFrom: Node = getFirstNode(from);

    while (currentTo) {
      const toKey = getKey(currentTo);

      // Add new elements...
      if (!currentFrom) {
        if (toKey && fromKeyHoldovers[toKey]) {
          // Add element (from key)...
          const holdover = fromKeyHoldovers[toKey];

          from.appendChild(holdover);

          currentFrom = holdover;
        } else {
          if (!shouldSkip(adding, currentTo)) {
            const clone = currentTo.cloneNode(true);
            from.appendChild(clone);
            added(clone);
          }

          currentTo = getNextSibling(to, currentTo as ElementWithXAttributes);

          continue;
        }
      }

      let fromKey = getKey(currentFrom);

      if (isIf(currentTo) && isIf(currentFrom)) {
        const fromBlock = new Block(...getBlockBookends(from, currentFrom));
        const toBlock = new Block(...getBlockBookends(to, currentTo));

        patchChildren(fromBlock, toBlock);

        continue;
      }

      // Lookaheads should only apply to non-text-or-comment elements...
      if (
        currentFrom.nodeType === 1 &&
        lookahead &&
        !currentFrom.isEqualNode(currentTo)
      ) {
        for (
          let nextSibling = getNextSibling(to, currentTo);
          nextSibling;
          nextSibling = getNextSibling(to, nextSibling)
        ) {
          if (
            nextSibling.nodeType !== 1 ||
            !currentFrom.isEqualNode(nextSibling)
          )
            continue;
          currentFrom = addNodeBefore(from, currentTo, currentFrom);
          fromKey = getKey(currentFrom);
          break;
        }
      }

      if (toKey !== fromKey) {
        if (!toKey && fromKey) {
          // No "to" key...
          fromKeyHoldovers[fromKey] = currentFrom;
          const nextTo = getNextSibling(to, currentTo);
          currentFrom = addNodeBefore(from, currentTo, currentFrom);
          (fromKeyHoldovers[fromKey] as Element).remove();
          currentFrom = getNextSibling(from, currentFrom);
          currentTo = nextTo;
          continue;
        }

        if (toKey && !fromKey) {
          if (fromKeys[toKey]) {
            // No "from" key...
            currentFrom.replaceWith(fromKeys[toKey]);
            currentFrom = fromKeys[toKey];
          }
        }

        if (toKey && fromKey) {
          const fromKeyNode = fromKeys[toKey];

          if (fromKeyNode) {
            // Move "from" key...
            fromKeyHoldovers[fromKey] = currentFrom;
            currentFrom.replaceWith(fromKeyNode);
            currentFrom = fromKeyNode;
          } else {
            // Swap elements with keys...
            fromKeyHoldovers[fromKey] = currentFrom;
            const nextTo = getNextSibling(to, currentTo);
            currentFrom = addNodeBefore(from, currentTo, currentFrom);
            (fromKeyHoldovers[fromKey] as Element).remove();
            currentFrom = getNextSibling(from, currentFrom);
            currentTo = nextTo;
            continue;
          }
        }
      }

      // Get next from sibling before patching in case the node is replaced
      const currentFromNext = currentFrom && getNextSibling(from, currentFrom); //dom.next(from, fromChildren, currentFrom))

      // Patch elements
      patch(
        currentFrom as ElementWithXAttributes,
        currentTo as ElementWithXAttributes,
      );

      currentTo = currentTo && getNextSibling(to, currentTo); // dom.next(from, toChildren, currentTo))

      currentFrom = currentFromNext;
    }

    // Cleanup extra forms.
    const removals = [];

    // We need to collect the "removals" first before actually
    // removing them so we don't mess with the order of things.
    while (currentFrom) {
      if (!shouldSkip(removing, currentFrom)) removals.push(currentFrom);

      // currentFrom = dom.next(fromChildren, currentFrom)
      currentFrom = getNextSibling(from, currentFrom);
    }

    // Now we can do the actual removals.
    while (removals.length) {
      const domForRemoval = removals.shift();

      domForRemoval.remove();

      removed(domForRemoval);
    }
  };

  const getKey = (el: Node | undefined) => {
    return el && el.nodeType === 1 && key(el);
  };

  const keyToMap = (els: Iterable<Node>) => {
    const map = {} as Record<string, ChildNode>;

    for (const el of els) {
      const theKey = getKey(el);

      if (theKey) map[theKey] = el;
    }

    return map;
  };

  const addNodeBefore = (parent: Node | Block, node: Node, beforeMe: Node) => {
    if (!shouldSkip(adding, node)) {
      const clone = node.cloneNode(true);

      parent.insertBefore(clone, beforeMe as Element);

      added(clone);

      return clone;
    }

    return node;
  };

  if (!(from as ElementWithXAttributes)._x_dataStack) {
    // Just in case a part of this template uses Alpine scope from somewhere
    // higher in the DOM tree, we'll find that state and replace it on the root
    // element so everything is synced up accurately.
    toEl._x_dataStack = Alpine.closestDataStack(from as ElementWithXAttributes);

    // We will kick off a clone on the root element.
    toEl._x_dataStack && Alpine.cloneNode(from as ElementWithXAttributes, toEl);
  }

  patch(from as ElementWithXAttributes, toEl);

  return from;
};

// These are legacy holdovers that don't do anything anymore...
morph.step = () => {};
morph.log = () => {};
type WithoutLast<T extends unknown[]> = T extends [...infer U, unknown]
  ? U
  : never;
const shouldSkip = <T extends (...args: [...unknown[], () => void]) => unknown>(
  hook: T,
  ...args: WithoutLast<Parameters<T>>
) => {
  let skip = false;

  hook(...args, () => (skip = true));

  return skip;
};

let patched = false;

export const createElement = (html: string) =>
  document.createRange().createContextualFragment(html).firstElementChild;

export const textOrComment = (el: Node) => {
  return el.nodeType === 3 || el.nodeType === 8;
};

// "Block"s are used when morphing with conditional markers.
// They allow us to patch isolated portions of a list of
// siblings in a DOM tree...
class Block {
  startComment: Element;
  endComment: Element;
  constructor(start: Element, end: Element) {
    // We're assuming here that the start and end caps are comment blocks...
    this.startComment = start;
    this.endComment = end;
  }

  get children() {
    const children: Node[] = [];

    let currentNode: Node = this.startComment;

    while (
      (currentNode = currentNode.nextSibling) &&
      currentNode !== this.endComment
    ) {
      children.push(currentNode);
    }

    return children;
  }

  appendChild(child: Node) {
    this.endComment.before(child);
  }

  get firstChild() {
    const first = this.startComment.nextSibling;

    if (first === this.endComment) return;

    return first;
  }

  nextNode(reference: Node) {
    const next = reference.nextSibling;

    if (next === this.endComment) return;

    return next;
  }

  insertBefore(newNode: Node, reference: Element) {
    reference.before(newNode);

    return newNode;
  }
}

const getFirstNode = (parent: Node | Block) => parent.firstChild;

const getNextSibling = (parent: Node | Block, reference: Node) =>
  (reference as ElementWithXAttributes)._x_teleport ??
  (parent instanceof Block
    ? parent.nextNode(reference)
    : reference.nextSibling);

export const monkeyPatchDomSetAttributeToAllowAtSymbols = () => {
  if (patched) return;

  patched = true;

  // Because morphdom may add attributes to elements containing "@" symbols
  // like in the case of an Alpine `@click` directive, we have to patch
  // the standard Element.setAttribute method to allow this to work.
  const original = Element.prototype.setAttribute;

  Element.prototype.setAttribute = function newSetAttribute(name, value) {
    if (!name.includes('@')) {
      return original.call(this, name, value);
    }

    const attr = Object.assign(document.createAttribute(name), { value });

    this.setAttributeNode(attr);
  };
};

type MorphOptions = {
  /**
   * Callback called BEFORE updating elements
   * @param from the Nodes to be updated
   * @param to the Nodes to be updated to
   * @param childrenOnly skip updating the Nodes itself but do update its children
   * @param skip skip updating this Nodes and its child tree
   */
  updating: (
    from: Node,
    to: Node,
    childrenOnly: VoidFunction,
    skip: VoidFunction,
  ) => void;
  /**
   * Callback called AFTER updating elements
   * @param from the Node that was updated
   * @param to the Node that was referenced for updates
   */
  updated: (from: Node, to: Node) => void;
  /**
   * Callback called BEFORE removing elements
   * @param toRemove the Node to be removed
   * @param skip skip removing this Node and its child tree
   */
  removing: (toRemove: Node, skip: VoidFunction) => void;
  /**
   * Callback called AFTER removing elements
   * @param from the Node that was removed
   */
  removed: (from: Node) => void;
  /**
   * Callback called BEFORE adding elements
   * @param toAdd the Node to be added
   * @param skip skip adding this Node and its child tree
   */
  adding: (toAdd: Node, skip: VoidFunction) => void;
  /**
   * Callback called AFTER adding elements
   * @param toCloned the Node that was added
   */
  added: (toCloned: Node) => void;
  /**
   * Callback used to key Nodes for comparison. Existing Nodes and new Nodes with the same key will be treated as the same, so that they are updated with the shorted effort instead of removed and re-added.
   * By default uses the elements `id` attribute.
   * @param el the Node to be keyed
   */
  key: (el: Node) => string;
  /**
   * Whether to use lookahead to match Nodes with the same key. If true, the algorithm will look for Nodes with the same key amongst sibling Nodes.
   * @default true
   */
  lookahead: boolean;
};

// Handle conditional markers (presumably added by backends like Livewire)...
const isIf = (node: Node) =>
  node && node.nodeType === 8 && node.textContent === ' __BLOCK__ ';
const isEnd = (node: Node) =>
  node && node.nodeType === 8 && node.textContent === ' __ENDBLOCK__ ';

const getBlockBookends = (
  parent: Node | Block,
  reference: Node,
): [Element, Element] => {
  let ifCount = 1;

  const fromBlockStart = reference;

  while (ifCount && reference) {
    reference = getNextSibling(parent, reference);
    ifCount = ifCount + Number(isIf(reference)) - Number(isEnd(reference));
  }
  return [fromBlockStart, reference] as [Element, Element];
};
