import { Alpine } from './alpine';
import { Bindings } from './binds';
import { evaluate, evaluateLater } from './evaluator';
import { interceptor } from './interceptor';
import { effect } from './reactivity';

export type ElementWithXAttributes = HTMLElement & {
  _x_virtualDirectives?: Bindings;
  _x_ids?: Record<string, number>;
  _x_effects?: Set<() => void>;
  _x_runEffects?: () => void;
  _x_dataStack?: Record<string, unknown>[];
  _x_ignore: true;
  _x_ignoreSelf: true;
  _x_isShown: boolean;
  _x_bindings: Record<string, unknown>;
  _x_undoAddedClasses: () => void;
  _x_undoAddedStyles: () => void;
  _x_cleanups: MutationCallback[];
  _x_attributeCleanups: Record<string, (() => void)[]>;
  _x_ignoreMutationObserver: boolean;
  _x_teleportBack: ElementWithXAttributes;
  _x_refs_proxy: Record<string, unknown>;
  _x_refs: unknown;
  _x_keyExpression: string;
  _x_prevKeys: string[];
  _x_lookup: Record<string, ElementWithXAttributes>;
  _x_currentIfEl: ElementWithXAttributes;
};

export type MutationCallback = (node?: ElementWithXAttributes) => void;

export type AttrMutationCallback = (
  el: ElementWithXAttributes,
  attrs: { name: string; value: string }[]
) => void;

export type Utilities = {
  Alpine: Alpine;
  effect: typeof effect;
  cleanup: (callback: () => void) => void;
  evaluateLater: <T>(expression: string) => ReturnType<typeof evaluateLater<T>>;
  evaluate: <T>(
    callback: (val: T, extras: Record<string, unknown>) => void
  ) => ReturnType<typeof evaluate<T>>;
};

export type MagicUtilities = Utilities & {
  interceptor: typeof interceptor;
};

export type DirectiveData = {
  type: string;
  value: string;
  modifiers: string[];
  expression: string;
  original: string;
};

export type DirectiveCallback = {
  (
    el: ElementWithXAttributes,
    directive: DirectiveData,
    utilities: Utilities
  ): void;
  inline?: (
    el: ElementWithXAttributes,
    directive: DirectiveData,
    utilities: Utilities
  ) => void;
};
