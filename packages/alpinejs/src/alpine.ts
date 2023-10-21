import { bind } from './binds';
import { clone, cloneNode, onlyDuringClone, skipDuringClone } from './clone';
import { data } from './data';
import {
  directive,
  mapAttributes,
  setPrefix as prefix,
  prefix as prefixed,
} from './directives';
import { transition } from './directives/x-transition';
import { entangle } from './entangle';
import {
  dontAutoEvaluateFunctions,
  evaluate,
  evaluateLater,
  setEvaluator,
} from './evaluator';
import { interceptor } from './interceptor';
import {
  addInitSelector,
  addRootSelector,
  closestRoot,
  destroyTree,
  findClosest,
  initTree,
  interceptInit,
  start,
} from './lifecycle';
import { magic } from './magics';
import {
  deferMutations,
  flushAndStopDeferringMutations,
  mutateDom,
  onAttributeRemoved,
  onAttributesAdded,
  startObservingMutations,
  stopObservingMutations,
} from './mutation';
import { nextTick } from './nextTick';
import { plugin } from './plugin';
import {
  disableEffectScheduling,
  effect,
  raw,
  reactive,
  release,
  setReactivityEngine,
} from './reactivity';
import {
  scope as $data,
  addScopeToNode,
  closestDataStack,
  mergeProxies,
} from './scope';
import { store } from './store';
import { walk } from './utils';
import { getBinding as bound, extractProp } from './utils/bind';
import { debounce } from './utils/debounce';
import { setStyles } from './utils/styles';
import { throttle } from './utils/throttle';

export const Alpine: Alpine = {
  get reactive() {
    return reactive;
  },
  get release() {
    return release;
  },
  get effect() {
    return effect;
  },
  get raw() {
    return raw;
  },
  version: 'ALPINE_VERSION',
  flushAndStopDeferringMutations,
  dontAutoEvaluateFunctions,
  disableEffectScheduling,
  startObservingMutations,
  stopObservingMutations,
  setReactivityEngine,
  onAttributeRemoved,
  onAttributesAdded,
  closestDataStack,
  skipDuringClone,
  onlyDuringClone,
  addRootSelector,
  addInitSelector,
  addScopeToNode,
  deferMutations,
  mapAttributes,
  evaluateLater,
  interceptInit,
  setEvaluator,
  mergeProxies,
  extractProp,
  findClosest,
  closestRoot,
  destroyTree,
  interceptor, // INTERNAL: not public API and is subject to change without major release.
  transition, // INTERNAL
  setStyles, // INTERNAL
  mutateDom,
  directive,
  entangle,
  throttle,
  debounce,
  evaluate,
  initTree,
  nextTick,
  prefixed,
  prefix,
  plugin,
  magic,
  store,
  start,
  clone,
  cloneNode,
  bound,
  $data,
  walk,
  data,
  bind,
};

export default Alpine;

export interface Alpine {
  readonly reactive: typeof reactive;
  readonly release: typeof release;
  readonly effect: typeof effect;
  readonly raw: typeof raw;
  version: string;
  flushAndStopDeferringMutations: typeof flushAndStopDeferringMutations;
  dontAutoEvaluateFunctions: typeof dontAutoEvaluateFunctions;
  disableEffectScheduling: typeof disableEffectScheduling;
  startObservingMutations: typeof startObservingMutations;
  stopObservingMutations: typeof stopObservingMutations;
  setReactivityEngine: typeof setReactivityEngine;
  onAttributeRemoved: typeof onAttributeRemoved;
  onAttributesAdded: typeof onAttributesAdded;
  closestDataStack: typeof closestDataStack;
  skipDuringClone: typeof skipDuringClone;
  onlyDuringClone: typeof onlyDuringClone;
  addRootSelector: typeof addRootSelector;
  addInitSelector: typeof addInitSelector;
  addScopeToNode: typeof addScopeToNode;
  deferMutations: typeof deferMutations;
  mapAttributes: typeof mapAttributes;
  evaluateLater: typeof evaluateLater;
  interceptInit: typeof interceptInit;
  setEvaluator: typeof setEvaluator;
  mergeProxies: typeof mergeProxies;
  extractProp: typeof extractProp;
  findClosest: typeof findClosest;
  closestRoot: typeof closestRoot;
  destroyTree: typeof destroyTree;
  interceptor: typeof interceptor; // INTERNAL: not public API and is subject to change without major release.
  transition: typeof transition; // INTERNAL
  setStyles: typeof setStyles; // INTERNAL
  mutateDom: typeof mutateDom;
  directive: typeof directive;
  entangle: typeof entangle;
  throttle: typeof throttle;
  debounce: typeof debounce;
  evaluate: typeof evaluate;
  initTree: typeof initTree;
  nextTick: typeof nextTick;
  prefixed: typeof prefixed;
  prefix: typeof prefix;
  plugin: typeof plugin;
  magic: typeof magic;
  store: typeof store;
  start: typeof start;
  clone: typeof clone;
  cloneNode: typeof cloneNode;
  bound: typeof bound;
  $data: typeof $data;
  walk: typeof walk;
  data: typeof data;
  bind: typeof bind;
}
