import { Bindings } from './binds';

export type ElementWithXAttributes = Element & {
  _x_virtualDirectives?: Bindings;
  _x_ids?: Record<string, number>;
  _x_effects?: Set<() => void>;
  _x_runEffects?: () => void;
};
