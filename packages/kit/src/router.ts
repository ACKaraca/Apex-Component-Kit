/**
 * Router - File-based routing sistemi
 * Türkçe: Bu modül, src/pages dizininden otomatik olarak route'lar üretir.
 */

import fs from 'fs';
import path from 'path';

export interface Route {
  path: string;
  component: string;
  name?: string;
}

export interface RouterConfig {
  routes: Route[];
  basePath?: string;
}

/**
 * src/pages dizininden route'ları keşfet
 */
export function discoverRoutes(pagesDir: string, basePath: string = ''): Route[] {
  const routes: Route[] = [];

  if (!fs.existsSync(pagesDir)) {
    return routes;
  }

  const entries = fs.readdirSync(pagesDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(pagesDir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      // Recursive olarak alt dizinleri keşfet
      const nestedRoutes = discoverRoutes(fullPath, relativePath);
      routes.push(...nestedRoutes);

      // index.ack dosyasını kontrol et (optional nested route)
      const indexFile = path.join(fullPath, 'index.ack');
      if (fs.existsSync(indexFile)) {
        const routePath = convertPathToRoute(relativePath);
        routes.push({
          path: routePath,
          component: indexFile,
          name: generateRouteName(relativePath)
        });
      }
    } else if (entry.name.endsWith('.ack')) {
      // .ack dosyalarını route'a dönüştür
      let routePath = convertPathToRoute(relativePath);

      // index.ack → / (ya da /nested)
      if (entry.name === 'index.ack') {
        routePath = basePath ? `/${convertPathToRoute(basePath)}` : '/';
      }

      routes.push({
        path: routePath,
        component: fullPath,
        name: generateRouteName(relativePath.replace('.ack', ''))
      });
    }
  }

  return routes;
}

/**
 * Dosya yolunu route path'ine dönüştür
 */
function convertPathToRoute(filePath: string): string {
  // Normalize path separators
  let route = filePath.replace(/\\/g, '/');

  // index.ack → /
  route = route.replace(/\/index(?:\.ack)?$/, '');

  // .ack extension kaldır
  route = route.replace(/\.ack$/, '');

  // [param] → :param (dynamic segments)
  route = route.replace(/\[([^\]]+)\]/g, ':$1');

  // Başına / ekle
  if (!route.startsWith('/')) {
    route = '/' + route;
  }

  // Sondaki / kaldır (root route hariç)
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
 * Router konfigürasyonunu oluştur
 */
export function createRouter(srcDir: string = './src'): RouterConfig {
  const pagesDir = path.join(srcDir, 'pages');
  const routes = discoverRoutes(pagesDir);

  // Root route varsa, başa taşı
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
 * Router konfigürasyonını JavaScript kodu olarak oluştur
 */
export function generateRouterCode(config: RouterConfig): string {
  const routesArray = config.routes
    .map((route) => {
      return `{
    path: '${route.path}',
    name: '${route.name || route.path}',
    component: () => import('${route.component}')
  }`;
    })
    .join(',\n    ');

  return `
// Generated router configuration
export const routes = [
    ${routesArray}
];

export const router = {
  routes,
  basePath: '${config.basePath}',
  
  matchRoute(pathname) {
    for (const route of this.routes) {
      const pattern = new RegExp('^' + route.path.replace(/:[^/]+/g, '[^/]+') + '$');
      if (pattern.test(pathname)) {
        return route;
      }
    }
    return null;
  },
  
  async navigate(pathname) {
    const route = this.matchRoute(pathname);
    if (route) {
      const component = await route.component();
      return component.default;
    }
    throw new Error(\`Route not found: \${pathname}\`);
  }
};
`;
}

/**
 * Example router usage
 */
export function createExampleRouterHtml(config: RouterConfig): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACK Router Example</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { router } from './router.js';
    
    const appElement = document.getElementById('app');
    
    async function navigate(pathname) {
      try {
        const component = await router.navigate(pathname);
        // Component'i mount et
        if (component && component.mount) {
          component.mount(appElement);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        appElement.innerHTML = '<p>Route not found</p>';
      }
    }
    
    // Initial route
    navigate(window.location.pathname);
    
    // History API
    window.addEventListener('popstate', () => {
      navigate(window.location.pathname);
    });
  </script>
</body>
</html>
`;
}
