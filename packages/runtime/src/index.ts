/**
 * @ack/runtime - Public API
 * Turkish: Exports all public APIs from the runtime package.
 */

// Reactivity exports
import {
  createReactive,
  watch,
  isReactive,
  computed,
  clearWatchers,
  type WatcherCallback,
  type ReactiveObject,
} from './reactivity';

// Mount exports
import {
  mount,
  unmount,
  hydrate,
  ComponentManager,
  type ACKComponent,
} from './mount';

// Effects exports
import {
  createEffect,
  memo,
  batch,
  scheduledEffect,
  Computed,
  EffectManager,
  type EffectCallback,
  type EffectCleanup,
  type EffectOptions,
} from './effects';

export {
  createReactive,
  watch,
  isReactive,
  computed,
  clearWatchers,
  type WatcherCallback,
  type ReactiveObject,
  mount,
  unmount,
  hydrate,
  ComponentManager,
  type ACKComponent,
  createEffect,
  memo,
  batch,
  scheduledEffect,
  Computed,
  EffectManager,
  type EffectCallback,
  type EffectCleanup,
  type EffectOptions,
};

/**
 * Framework version
 */
export const VERSION = '0.0.1';

/**
 * General utility - expose all exports in a single object
 */
export const ACKRuntime = {
  // Reactivity
  createReactive,
  watch,
  isReactive,
  computed,
  clearWatchers,

  // Mount
  mount,
  unmount,
  hydrate,
  ComponentManager,

  // Effects
  createEffect,
  memo,
  batch,
  scheduledEffect,
  Computed,
  EffectManager,

  // Metadata
  VERSION,
};
