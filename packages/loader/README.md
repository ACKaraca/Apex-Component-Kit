# @ack/loader - Lazy Loading & Code Splitting

**Dynamic module loading, code splitting, intelligent prefetching**

## Features

✅ **Lazy Loading** - On-demand module loading  
✅ **Code Splitting** - Automatic chunk management  
✅ **Concurrent Control** - Max concurrent loads  
✅ **Prefetching** - 3 intelligent strategies  
✅ **Route-Based Splitting** - Automatic route chunking  
✅ **Type Safe** - Full TypeScript support  

## Installation

```bash
pnpm add @ack/loader
```

## Quick Start

### Lazy Load Module

```typescript
import { createLazyLoader } from '@ack/loader';

const loader = createLazyLoader();

// Load module on-demand
const result = await loader.load('my-module', async () => {
  return import('./heavy-module');
});

console.log(result.data);      // Module data
console.log(result.loadTime);  // Load time in ms
console.log(result.cached);    // Was it cached?
```

### Route-Based Splitting

```typescript
import { createRouteChunkLoader } from '@ack/loader';

const router = createRouteChunkLoader();

// Define routes
router.defineRoute('/home', () => import('./pages/Home'));
router.defineRoute('/about', () => import('./pages/About'));

// Navigate (loads on-demand)
const component = await router.navigateTo('/home');

// Preload for performance
await router.preloadRoute('/about');
```

### Chunk Manager

```typescript
import { createChunkManager } from '@ack/loader';

const manager = createChunkManager();

// Register chunks
manager.registerChunk('header', () => import('./components/Header'));
manager.registerChunk('sidebar', () => import('./components/Sidebar'));

// Define route chunks
manager.defineChunks('/dashboard', ['header', 'sidebar']);

// Load route - loads all chunks
const chunks = await manager.loadRoute('/dashboard');
```

### Prefetching Strategies

```typescript
import { createPrefetcher } from '@ack/loader';

// Aggressive - load immediately
const aggressive = createPrefetcher('aggressive');
aggressive.schedule('module-1', () => import('./module1'), { priority: 'high' });

// Conservative - load high priority fast, others delayed
const conservative = createPrefetcher('conservative');
conservative.schedule('module-2', () => import('./module2'), { priority: 'low' });

// Idle - load when browser is idle
const idle = createPrefetcher('idle');
idle.schedule('module-3', () => import('./module3'));
```

## API Reference

### LazyLoader

```typescript
// Load with cache
await loader.load('id', async () => module);

// Preload (background)
await loader.preload('id', async () => module);

// Unload
loader.unload('id');
loader.unloadAll();

// Metadata
loader.getChunkInfo('id');
loader.getAllChunks();
```

### ChunkManager

```typescript
manager.registerChunk(id, loader);
manager.defineChunks(route, chunkIds);

await manager.loadChunk('id');
await manager.loadRoute('/path');
await manager.preloadChunk('id');
await manager.preloadRoute('/path');

manager.getStats(); // Size, count, etc
manager.clearChunks();
```

### Prefetcher

```typescript
prefetcher.schedule('id', loader, { priority: 'high' });
prefetcher.prefetchBasedOnNetwork();
```

### RouteChunkLoader

```typescript
routeLoader.defineRoute('/path', componentLoader);
await routeLoader.navigateTo('/path');
await routeLoader.preloadRoute('/path');
await routeLoader.preloadRoutes(['/path1', '/path2']);
```

## Statistics

```
Code Lines:     450+
Test Lines:     550+
Test Cases:     33 (100% pass)
Type Definitions: 8+
Strategies:     3 (aggressive, conservative, idle)
```

---

**Version**: 0.6.0  
**License**: MIT
