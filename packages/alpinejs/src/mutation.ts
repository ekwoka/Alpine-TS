import type { ElementWithXAttributes, MutationCallback } from './types';

const onAttributeAddeds: ((
  el: ElementWithXAttributes,
  attrs: { name: string; value: string }[]
) => void)[] = [];
const onElRemoveds: MutationCallback[] = [];
const onElAddeds: MutationCallback[] = [];

export const onElAdded = (callback: () => void) => onElAddeds.push(callback);
export const onElRemoved = (
  el: ElementWithXAttributes,
  callback?: MutationCallback
) => {
  if (typeof callback === 'function') {
    if (!el._x_cleanups) el._x_cleanups = [];
    el._x_cleanups.push(callback);
  } else {
    callback = el as unknown as MutationCallback;
    onElRemoveds.push(callback);
  }
};

export const onAttributesAdded = (callback: MutationCallback) =>
  onAttributeAddeds.push(callback);

export const onAttributeRemoved = (
  el: ElementWithXAttributes,
  name: string,
  callback: () => void
) => {
  if (!el._x_attributeCleanups) el._x_attributeCleanups = {};
  if (!el._x_attributeCleanups[name]) el._x_attributeCleanups[name] = [];

  el._x_attributeCleanups[name].push(callback);
};

export const cleanupAttributes = (
  el: ElementWithXAttributes,
  names?: string[]
) => {
  if (!el._x_attributeCleanups) return;

  Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
    if (names === undefined || names.includes(name)) {
      value.forEach((i) => i());

      delete el._x_attributeCleanups[name];
    }
  });
};

const onMutate = (mutations: MutationRecord[]) => {
  if (isCollecting)
    return (deferredMutations = deferredMutations.concat(mutations));

  let addedNodes: ElementWithXAttributes[] = [];
  let removedNodes: ElementWithXAttributes[] = [];
  let addedAttributes = new Map<
    ElementWithXAttributes,
    { name: string; value: string }[]
  >();
  let removedAttributes = new Map<ElementWithXAttributes, string[]>();

  mutations.forEach((mutation) => {
    const el = mutation.target as ElementWithXAttributes;
    if (el._x_ignoreMutationObserver) return;

    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(
        (node) =>
          node.nodeType === 1 && addedNodes.push(node as ElementWithXAttributes)
      );
      mutation.removedNodes.forEach(
        (node) =>
          node.nodeType === 1 &&
          removedNodes.push(node as ElementWithXAttributes)
      );
    }

    if (mutation.type === 'attributes') {
      const name = mutation.attributeName;
      const oldValue = mutation.oldValue;

      const add = () => {
        if (!addedAttributes.has(el)) addedAttributes.set(el, []);

        addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
      };

      const remove = () => {
        if (!removedAttributes.has(el)) removedAttributes.set(el, []);

        removedAttributes.get(el).push(name);
      };

      // New attribute.
      if (el.hasAttribute(name) && oldValue === null) add();
      // Changed atttribute.
      else if (el.hasAttribute(name)) {
        remove();
        add();

        // Removed atttribute.
      } else remove();
    }
  });

  removedAttributes.forEach((attrs, el) => cleanupAttributes(el, attrs));

  addedAttributes.forEach((attrs, el) =>
    onAttributeAddeds.forEach((i) => i(el, attrs))
  );

  removedNodes.forEach((node) => {
    // If an element gets moved on a page, it's registered
    // as both an "add" and "remove", so we want to skip those.
    if (addedNodes.includes(node)) return;

    onElRemoveds.forEach((i) => i(node));

    if (node._x_cleanups) {
      while (node._x_cleanups.length) node._x_cleanups.pop()();
    }
  });

  // Mutations are bundled together by the browser but sometimes
  // for complex cases, there may be javascript code adding a wrapper
  // and then an alpine component as a child of that wrapper in the same
  // function and the mutation observer will receive 2 different mutations.
  // when it comes time to run them, the dom contains both changes so the child
  // element would be processed twice as Alpine calls initTree on
  // both mutations. We mark all nodes as _x_ignored and only remove the flag
  // when processing the node to avoid those duplicates.
  addedNodes.forEach((node) => {
    node._x_ignoreSelf = true;
    node._x_ignore = true;
  });
  addedNodes.forEach((node) => {
    // If an element gets moved on a page, it's registered
    // as both an "add" and "remove", so we want to skip those.
    if (removedNodes.includes(node)) return;

    // If the node was eventually removed as part of one of his
    // parent mutations, skip it
    if (!node.isConnected) return;

    delete node._x_ignoreSelf;
    delete node._x_ignore;
    onElAddeds.forEach((i) => i(node));
    node._x_ignore = true;
    node._x_ignoreSelf = true;
  });
  addedNodes.forEach((node) => {
    delete node._x_ignoreSelf;
    delete node._x_ignore;
  });

  addedNodes = null;
  removedNodes = null;
  addedAttributes = null;
  removedAttributes = null;
};
const observer = new MutationObserver(onMutate);

let currentlyObserving = false;

export const startObservingMutations = () => {
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
  });

  currentlyObserving = true;
};

export const stopObservingMutations = () => {
  flushObserver();

  observer.disconnect();

  currentlyObserving = false;
};

let recordQueue: MutationRecord[] = [];
let willProcessRecordQueue = false;

export const flushObserver = () => {
  recordQueue = recordQueue.concat(observer.takeRecords());

  if (recordQueue.length && !willProcessRecordQueue) {
    willProcessRecordQueue = true;

    queueMicrotask(() => {
      processRecordQueue();

      willProcessRecordQueue = false;
    });
  }
};

const processRecordQueue = () => {
  onMutate(recordQueue);

  recordQueue.length = 0;
};

export const mutateDom = <T>(callback: () => T): T => {
  if (!currentlyObserving) return callback();

  stopObservingMutations();

  const result = callback();

  startObservingMutations();

  return result;
};

let isCollecting = false;
let deferredMutations: MutationRecord[] = [];

export const deferMutations = () => (isCollecting = true);

export const flushAndStopDeferringMutations = () => {
  isCollecting = false;

  onMutate(deferredMutations);

  deferredMutations = [];
};
