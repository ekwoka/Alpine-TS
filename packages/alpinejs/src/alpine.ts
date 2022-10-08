import { bind } from './binds';
import { clone, skipDuringClone } from './clone';
import { data } from './datas';
import {
  directive,
  mapAttributes,
  setPrefix as prefix,
  prefix as prefixed,
} from './directives';
import { transition } from './directives/x-transition';
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
  findClosest,
  initTree,
  start,
} from './lifecycle';
import { magic } from './magics';
import {
  deferMutations,
  flushAndStopDeferringMutations,
  mutateDom,
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
import { getBinding as bound } from './utils/bind';
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
  setReactivityEngine,
  closestDataStack,
  skipDuringClone,
  addRootSelector,
  addInitSelector,
  addScopeToNode,
  deferMutations,
  mapAttributes,
  evaluateLater,
  setEvaluator,
  mergeProxies,
  findClosest,
  closestRoot,
  interceptor, // INTERNAL: not public API and is subject to change without major release.
  transition, // INTERNAL
  setStyles, // INTERNAL
  mutateDom,
  directive,
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
  bound,
  $data,
  data,
  bind,
};

export default Alpine;

export type Alpine = typeof Alpine;
