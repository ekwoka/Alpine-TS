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

const Alpine = {
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

interface AlpineExtras {}

export type Alpine = typeof Alpine & AlpineExtras;
