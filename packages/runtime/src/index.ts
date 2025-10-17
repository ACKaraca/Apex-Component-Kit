/**
 * @ack/runtime - Public API
 * Türkçe: Runtime paketinin tüm public API'sini export eder.
 */

// Reactivity exports
export {
  createReactive,
  watch,
  isReactive,
  computed,
  clearWatchers,
  type WatcherCallback,
  type ReactiveObject,
} from './reactivity';

// Mount exports
export {
  mount,
  unmount,
  hydrate,
  ComponentManager,
  type ACKComponent,
} from './mount';

// Effects exports
export {
  createEffect,
  computed as computedEffect,
  memo,
  batch,
  scheduledEffect,
  Computed,
  EffectManager,
  type EffectCallback,
  type EffectCleanup,
  type EffectOptions,
} from './effects';

/**
 * Framework version
 */
export const VERSION = '0.0.1';

/**
 * Genel utility - all exports'u bir obje'de sun.
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
