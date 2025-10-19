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

// Production Features exports
import {
  ProgressiveEnhancementManager,
  ErrorBoundary,
  SuspenseManager,
  Context,
  VirtualScrollManager,
  PortalManager,
  WebWorkerManager,
  WebAssemblyManager,
  // SSR
  SSRManager,
  BaseSSRComponent,
  SSRStreamingHelper,
  SSRPerformanceMonitor,
  SSRSecurityUtils,
  createProgressiveEnhancement,
  createErrorBoundary,
  createSuspenseManager,
  createContext,
  createVirtualScrollManager,
  createPortalManager,
  createWebWorkerManager,
  createWebAssemblyManager,
  createSSRManager,
  createSSRContext,
  createSSRMiddleware,
  createSSRKoaMiddleware,
  BrowserCapabilities,
  logEnhancementState,
  type ProgressiveFeature,
  type ProgressiveConfig,
  type EnhancementState,
  type ErrorBoundaryConfig,
  type ErrorInfo,
  type ErrorBoundaryState,
  type SuspenseConfig,
  type LoadingState,
  type SuspenseBoundaryState,
  type ContextConfig,
  type ContextProviderProps,
  type VirtualScrollConfig,
  type VirtualScrollState,
  type RenderComponentProps,
  type PortalConfig,
  type PortalInstance,
  type WorkerConfig,
  type WorkerMessage,
  type WorkerTask,
  type WebAssemblyConfig,
  type WasmModuleInfo,
  type WasmInstanceConfig,
  type WasmMemoryManager,
  type WasmPerformanceMonitor,
  type SSRConfig,
  type SSRContext,
  type SSRResult,
  type SSRComponent,
} from './productionFeatures';

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
  // Production Features
  ProgressiveEnhancementManager,
  ErrorBoundary,
  SuspenseManager,
  Context,
  VirtualScrollManager,
  PortalManager,
  WebWorkerManager,
  WebAssemblyManager,
  createProgressiveEnhancement,
  createErrorBoundary,
  createSuspenseManager,
  createContext,
  createVirtualScrollManager,
  createPortalManager,
  createWebWorkerManager,
  createWebAssemblyManager,
  BrowserCapabilities,
  logEnhancementState,
  type ProgressiveFeature,
  type ProgressiveConfig,
  type EnhancementState,
  type ErrorBoundaryConfig,
  type ErrorInfo,
  type ErrorBoundaryState,
  type SuspenseConfig,
  type LoadingState,
  type SuspenseBoundaryState,
  type ContextConfig,
  type ContextProviderProps,
  type VirtualScrollConfig,
  type VirtualScrollState,
  type RenderComponentProps,
  type PortalConfig,
  type PortalInstance,
  type WorkerConfig,
  type WorkerMessage,
  type WorkerTask,
  type WebAssemblyConfig,
  type WasmModuleInfo,
  type WasmInstanceConfig,
  type WasmMemoryManager,
  type WasmPerformanceMonitor,
  // SSR
  SSRManager,
  BaseSSRComponent,
  SSRStreamingHelper,
  SSRPerformanceMonitor,
  SSRSecurityUtils,
  createSSRManager,
  createSSRContext,
  createSSRMiddleware,
  createSSRKoaMiddleware,
  type SSRConfig,
  type SSRContext,
  type SSRResult,
  type SSRComponent,
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
