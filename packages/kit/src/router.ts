/**
 * Advanced Router - İleri routing sistemi middleware ve guards ile
 * Türkçe: Middleware pipeline, route guards, hooks, nested layouts ve meta bilgileri destekleyen router
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// TİPLERİ TANIMLA
// ============================================================================

/**
 * Metadata associated with a route, for handling things like page titles,
 * authentication, and layouts.
 * @interface RouteMeta
 * @property {string} [title] - The title of the page.
 * @property {string} [description] - A description for the page.
 * @property {boolean} [requiresAuth=false] - If true, the user must be authenticated to access this route.
 * @property {string[]} [roles] - An array of roles required to access this route.
 * @property {string} [layout] - The name of the layout component to use for this route.
 * @property {boolean} [preload=false] - If true, the route's component will be preloaded.
 */
export interface RouteMeta {
  title?: string;
  description?: string;
  requiresAuth?: boolean;
  roles?: string[];
  layout?: string;
  preload?: boolean;
  [key: string]: any;
}

/**
 * Parameters extracted from a dynamic URL path.
 * @interface RouteParams
 * @property {string | string[]} [key: string] - The value of a URL parameter.
 */
export interface RouteParams {
  [key: string]: string | string[];
}

/**
 * The context of the current route, providing information about the path,
 * parameters, and matched routes.
 * @interface RouteContext
 * @property {string} path - The current URL path.
 * @property {string} name - The name of the route.
 * @property {string} component - The path to the component file for the route.
 * @property {RouteParams} params - The URL parameters.
 * @property {Record<string, string>} query - The query string parameters.
 * @property {RouteMeta} [meta] - The metadata for the route.
 * @property {Route[]} matched - An array of all matched routes (including parent routes).
 * @property {Route} [parent] - The parent route, if it exists.
 */
export interface RouteContext {
  path: string;
  name: string;
  component: string;
  params: RouteParams;
  query: Record<string, string>;
  meta?: RouteMeta;
  matched: Route[];
  parent?: Route;
}

/**
 * A function that is executed as part of a middleware pipeline.
 * @param {RouteContext} ctx - The current route context.
 * @param {() => Promise<void>} next - A function to call to pass control to the next middleware.
 */
export type MiddlewareFn = (ctx: RouteContext, next: () => Promise<void>) => Promise<void>;

/**
 * A function that can prevent navigation to or from a route.
 * @param {RouteContext} ctx - The current route context.
 * @returns {boolean | Promise<boolean>} If false, the navigation is cancelled.
 */
export type GuardFn = (ctx: RouteContext) => boolean | Promise<boolean>;

/**
 * A function that is executed at a specific point in the navigation lifecycle.
 * @param {RouteContext} ctx - The current route context.
 */
export type HookFn = (ctx: RouteContext) => void | Promise<void>;

/**
 * Defines a route and its properties.
 * @interface Route
 * @property {string} path - The URL path for the route.
 * @property {string} component - The path to the component file.
 * @property {string} [name] - A unique name for the route.
 * @property {RouteMeta} [meta] - Metadata for the route.
 * @property {Route[]} [children] - An array of nested routes.
 * @property {string} [layout] - The layout component for this route.
 * @property {GuardFn[]} [beforeEnter] - Guards to run before entering the route.
 * @property {GuardFn[]} [beforeLeave] - Guards to run before leaving the route.
 */
export interface Route {
  path: string;
  component: string;
  name?: string;
  meta?: RouteMeta;
  children?: Route[];
  layout?: string;
  beforeEnter?: GuardFn[];
  beforeLeave?: GuardFn[];
}

/**
 * Configuration for the router.
 * @interface RouterConfig
 * @property {Route[]} routes - An array of route definitions.
 * @property {string} [basePath='/'] - The base path for all routes.
 * @property {string} [layout] - A default layout component for all routes.
 * @property {MiddlewareFn[]} [middlewares] - An array of middleware functions to run on every navigation.
 * @property {HookFn[]} [beforeEach] - Hooks to run before each navigation.
 * @property {HookFn[]} [afterEach] - Hooks to run after each navigation.
 */
export interface RouterConfig {
  routes: Route[];
  basePath?: string;
  layout?: string;
  middlewares?: MiddlewareFn[];
  beforeEach?: HookFn[];
  afterEach?: HookFn[];
}

/**
 * The current state of the router.
 * @interface RouterState
 * @property {RouteContext | null} current - The current route context.
 * @property {RouteContext | null} previous - The previous route context.
 * @property {boolean} isNavigating - A flag indicating if a navigation is in progress.
 * @property {RouteContext[]} history - An array of previously visited route contexts.
 */
export interface RouterState {
  current: RouteContext | null;
  previous: RouteContext | null;
  isNavigating: boolean;
  history: RouteContext[];
}

// ============================================================================
// TEMEL ROUTER SINIFI
// ============================================================================

/**
 * Advanced Router Sınıfı
 */
export class AdvancedRouter {
  private routes: Route[] = [];
  private middlewares: MiddlewareFn[] = [];
  private beforeEachHooks: HookFn[] = [];
  private afterEachHooks: HookFn[] = [];
  private basePath: string = '/';
  private state: RouterState = {
    current: null,
    previous: null,
    isNavigating: false,
    history: []
  };

  constructor(config: RouterConfig) {
    this.routes = config.routes;
    this.middlewares = config.middlewares || [];
    this.beforeEachHooks = config.beforeEach || [];
    this.afterEachHooks = config.afterEach || [];
    this.basePath = config.basePath || '/';
  }

  /**
   * Middleware ekle
   */
  use(middleware: MiddlewareFn): void {
    this.middlewares.push(middleware);
  }

  /**
   * Navigation öncesi hook ekle
   */
  beforeEach(hook: HookFn): void {
    this.beforeEachHooks.push(hook);
  }

  /**
   * Navigation sonrası hook ekle
   */
  afterEach(hook: HookFn): void {
    this.afterEachHooks.push(hook);
  }

  /**
   * Route'u pathname'e göre eşleştir
   */
  private matchRoute(pathname: string, routes: Route[] = this.routes, parent?: Route): { route: Route; matched: Route[] } | null {
    for (const route of routes) {
      const pattern = this.pathToRegex(route.path);
      const match = pathname.match(pattern);

      if (match) {
        const matched = parent ? [parent, route] : [route];
        return { route, matched };
      }

      // Nested routes kontrol et
      if (route.children && route.children.length > 0) {
        const nestedMatch = this.matchRoute(pathname, route.children, route);
        if (nestedMatch) {
          return nestedMatch;
        }
      }
    }

    return null;
  }

  /**
   * Path pattern'ini Regex'e dönüştür
   */
  private pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:\w+/g, '([^\\/]+)')
      .replace(/\.\.\./g, '.*');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * URL parametrelerini çıkart
   */
  private extractParams(pathname: string, routePath: string): RouteParams {
    const pattern = routePath.split('/');
    const segments = pathname.split('/');
    const params: RouteParams = {};

    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i].startsWith(':')) {
        const paramName = pattern[i].slice(1);
        params[paramName] = segments[i];
      }
    }

    return params;
  }

  /**
   * Query string'i parse et
   */
  private parseQuery(search: string): Record<string, string> {
    const query: Record<string, string> = {};
    if (!search) return query;

    try {
      const params = new URLSearchParams(search);
      params.forEach((value, key) => {
        query[key] = value;
      });
    } catch (error) {
      // URL parsing hatası - boş query döndür
    }

    return query;
  }

  /**
   * Route guards'ı çalıştır
   */
  private async executeGuards(route: Route, direction: 'enter' | 'leave', ctx: RouteContext): Promise<boolean> {
    const guards = direction === 'enter' ? route.beforeEnter : route.beforeLeave;

    if (!guards || guards.length === 0) return true;

    for (const guard of guards) {
      const result = await guard(ctx);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Middleware pipeline'ı çalıştır
   */
  private async executeMiddlewares(ctx: RouteContext): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        await this.middlewares[index++](ctx, next);
      }
    };

    await next();
  }

  /**
   * Route'a navigate et
   */
  async navigate(pathname: string, options?: { replace?: boolean }): Promise<boolean> {
    if (this.state.isNavigating) return false;

    this.state.isNavigating = true;

    try {
      // Route'u bul
      const match = this.matchRoute(pathname);
      if (!match) {
        console.error(`Route not found: ${pathname}`);
        return false;
      }

      const { route, matched } = match;
      const params = this.extractParams(pathname, route.path);
      
      // Query string'i al - window ortamında yoksa boş string
      let search = '';
      try {
        search = typeof window !== 'undefined' ? window.location.search : '';
      } catch {
        search = '';
      }
      const query = this.parseQuery(search);

      // Route context'i oluştur
      const ctx: RouteContext = {
        path: pathname,
        name: route.name || route.path,
        component: route.component,
        params,
        query,
        meta: route.meta,
        matched,
        parent: matched.length > 1 ? matched[matched.length - 2] : undefined
      };

      // beforeEach hooks'ları çalıştır
      for (const hook of this.beforeEachHooks) {
        await hook(ctx);
      }

      // Mevcut route'dan ayrıl (guards kontrol et)
      if (this.state.current) {
        const canLeave = await this.executeGuards(this.state.current.matched[0], 'leave', ctx);
        if (!canLeave) {
          return false;
        }
      }

      // Yeni route'a gir (guards kontrol et)
      const canEnter = await this.executeGuards(route, 'enter', ctx);
      if (!canEnter) {
        return false;
      }

      // Middleware'ları çalıştır
      await this.executeMiddlewares(ctx);

      // State'i güncelle
      this.state.previous = this.state.current;
      this.state.current = ctx;
      this.state.history.push(ctx);

      // afterEach hooks'ları çalıştır
      for (const hook of this.afterEachHooks) {
        await hook(ctx);
      }

      // History API güncelle
      if (!options?.replace) {
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState(ctx, '', pathname);
        }
      } else {
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(ctx, '', pathname);
        }
      }

      return true;
    } finally {
      this.state.isNavigating = false;
    }
  }

  /**
   * Geri git
   */
  back(): void {
    if (typeof window !== 'undefined' && window.history) {
      window.history.back();
    }
  }

  /**
   * İleri git
   */
  forward(): void {
    if (typeof window !== 'undefined' && window.history) {
      window.history.forward();
    }
  }

  /**
   * Router state'ini al
   */
  getState(): RouterState {
    return { ...this.state };
  }

  /**
   * Mevcut route context'ini al
   */
  getCurrentRoute(): RouteContext | null {
    return this.state.current;
  }

  /**
   * Tüm route'ları al (nested de dahil)
   */
  getAllRoutes(): Route[] {
    const collect = (routes: Route[]): Route[] => {
      return routes.flatMap((route) => [route, ...(route.children ? collect(route.children) : [])]);
    };

    return collect(this.routes);
  }
}

// ============================================================================
// DİSKOVERY VE AYAR FONKSİYONLARI
// ============================================================================

/**
 * src/pages dizininden route'ları keşfet (Advanced yapı için)
 */
export function discoverAdvancedRoutes(pagesDir: string, basePath: string = ''): Route[] {
  const routes: Route[] = [];

  if (!fs.existsSync(pagesDir)) {
    return routes;
  }

  const entries = fs.readdirSync(pagesDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(pagesDir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      // Nested routes keşfet
      const indexFile = path.join(fullPath, 'index.ack');
      const childrenDir = fullPath;

      if (fs.existsSync(indexFile)) {
        const routePath = convertPathToRoute(relativePath);
        const children = discoverAdvancedRoutes(childrenDir, relativePath);

        routes.push({
          path: routePath || '/',
          component: indexFile,
          name: generateRouteName(relativePath),
          children: children.length > 0 ? children : undefined
        });
      } else {
        // Children yok, doğrudan keşfet
        const nestedRoutes = discoverAdvancedRoutes(childrenDir, relativePath);
        routes.push(...nestedRoutes);
      }
    } else if (entry.name.endsWith('.ack')) {
      if (entry.name !== 'index.ack') {
        let routePath = convertPathToRoute(relativePath);

        routes.push({
          path: routePath,
          component: fullPath,
          name: generateRouteName(relativePath.replace('.ack', ''))
        });
      }
    }
  }

  return routes;
}

/**
 * Dosya yolunu route path'ine dönüştür
 */
function convertPathToRoute(filePath: string): string {
  let route = filePath.replace(/\\/g, '/');
  route = route.replace(/\/index(?:\.ack)?$/, '');
  route = route.replace(/\.ack$/, '');
  route = route.replace(/\[([^\]]+)\]/g, ':$1');

  if (!route.startsWith('/')) {
    route = '/' + route;
  }

  if (route !== '/' && route.endsWith('/')) {
    route = route.slice(0, -1);
  }

  return route;
}

/**
 * Route name oluştur
 */
function generateRouteName(filePath: string): string {
  return filePath
    .replace(/[\\/]/g, '-')
    .replace(/\.ack$/, '')
    .replace(/index$/, '')
    .replace(/^\-/, '')
    .replace(/\-$/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Advanced Router'ı oluştur
 */
export function createAdvancedRouter(srcDir: string = './src', config?: Partial<RouterConfig>): AdvancedRouter {
  const pagesDir = path.join(srcDir, 'pages');
  const routes = discoverAdvancedRoutes(pagesDir);

  // Root route varsa, başa taşı
  const rootRoute = routes.find((r) => r.path === '/');
  if (rootRoute) {
    routes.splice(routes.indexOf(rootRoute), 1);
    routes.unshift(rootRoute);
  }

  return new AdvancedRouter({
    routes,
    basePath: config?.basePath || '/',
    middlewares: config?.middlewares,
    beforeEach: config?.beforeEach,
    afterEach: config?.afterEach
  });
}

// ============================================================================
// HAZIR MIDDLEWARE'LAR
// ============================================================================

/**
 * Authentication middleware - Auth kontrolü
 */
export function createAuthMiddleware(isAuthenticated: () => boolean): MiddlewareFn {
  return async (ctx: RouteContext, next: () => Promise<void>) => {
    if (ctx.meta?.requiresAuth && !isAuthenticated()) {
      console.warn(`Unauthenticated access denied to ${ctx.path}`);
      return;
    }

    await next();
  };
}

/**
 * Role-based access control middleware
 */
export function createRbacMiddleware(getUserRoles: () => string[]): MiddlewareFn {
  return async (ctx: RouteContext, next: () => Promise<void>) => {
    if (ctx.meta?.roles && ctx.meta.roles.length > 0) {
      const userRoles = getUserRoles();
      const hasAccess = ctx.meta.roles.some((role) => userRoles.includes(role));

      if (!hasAccess) {
        console.warn(`Access denied to ${ctx.path} - insufficient permissions`);
        return;
      }
    }

    await next();
  };
}

/**
 * Analytics middleware - Page view tracking
 */
export function createAnalyticsMiddleware(trackPageView: (path: string, title: string) => void): MiddlewareFn {
  return async (ctx: RouteContext, next: () => Promise<void>) => {
    trackPageView(ctx.path, ctx.name);
    await next();
  };
}

/**
 * Page title middleware - Document title'ı güncelle
 */
export function createPageTitleMiddleware(): MiddlewareFn {
  return async (ctx: RouteContext, next: () => Promise<void>) => {
    if (ctx.meta?.title) {
      document.title = ctx.meta.title;
    }

    await next();
  };
}

/**
 * Loading middleware - Loading durumu yönet
 */
export function createLoadingMiddleware(
  onStart: () => void,
  onEnd: () => void
): MiddlewareFn {
  return async (ctx: RouteContext, next: () => Promise<void>) => {
    onStart();

    try {
      await next();
    } finally {
      onEnd();
    }
  };
}

// ============================================================================
// ESKI FONKSİYONLAR (GERİ UYUMLULUK)
// ============================================================================

/**
 * Eski createRouter fonksiyonu - Geri uyumluluk
 */
export function createRouter(srcDir: string = './src'): RouterConfig {
  const pagesDir = path.join(srcDir, 'pages');
  const routes = discoverAdvancedRoutes(pagesDir);

  const rootRoute = routes.find((r) => r.path === '/');
  if (rootRoute) {
    routes.splice(routes.indexOf(rootRoute), 1);
    routes.unshift(rootRoute);
  }

  return {
    routes,
    basePath: '/'
  };
}

/**
 * Eski discoverRoutes fonksiyonu - Geri uyumluluk
 */
export function discoverRoutes(pagesDir: string, basePath: string = ''): Route[] {
  return discoverAdvancedRoutes(pagesDir, basePath);
}
