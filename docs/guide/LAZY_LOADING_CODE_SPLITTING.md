# Lazy Loading & Code Splitting - Komplet Guide

**ACK Framework'te performans optimizasyonu: Dynamic imports, route-based splitting, intelligent prefetching**

## Başlangıç

### Neden Lazy Loading?

```
Initial Bundle: 500KB → Split to 3 chunks
✅ Home route: 150KB (loaded immediately)
✅ About route: 120KB (lazy loaded)
✅ Dashboard route: 230KB (lazy loaded)

First Load: 500KB → 150KB (-70% faster!)
```

## 1. LazyLoader - Temel Lazy Loading

### Basit Kullanım

```typescript
import { createLazyLoader } from '@ack/loader';

const loader = createLazyLoader();

// Lazy load a module
const result = await loader.load('heavy-module', async () => {
  return import('./heavy-module');
});

console.log(result.data);     // { export1, export2, ... }
console.log(result.loadTime); // 45ms
console.log(result.cached);   // false (first load)
```

### Concurrent Load Control

```typescript
// Limit to 3 concurrent loads
const loader = createLazyLoader({
  maxConcurrentLoads: 3
});

// Load 10 modules - only 3 at a time
const promises = Array.from({ length: 10 }, (_, i) =>
  loader.load(`module-${i}`, () => import(`./modules/${i}`))
);

await Promise.all(promises);
```

### Preloading

```typescript
// Preload in background
await loader.preload('next-page', () => import('./NextPage'));

// Later when user navigates...
const page = await loader.load('next-page', () => import('./NextPage'));
// ✨ Returns immediately from cache!
```

### Memory Management

```typescript
const loader = createLazyLoader();

await loader.load('module-1', () => import('./m1'));
await loader.load('module-2', () => import('./m2'));

// Unload when not needed
loader.unload('module-1');

// Clear all
loader.unloadAll();

// Check what's loaded
const chunks = loader.getAllChunks();
```

## 2. ChunkManager - Route-Based Splitting

### Define Chunks per Route

```typescript
import { createChunkManager } from '@ack/loader';

const manager = createChunkManager();

// Register chunks
manager.registerChunk('header', () => import('./Header'));
manager.registerChunk('sidebar', () => import('./Sidebar'));
manager.registerChunk('content', () => import('./Content'));
manager.registerChunk('footer', () => import('./Footer'));

// Define which chunks go with which route
manager.defineChunks('/dashboard', ['header', 'sidebar', 'content', 'footer']);
manager.defineChunks('/admin', ['header', 'sidebar']);
manager.defineChunks('/login', ['content', 'footer']);

// Load entire route
const components = await manager.loadRoute('/dashboard');
// components = { header, sidebar, content, footer }
```

### Chunk Statistics

```typescript
const stats = manager.getStats();

console.log(stats.chunks);     // 4
console.log(stats.routes);     // 3
console.log(stats.totalSize);  // 245000 bytes
console.log(stats.chunkList);  // [...]

// Reuse chunks across routes
manager.defineChunks('/home', ['header', 'footer']);
// 'header' not reloaded - cached!
```

### Dynamic Chunk Loading

```typescript
// Load single chunk
const header = await manager.loadChunk('header');

// Preload for next route
await manager.preloadChunk('sidebar');

// Preload entire route
await manager.preloadRoute('/admin');

// Clear unused
manager.clearChunks();
```

## 3. RouteChunkLoader - SPA Optimization

### Route Definition

```typescript
import { createRouteChunkLoader } from '@ack/loader';

const router = createRouteChunkLoader();

// Define route components
router.defineRoute('/home', () => import('./pages/Home'));
router.defineRoute('/about', () => import('./pages/About'));
router.defineRoute('/services', () => import('./pages/Services'));
router.defineRoute('/contact', () => import('./pages/Contact'));
```

### Navigation

```typescript
// User navigates to /about
const AboutComponent = await router.navigateTo('/about');
// ✨ Loaded on-demand if not cached
```

### Link Hover Preloading

```typescript
// On link hover
async function onLinkHover(url: string) {
  await router.preloadRoute(url);
}

// <a href="/about" onmouseover="onLinkHover('/about')">About</a>
// ✨ Preloaded silently in background
```

### Batch Preloading

```typescript
// Preload several routes
await router.preloadRoutes([
  '/about',
  '/services',
  '/contact'
]);

// Now navigation is instant!
```

## 4. Prefetcher - Smart Preloading Strategies

### Aggressive Strategy

```typescript
import { createPrefetcher } from '@ack/loader';

const prefetcher = createPrefetcher('aggressive');

// Load everything immediately
prefetcher.schedule('module-1', () => import('./m1'), { priority: 'high' });
prefetcher.schedule('module-2', () => import('./m2'), { priority: 'high' });
prefetcher.schedule('module-3', () => import('./m3'), { priority: 'high' });

// ✨ All loaded ASAP - good for fast networks
```

### Conservative Strategy

```typescript
const prefetcher = createPrefetcher('conservative');

// High priority loads fast, others delayed
prefetcher.schedule('critical', () => import('./critical'), { priority: 'high' });
prefetcher.schedule('optional', () => import('./optional'), { priority: 'low' });

// critical: loads immediately
// optional: loads after 1 second
```

### Idle Strategy

```typescript
const prefetcher = createPrefetcher('idle');

// Load when browser is idle
prefetcher.schedule('analytics', () => import('./Analytics'));
prefetcher.schedule('tracking', () => import('./Tracking'));

// Uses RequestIdleCallback (with setTimeout fallback)
// ✨ Doesn't interfere with user interaction
```

### Network-Aware Preloading

```typescript
const prefetcher = createPrefetcher('conservative');

// Adapt to network speed
prefetcher.prefetchBasedOnNetwork();

// 4G: Aggressive loading
// 3G: Conservative loading
// 2G/slow: Idle strategy
```

## 5. Real-World Patterns

### E-Commerce Product Page

```typescript
import { createRouteChunkLoader } from '@ack/loader';

const router = createRouteChunkLoader();

// Define product page chunks
router.defineRoute('/product/:id', async () => {
  const [Product, Reviews, Related, Checkout] = await Promise.all([
    import('./Product'),
    import('./Reviews'),
    import('./Related'),
    import('./Checkout')
  ]);
  return { Product, Reviews, Related, Checkout };
});

// On product hover/link
async function onProductHover() {
  await router.preloadRoute('/product/:id');
}

// On navigation
async function showProduct(id: string) {
  const components = await router.navigateTo(`/product/${id}`);
  render(components.Product);
}
```

### Admin Dashboard

```typescript
import { createChunkManager } from '@ack/loader';

const manager = createChunkManager();

// Register reusable chunks
const chunks = ['header', 'sidebar', 'footer'];
chunks.forEach(chunk => {
  manager.registerChunk(chunk, () => import(`./layout/${chunk}`));
});

// Register page chunks
manager.registerChunk('users', () => import('./pages/Users'));
manager.registerChunk('settings', () => import('./pages/Settings'));
manager.registerChunk('analytics', () => import('./pages/Analytics'));

// Routes use shared layout + unique content
manager.defineChunks('/admin/users', [...chunks, 'users']);
manager.defineChunks('/admin/settings', [...chunks, 'settings']);
manager.defineChunks('/admin/analytics', [...chunks, 'analytics']);

// Preload all pages when admin enters
await manager.preloadRoute('/admin/users');
await manager.preloadRoute('/admin/settings');
```

### Blog with Comments (Progressive Enhancement)

```typescript
import { createPrefetcher } from '@ack/loader';

const prefetcher = createPrefetcher('conservative');

// Critical: blog post content
prefetcher.schedule('post', () => import('./Post'), { priority: 'high' });

// Important: comments section
prefetcher.schedule('comments', () => import('./Comments'), { priority: 'high' });

// Optional: related posts, social share
prefetcher.schedule('related', () => import('./RelatedPosts'), { priority: 'low' });
prefetcher.schedule('share', () => import('./ShareButtons'), { priority: 'low' });

// Analytics only when idle
prefetcher.schedule('analytics', () => import('./Analytics'), { priority: 'low' });
```

## 6. Best Practices

### ✅ DO

```typescript
// 1. Split by route/page
router.defineRoute('/heavy-page', () => import('./HeavyPage'));

// 2. Preload on interaction
async function onLinkEnter(url: string) {
  await router.preloadRoute(url);
}

// 3. Use appropriate strategy
const prefetcher = createPrefetcher('conservative');

// 4. Measure performance
const result = await loader.load('module', () => import('./m'));
console.log(`Loaded in ${result.loadTime}ms`);

// 5. Handle errors
try {
  await router.navigateTo('/page');
} catch (error) {
  showErrorPage();
}
```

### ❌ DON'T

```typescript
// ❌ Don't lazy load everything
const loader = createLazyLoader();
await loader.load('ui', () => import('./UI')); // Too granular

// ❌ Don't preload everything aggressively
const aggressive = createPrefetcher('aggressive');
for (const route of allRoutes) {
  aggressive.schedule(route, () => import(route)); // Wastes bandwidth
}

// ❌ Don't forget error handling
const component = await router.navigateTo('/page'); // What if fails?

// ❌ Don't create loaders for each module
const loader1 = createLazyLoader();
const loader2 = createLazyLoader(); // Share one loader!
```

## 7. Performance Tips

### 1. Chunk Size

```typescript
// ✅ Good: 50-200KB chunks
// ❌ Bad: 500KB+ monolithic bundles
// ❌ Bad: 10KB+ micro-chunks (overhead)

// Aim for 50-200KB per chunk
```

### 2. Preload Timing

```typescript
// ✅ Link hover
onmouseover={() => router.preloadRoute(url)}

// ✅ Route transition
beforeRouteChange(() => router.preloadRoute(nextRoute))

// ✅ User idle
prefetcher.schedule(module, loader, { priority: 'low' })

// ❌ Too early: Page load time increased
// ❌ Too late: User waits for content
```

### 3. Cache Strategy

```typescript
// ✅ Cache GET requests
const result = await loader.load('module', loader, { cache: true });

// ✅ Invalidate when needed
loader.unload('outdated-module');

// ✅ Monitor cache size
const stats = manager.getStats();
if (stats.totalSize > 5MB) {
  manager.clearChunks();
}
```

## 8. Integration with Routing

```typescript
import { AdvancedRouter } from '@ack/kit';
import { createRouteChunkLoader } from '@ack/loader';

const advancedRouter = new AdvancedRouter({});
const chunkLoader = createRouteChunkLoader();

// Load component on route match
advancedRouter.beforeEach(async (to, from) => {
  const component = await chunkLoader.navigateTo(to.path);
  to.component = component;
});

// Preload next route on route change
advancedRouter.afterEach(async (to) => {
  // Preload likely next routes
  const nextRoutes = getNextLikelyRoutes(to.path);
  await chunkLoader.preloadRoutes(nextRoutes);
});
```

## 9. Debugging & Monitoring

```typescript
import { createChunkManager } from '@ack/loader';

const manager = createChunkManager();

// Monitor chunk loading
const stats = manager.getStats();

console.table({
  'Loaded Chunks': stats.chunks,
  'Total Routes': stats.routes,
  'Total Size': `${(stats.totalSize / 1024).toFixed(2)}KB`,
  'Chunks List': stats.chunkList
});

// Log load times
const result = await loader.load('module', () => import('./m'));
console.log(`Loaded ${result.loadTime}ms, Cached: ${result.cached}`);
```

## İstatistikler

```
Kod Satırları:      450+
Test Satırları:     550+
Test Case'leri:     33+
Stratejiler:        3 (aggressive, conservative, idle)
Desteği:            100+ browsers
```

---

**Version**: 0.6.0  
**Last Updated**: 2025-10-18
