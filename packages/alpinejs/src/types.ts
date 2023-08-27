import { Alpine } from './alpine';
import { Bindings } from './binds';
import { evaluate, evaluateLater } from './evaluator';
import { interceptor } from './interceptor';
import { effect } from './reactivity';

export type ElementWithXAttributes<T extends Element = HTMLElement> =
  withXAttributes<T>;

export interface XAttributes {
  _x_virtualDirectives: Bindings;
  _x_ids: Record<string, number>;
  _x_effects: Set<() => void>;
  _x_runEffects: () => void;
  _x_dataStack: Record<string, unknown>[];
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
  _x_refs_proxy: Record<string, HTMLElement | undefined>;
  _x_refs?: Record<string, HTMLElement | undefined>;
  _x_keyExpression: string;
  _x_prevKeys: string[];
  _x_forScope: Record<string, unknown>;
  _x_lookup: Record<string, ElementWithXAttributes>;
  _x_currentIfEl: ElementWithXAttributes;
  _x_undoIf: () => void;
  _x_removeModelListeners: Record<string, () => void>;
  _x_model: {
    get: () => unknown;
    set: (value: unknown) => void;
  };
  _x_forceModelUpdate: (value: unknown) => void;
  _x_forwardEvents: string[];
  _x_doHide: () => void;
  _x_doShow: () => void;
  _x_toggleAndCascadeWithTransitions: (
    el: ElementWithXAttributes,
    val: boolean,
    show: () => void,
    hide: () => void
  ) => void;
  _x_teleport: ElementWithXAttributes;
  _x_transition: Transitions;
  _x_hidePromise: Promise<() => void>;
  _x_transitioning: {
    beforeCancel: (fn: () => void) => void;
    beforeCancels: (() => void)[];
    cancel: () => void;
    finish: () => void;
  };
  _x_hideChildren: ElementWithXAttributes[];
  _x_inlineBindings: Record<string, Binding>;
}

type Binding = {
  expression: string;
  extract: boolean;
};
export type withXAttributes<T extends Element> = T & Partial<XAttributes>;

type Transitions = {
  enter: TransitionStages;
  leave: TransitionStages;
} & TransitionFromObject;

export type TransitionStages = Partial<{
  start: string | TransitionFromHelpers;
  during: string | TransitionFromHelpers;
  end: string | TransitionFromHelpers;
}>;

type TransitionFromHelpers = Partial<CSSStyleDeclaration>;

type TransitionFromObject = {
  in: (before: () => void, after?: () => void) => void;
  out: (before: () => void, after?: () => void) => void;
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
    expression: string | (() => T),
    extras?: Record<string, unknown>,
    _?: boolean
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
