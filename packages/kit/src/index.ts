/**
 * @ack/kit - Public API
 * Turkish: Exports all public APIs of @ack/kit.
 */

// Dev Server exports
import { startDevServer, closeDevServer, runDevServer } from './devServer';
import type { DevServerOptions } from './devServer';
export { startDevServer, closeDevServer, runDevServer };
export type { DevServerOptions };

// Router exports
import {
  discoverRoutes,
  createRouter,
  createAdvancedRouter,
  discoverAdvancedRoutes,
  AdvancedRouter,
  createAuthMiddleware,
  createRbacMiddleware,
  createAnalyticsMiddleware,
  createPageTitleMiddleware,
  createLoadingMiddleware
} from './router';
import type {
  Route,
  RouterConfig,
  RouteContext,
  RouteMeta,
  RouteParams,
  RouterState,
  MiddlewareFn,
  GuardFn,
  HookFn
} from './router';
export {
  discoverRoutes,
  createRouter,
  createAdvancedRouter,
  discoverAdvancedRoutes,
  AdvancedRouter,
  createAuthMiddleware,
  createRbacMiddleware,
  createAnalyticsMiddleware,
  createPageTitleMiddleware,
  createLoadingMiddleware
};
export type {
  Route,
  RouterConfig,
  RouteContext,
  RouteMeta,
  RouteParams,
  RouterState,
  MiddlewareFn,
  GuardFn,
  HookFn
};

// Builder exports
import { buildApp, runBuild } from './builder';
import type { BuildOptions } from './builder';
export { buildApp, runBuild };
export type { BuildOptions };

// Re-export compiler and runtime
export * from '@ack/compiler';
export * from '@ack/runtime';

// Vite plugin
export { default as ackVitePlugin } from '@ack/vite-plugin';
export type { AckPluginOptions } from '@ack/vite-plugin';

/**
 * Version
 */
export const VERSION = '0.0.1';

/**
 * Kit namespace
 */
export const ACKKit = {
  VERSION,
  startDevServer,
  closeDevServer,
  buildApp,
  createRouter,
  createAdvancedRouter,
  discoverRoutes,
  AdvancedRouter
};
