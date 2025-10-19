// Production Features - Tüm Phase 8 özelliklerini birleştiren dosya

// Progressive Enhancement
export {
  ProgressiveEnhancementManager,
  createProgressiveEnhancement,
  createDefaultProgressiveEnhancement,
  BrowserCapabilities,
  logEnhancementState,
  hasWebWorkers,
  hasWebAssembly,
  hasServiceWorkers,
  hasIntersectionObserver,
  hasWebGL,
  hasLocalStorage,
  hasGeolocation,
  hasWebRTC,
  hasModernJS,
  type ProgressiveFeature,
  type ProgressiveConfig,
  type EnhancementState,
} from './progressiveEnhancement';

// Note: ErrorBoundary is exported from errorBoundaries, not createErrorBoundary

// Error Boundaries
export {
  ErrorBoundary,
  createErrorBoundary,
  createErrorBoundaryComponent,
  createErrorBoundaryComponentWithProps,
  setupGlobalErrorHandler,
  logError,
  parseErrorStack,
  type ErrorBoundaryConfig,
  type ErrorInfo,
  type ErrorBoundaryState,
  type ErrorBoundaryProps,
  type ErrorBoundaryComponent,
} from './errorBoundaries';

// Suspense & Loading States
export {
  SuspenseManager,
  SuspenseBoundary,
  createSuspenseManager,
  createSuspenseBoundary,
  createLoadingWrapper,
  useSuspense,
  useLoadingState,
  createDefaultLoadingIndicator,
  createSkeletonLoadingIndicator,
  createProgressLoadingIndicator,
  withDelay,
  withRetry,
  type SuspenseConfig,
  type LoadingState,
  type SuspenseBoundaryState,
} from './suspense';

// Context API
export {
  Context,
  ContextProvider,
  ContextConsumer,
  createContext,
  createContextProvider,
  createContextConsumer,
  useContext,
  useContextSelector,
  useContextWithSubscription,
  combineContexts,
  debugContextTree,
  createContextPerformanceMonitor,
  integrateWithDevTools,
  type ContextValue,
  type ContextProviderProps,
  type ContextConfig,
} from './context';

// Virtual Scrolling
export {
  VirtualScrollManager,
  VirtualScrollComponent,
  DynamicHeightCalculator,
  InfiniteScrollHelper,
  createVirtualScrollManager,
  createVirtualScrollComponent,
  measureVirtualScrollPerformance,
  type VirtualScrollConfig,
  type VirtualScrollItem,
  type VirtualScrollState,
  type RenderComponentProps,
  type VirtualScrollProps,
} from './virtualScrolling';

// Portal System
export {
  PortalManager,
  PortalComponent,
  createPortalManager,
  createPortalComponent,
  createPortal,
  createModalPortal,
  createToastPortal,
  createTooltipPortal,
  PortalUtils,
  debugPortals,
  type PortalConfig,
  type PortalInstance,
  type PortalManagerState,
  type PortalProps,
} from './portal';

// Web Workers
export {
  WebWorkerManager,
  WorkerTaskExecutor,
  createWebWorkerManager,
  createWorkerTaskExecutor,
  generateWorkerScript,
  cpuIntensiveTask,
  dataProcessingTask,
  imageProcessingTask,
  type WorkerMessage,
  type WorkerTask,
  type WorkerConfig,
} from './webWorkers';

// WebAssembly
export {
  WebAssemblyManager,
  WasmMemoryManager,
  WasmPerformanceMonitor,
  createWebAssemblyManager,
  createWasmMemoryManager,
  createWasmPerformanceMonitor,
  optimizeWasmModule,
  analyzeWasmModule,
  wasmToJavaScript,
  WasmDebug,
  type WebAssemblyConfig,
  type WasmModuleInfo,
  type WasmInstanceConfig,
} from './webAssembly';

// Plugin System - Will be added when plugin-system package is properly built
// export {
//   PluginManager,
//   createPlugin,
//   createPluginManager,
//   loggerPlugin,
//   performancePlugin,
//   analyticsPlugin,
//   themePlugin,
//   globalPluginRegistry,
//   PluginUtils,
//   type PluginConfig,
//   type PluginHooks,
//   type PluginCommand,
//   type PluginComponent,
//   type PluginMiddleware,
//   type PluginEnhancer,
//   type PluginInstance,
//   type PluginRegistry,
// } from '../plugin-system/src/index';

// SSR (Server-Side Rendering)
export {
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
} from './ssr';
