/**
 * @ack/loader - Lazy Loading & Code Splitting
 * Türkçe: Dinamik imports, chunk yönetimi, prefetching
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChunkMetadata {
  id: string;
  name: string;
  size: number;
  loaded: boolean;
  loadTime: number;
  dependencies: string[];
}

export interface LoaderConfig {
  maxConcurrentLoads?: number;
  preloadCritical?: boolean;
  prefetchNonCritical?: boolean;
  chunkTimeout?: number;
}

export interface PrefetchOptions {
  strategy?: 'aggressive' | 'conservative' | 'idle';
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
}

export interface LazyLoadResult<T> {
  data: T;
  loadTime: number;
  cached: boolean;
}

// ============================================================================
// LAZY LOADER
// ============================================================================

/**
 * Lazy Loading - Dinamik modülleri yükle
 */
class LazyLoader {
  private loadedModules: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private chunks: Map<string, ChunkMetadata> = new Map();
  private maxConcurrentLoads: number;
  private activeLoads: number = 0;

  constructor(config: LoaderConfig = {}) {
    this.maxConcurrentLoads = config.maxConcurrentLoads || 3;
  }

  /**
   * Modülü lazy load et
   */
  async load<T = any>(
    id: string,
    loader: () => Promise<T>,
    options = { cache: true }
  ): Promise<LazyLoadResult<T>> {
    // Cache kontrol
    if (options.cache && this.loadedModules.has(id)) {
      const cached = this.loadedModules.get(id);
      return {
        data: cached.data,
        loadTime: 0,
        cached: true
      };
    }

    // Mevcut loading promise kontrol
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    // Yeni loading promise oluştur
    const loadPromise = this.executeLoad<T>(id, loader);
    this.loadingPromises.set(id, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(id);
    }
  }

  /**
   * Modülü yükle ve cache et
   */
  private async executeLoad<T = any>(
    id: string,
    loader: () => Promise<T>
  ): Promise<LazyLoadResult<T>> {
    // Concurrent load kontrol
    while (this.activeLoads >= this.maxConcurrentLoads) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.activeLoads++;
    const startTime = performance.now();

    try {
      const data = await loader();
      const loadTime = performance.now() - startTime;

      // Cache et
      this.loadedModules.set(id, { data, loadTime });

      // Metadata ekle
      this.chunks.set(id, {
        id,
        name: id,
        size: JSON.stringify(data).length,
        loaded: true,
        loadTime,
        dependencies: []
      });

      return {
        data,
        loadTime,
        cached: false
      };
    } finally {
      this.activeLoads--;
    }
  }

  /**
   * Modülü preload et (background'da)
   */
  async preload<T = any>(
    id: string,
    loader: () => Promise<T>
  ): Promise<void> {
    if (this.loadedModules.has(id)) return;

    try {
      await this.load(id, loader);
    } catch (error) {
      console.warn(`Failed to preload ${id}:`, error);
    }
  }

  /**
   * Module'ü unload et
   */
  unload(id: string): void {
    this.loadedModules.delete(id);
    this.chunks.delete(id);
  }

  /**
   * Tüm module'leri unload et
   */
  unloadAll(): void {
    this.loadedModules.clear();
    this.chunks.clear();
  }

  /**
   * Chunk metadata'sı al
   */
  getChunkInfo(id: string): ChunkMetadata | undefined {
    return this.chunks.get(id);
  }

  /**
   * Tüm chunk'ları göster
   */
  getAllChunks(): ChunkMetadata[] {
    return Array.from(this.chunks.values());
  }
}

// ============================================================================
// CHUNK MANAGER
// ============================================================================

/**
 * Chunk Management - Chunk'ları parçala ve yönet
 */
class ChunkManager {
  private loader = new LazyLoader();
  private routes: Map<string, string[]> = new Map(); // route -> chunks
  private chunks: Map<string, () => Promise<any>> = new Map();

  /**
   * Route için chunk'ları tanımla
   */
  defineChunks(route: string, chunks: string[]): void {
    this.routes.set(route, chunks);
  }

  /**
   * Chunk loader'ı kayıt et
   */
  registerChunk(id: string, loader: () => Promise<any>): void {
    this.chunks.set(id, loader);
  }

  /**
   * Route'u yükle - bağlı chunk'larını da yükle
   */
  async loadRoute(route: string): Promise<Record<string, any>> {
    const chunkIds = this.routes.get(route) || [];
    const results: Record<string, any> = {};

    // Paralel yükle
    const promises = chunkIds.map(async (chunkId) => {
      const loader = this.chunks.get(chunkId);
      if (loader) {
        const result = await this.loader.load(chunkId, loader);
        results[chunkId] = result.data;
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Chunk'ı yükle
   */
  async loadChunk(id: string): Promise<any> {
    const loader = this.chunks.get(id);
    if (!loader) throw new Error(`Chunk not found: ${id}`);

    const result = await this.loader.load(id, loader);
    return result.data;
  }

  /**
   * Chunk'ı preload et
   */
  async preloadChunk(id: string): Promise<void> {
    const loader = this.chunks.get(id);
    if (!loader) return;

    await this.loader.preload(id, loader);
  }

  /**
   * Route'u preload et
   */
  async preloadRoute(route: string): Promise<void> {
    const chunkIds = this.routes.get(route) || [];

    for (const chunkId of chunkIds) {
      await this.preloadChunk(chunkId);
    }
  }

  /**
   * Chunk'ları temizle
   */
  clearChunks(): void {
    this.loader.unloadAll();
  }

  /**
   * Chunk istatistikleri
   */
  getStats(): {
    chunks: number;
    routes: number;
    totalSize: number;
    chunkList: any[];
  } {
    const chunkList = this.loader.getAllChunks();
    const totalSize = chunkList.reduce((sum, c) => sum + c.size, 0);

    return {
      chunks: chunkList.length,
      routes: this.routes.size,
      totalSize,
      chunkList
    };
  }
}

// ============================================================================
// PREFETCHER
// ============================================================================

/**
 * Prefetcher - Anticipatory loading stratejileri
 */
class Prefetcher {
  private loader = new LazyLoader();
  private strategy: 'aggressive' | 'conservative' | 'idle' = 'conservative';
  private prefetchQueue: Array<{
    id: string;
    loader: () => Promise<any>;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  constructor(strategy: 'aggressive' | 'conservative' | 'idle' = 'conservative') {
    this.strategy = strategy;
  }

  /**
   * Prefetch talebini ekle
   */
  schedule(
    id: string,
    loader: () => Promise<any>,
    options: PrefetchOptions = {}
  ): void {
    const priority = options.priority || 'medium';

    this.prefetchQueue.push({ id, loader, priority });
    this.executeStrategy();
  }

  /**
   * Strategy'yi uygula
   */
  private executeStrategy(): void {
    if (this.strategy === 'aggressive') {
      this.prefetchAggressive();
    } else if (this.strategy === 'idle') {
      this.prefetchOnIdle();
    } else {
      this.prefetchConservative();
    }
  }

  /**
   * Aggressive - hemen yükle
   */
  private prefetchAggressive(): void {
    const sorted = this.prefetchQueue.sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    sorted.forEach(({ id, loader }) => {
      this.loader.preload(id, loader).catch(() => {});
    });

    this.prefetchQueue = [];
  }

  /**
   * Conservative - gecikmiş yükle
   */
  private prefetchConservative(): void {
    const highPriority = this.prefetchQueue.filter((p) => p.priority === 'high');
    const rest = this.prefetchQueue.filter((p) => p.priority !== 'high');

    // High priority hemen
    highPriority.forEach(({ id, loader }) => {
      this.loader.preload(id, loader).catch(() => {});
    });

    // Diğerlerini gecikmiş yükle
    if (rest.length > 0) {
      setTimeout(() => {
        rest.forEach(({ id, loader }) => {
          this.loader.preload(id, loader).catch(() => {});
        });
      }, 1000);
    }

    this.prefetchQueue = [];
  }

  /**
   * Idle - RequestIdleCallback kullan
   */
  private prefetchOnIdle(): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        this.prefetchQueue.forEach(({ id, loader }) => {
          this.loader.preload(id, loader).catch(() => {});
        });
      });
    } else {
      // Fallback
      setTimeout(() => {
        this.prefetchQueue.forEach(({ id, loader }) => {
          this.loader.preload(id, loader).catch(() => {});
        });
      }, 2000);
    }

    this.prefetchQueue = [];
  }

  /**
   * Network durumuna göre prefetch
   */
  prefetchBasedOnNetwork(): void {
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      const connection = (navigator as any).connection;

      if (connection.effectiveType === '4g') {
        // Fast network - aggressive
        this.strategy = 'aggressive';
      } else if (connection.effectiveType === '3g') {
        // Medium network - conservative
        this.strategy = 'conservative';
      } else {
        // Slow network - idle
        this.strategy = 'idle';
      }

      this.executeStrategy();
    }
  }
}

// ============================================================================
// ROUTE-BASED SPLITTING
// ============================================================================

/**
 * Route-based code splitting
 */
class RouteChunkLoader {
  private chunkManager = new ChunkManager();
  private prefetcher = new Prefetcher('conservative');
  private routeChunks: Map<string, string> = new Map();

  /**
   * Route chunk tanımla
   */
  defineRoute(path: string, componentLoader: () => Promise<any>): void {
    const chunkId = `route:${path}`;
    this.routeChunks.set(path, chunkId);
    this.chunkManager.registerChunk(chunkId, componentLoader);
  }

  /**
   * Route'a gitme - ilgili chunk'ı yükle
   */
  async navigateTo(path: string): Promise<any> {
    const chunkId = this.routeChunks.get(path);
    if (!chunkId) throw new Error(`Route not found: ${path}`);

    return this.chunkManager.loadChunk(chunkId);
  }

  /**
   * Route'u preload et (link hover, vb)
   */
  async preloadRoute(path: string): Promise<void> {
    const chunkId = this.routeChunks.get(path);
    if (!chunkId) return;

    this.prefetcher.schedule(chunkId, async () => {
      return this.chunkManager.loadChunk(chunkId);
    });
  }

  /**
   * Birden fazla route'u preload et
   */
  async preloadRoutes(paths: string[]): Promise<void> {
    for (const path of paths) {
      await this.preloadRoute(path);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * LazyLoader oluştur
 */
function createLazyLoader(config?: LoaderConfig): LazyLoader {
  return new LazyLoader(config);
}

/**
 * ChunkManager oluştur
 */
function createChunkManager(): ChunkManager {
  return new ChunkManager();
}

/**
 * Prefetcher oluştur
 */
function createPrefetcher(
  strategy: 'aggressive' | 'conservative' | 'idle' = 'conservative'
): Prefetcher {
  return new Prefetcher(strategy);
}

/**
 * RouteChunkLoader oluştur
 */
function createRouteChunkLoader(): RouteChunkLoader {
  return new RouteChunkLoader();
}

// ============================================================================
// DYNAMIC IMPORT HELPERS
// ============================================================================

/**
 * Component'i lazy load et
 */
async function lazyLoadComponent<T = any>(
  loader: () => Promise<{ default: T }>
): Promise<T> {
  const module = await loader();
  return module.default;
}

/**
 * Module'ü lazy load et
 */
async function lazyLoadModule<T = any>(
  loader: () => Promise<T>
): Promise<T> {
  return loader();
}

/**
 * Chunk'ları map et (Webpack uyumlular)
 */
function defineChunks<T extends Record<string, () => Promise<any>>>(
  chunks: T
): T {
  return chunks;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  LazyLoader,
  ChunkManager,
  Prefetcher,
  RouteChunkLoader,
  createLazyLoader,
  createChunkManager,
  createPrefetcher,
  createRouteChunkLoader,
  lazyLoadComponent,
  lazyLoadModule,
  defineChunks
};
