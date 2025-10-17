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
  generateRouterCode,
  createExampleRouterHtml
} from './router';
import type { Route, RouterConfig } from './router';
export {
  discoverRoutes,
  createRouter,
  generateRouterCode,
  createExampleRouterHtml
};
export type { Route, RouterConfig };

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
  discoverRoutes
};
