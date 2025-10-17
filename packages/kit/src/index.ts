/**
 * @ack/kit - Public API
 * Türkçe: @ack/kit'in tüm public API'sini export eder.
 */

// Dev Server exports
export { startDevServer, closeDevServer, runDevServer } from './devServer';
export type { DevServerOptions } from './devServer';

// Router exports
export {
  discoverRoutes,
  createRouter,
  generateRouterCode,
  createExampleRouterHtml
} from './router';
export type { Route, RouterConfig } from './router';

// Builder exports
export { buildApp, runBuild } from './builder';
export type { BuildOptions } from './builder';

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
