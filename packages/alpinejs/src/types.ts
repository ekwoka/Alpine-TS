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
  _x_ignore: unknown;
  _x_ignoreSelf: unknown;
  _x_isShown: boolean;
  _x_bindings: Record<string, unknown>;
  _x_undoAddedClasses: () => void;
  _x_undoAddedStyles: () => void;
};

export type Utilities = {
  Alpine: Alpine;
  effect: typeof effect;
  cleanup: (callback: () => void) => void;
  evaluateLater: typeof evaluateLater;
  evaluate: typeof evaluate;
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
