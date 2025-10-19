/**
 * @ack/runtime - Suspense & Loading States System
 * Türkçe: Async operations için loading states ve suspense
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SuspenseConfig {
  fallback?: any;
  timeout?: number;
  onTimeout?: () => void;
  retry?: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  error?: Error;
  data?: any;
}

export interface SuspenseBoundaryState {
  isPending: boolean;
  isFulfilled: boolean;
  isRejected: boolean;
  data?: any;
  error?: Error;
}

// ============================================================================
// SUSPENSE MANAGER
// ============================================================================

export class SuspenseManager {
  private pendingPromises: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private config: Required<SuspenseConfig>;

  constructor(config: SuspenseConfig = {}) {
    this.config = {
      fallback: null,
      timeout: 30000,
      onTimeout: () => {},
      retry: () => {},
      ...config
    };
  }

  /**
   * Async resource'u suspense ile wrap et
   */
  async suspense<T>(
    key: string,
    asyncFn: () => Promise<T>,
    options: Partial<SuspenseConfig> = {}
  ): Promise<T> {
    const config = { ...this.config, ...options };

    // Cache kontrolü
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 5000) { // 5 saniye cache
      return cached.data;
    }

    // Pending kontrolü
    if (this.pendingPromises.has(key)) {
      return this.pendingPromises.get(key)!;
    }

    // Yeni promise oluştur
    const promise = this.createSuspensePromise(key, asyncFn, config);

    try {
      const result = await promise;
      this.cache.set(key, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      throw error;
    } finally {
      this.pendingPromises.delete(key);
    }
  }

  /**
   * Suspense promise oluştur
   */
  private async createSuspensePromise<T>(
    key: string,
    asyncFn: () => Promise<T>,
    config: Required<SuspenseConfig>
  ): Promise<T> {
    const promise = asyncFn();

    // Timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Suspense timeout after ${config.timeout}ms`));
        config.onTimeout();
      }, config.timeout);
    });

    // Race between actual promise and timeout
    const result = await Promise.race([promise, timeoutPromise]);

    return result;
  }

  /**
   * Loading state için wrapper
   */
  createLoadingWrapper<T>(
    asyncFn: () => Promise<T>,
    options: any = {}
  ): () => Promise<T> {
    return async () => {
      const loadingState: LoadingState = {
        isLoading: true,
        progress: 0
      };

      options.onLoading?.(loadingState);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          loadingState.progress = Math.min((loadingState.progress || 0) + 10, 90);
          options.onLoading?.(loadingState);
        }, 100);

        const result = await asyncFn();

        clearInterval(progressInterval);

        loadingState.isLoading = false;
        loadingState.progress = 100;
        loadingState.data = result;

        options.onSuccess?.(result);
        options.onLoading?.(loadingState);

        return result;
      } catch (error) {
        loadingState.isLoading = false;
        loadingState.error = error as Error;

        options.onError?.(error as Error);
        options.onLoading?.(loadingState);

        throw error;
      }
    };
  }

  /**
   * Cache'i temizle
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Pending promise'ları temizle
   */
  clearPending(key?: string): void {
    if (key) {
      this.pendingPromises.delete(key);
    } else {
      this.pendingPromises.clear();
    }
  }
}

// ============================================================================
// SUSPENSE BOUNDARY
// ============================================================================

export class SuspenseBoundary {
  private manager: SuspenseManager;
  private state: SuspenseBoundaryState = {
    isPending: false,
    isFulfilled: false,
    isRejected: false
  };

  constructor(config: SuspenseConfig = {}) {
    this.manager = new SuspenseManager(config);
  }

  /**
   * Suspense içinde çalıştır
   */
  async execute<T>(
    key: string,
    asyncFn: () => Promise<T>,
    options: Partial<SuspenseConfig> = {}
  ): Promise<T> {
    this.state = {
      isPending: true,
      isFulfilled: false,
      isRejected: false
    };

    try {
      const result = await this.manager.suspense(key, asyncFn, options);

      this.state = {
        isPending: false,
        isFulfilled: true,
        isRejected: false,
        data: result
      };

      return result;
    } catch (error) {
      this.state = {
        isPending: false,
        isFulfilled: false,
        isRejected: true,
        error: error as Error
      };

      throw error;
    }
  }

  /**
   * Loading wrapper oluştur
   */
  createLoadingWrapper<T>(
    asyncFn: () => Promise<T>,
    options?: any
  ) {
    return this.manager.createLoadingWrapper(asyncFn, options);
  }

  /**
   * State kontrolü
   */
  isPending(): boolean {
    return this.state.isPending;
  }

  isFulfilled(): boolean {
    return this.state.isFulfilled;
  }

  isRejected(): boolean {
    return this.state.isRejected;
  }

  getData(): any {
    return this.state.data;
  }

  getError(): Error | undefined {
    return this.state.error;
  }

  getState(): SuspenseBoundaryState {
    return { ...this.state };
  }
}

// ============================================================================
// LOADING INDICATORS
// ============================================================================

/**
 * Varsayılan loading indicator
 */
export function createDefaultLoadingIndicator(message: string = 'Yükleniyor...'): any {
  return {
    element: (() => {
      const div = document.createElement('div');
      div.className = 'ack-loading-indicator';
      div.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #666;
        ">
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          "></div>
          <p style="margin: 0; font-size: 14px;">${message}</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      return div;
    })()
  };
}

/**
 * Skeleton loading indicator
 */
export function createSkeletonLoadingIndicator(rows: number = 3): any {
  return {
    element: (() => {
      const div = document.createElement('div');
      div.className = 'ack-skeleton-loading';
      div.innerHTML = `
        <div style="
          padding: 20px;
        ">
          ${Array.from({ length: rows }, (_, i) => `
            <div style="
              height: 20px;
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
              margin-bottom: 12px;
              border-radius: 4px;
            "></div>
          `).join('')}
        </div>
        <style>
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        </style>
      `;
      return div;
    })()
  };
}

/**
 * Progress bar loading indicator
 */
export function createProgressLoadingIndicator(
  progress: number = 0,
  message: string = 'Yükleniyor...'
): any {
  return {
    element: (() => {
      const div = document.createElement('div');
      div.className = 'ack-progress-loading';
      div.innerHTML = `
        <div style="
          padding: 20px;
          text-align: center;
        ">
          <div style="
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 12px;
          ">
            <div style="
              height: 100%;
              background: #3498db;
              width: ${progress}%;
              transition: width 0.3s ease;
            "></div>
          </div>
          <p style="
            margin: 0;
            font-size: 14px;
            color: #666;
          ">${message} (${Math.round(progress)}%)</p>
        </div>
      `;
      return div;
    })()
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Suspense Manager oluştur
 */
export function createSuspenseManager(config?: SuspenseConfig): SuspenseManager {
  return new SuspenseManager(config);
}

/**
 * Suspense Boundary oluştur
 */
export function createSuspenseBoundary(config?: SuspenseConfig): SuspenseBoundary {
  return new SuspenseBoundary(config);
}

/**
 * Loading wrapper oluştur
 */
export function createLoadingWrapper<T>(
  asyncFn: () => Promise<T>,
  options?: {
    onLoading?: (state: LoadingState) => void;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    initialData?: T;
  }
): () => Promise<T> {
  const manager = new SuspenseManager();
  return manager.createLoadingWrapper(asyncFn, options);
}

// ============================================================================
// HOOKS-STYLE API
// ============================================================================

/**
 * useSuspense hook benzeri API
 */
export function useSuspense<T>(
  key: string,
  asyncFn: () => Promise<T>,
  config?: SuspenseConfig
): T {
  const boundary = createSuspenseBoundary(config);

  // Sync olarak çalışır, promise throw eder
  const promise = boundary.execute(key, asyncFn);

  if (boundary.isPending()) {
    // Suspense fallback gösterilmeli
    throw promise;
  }

  if (boundary.isRejected()) {
    throw boundary.getError();
  }

  return boundary.getData();
}

/**
 * useLoadingState hook benzeri API
 */
export function useLoadingState<T>(
  asyncFn: () => Promise<T>,
  options?: {
    onLoading?: (state: LoadingState) => void;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    initialData?: T;
  }
): {
  execute: () => Promise<T>;
  state: LoadingState;
} {
  const manager = new SuspenseManager();
  const state = { value: { isLoading: false, progress: 0 } as LoadingState };

  const wrappedFn = manager.createLoadingWrapper(asyncFn, {
    ...options,
    onLoading: (loadingState: LoadingState) => {
      state.value = loadingState;
      options?.onLoading?.(loadingState);
    }
  });

  return {
    execute: wrappedFn,
    state: state.value
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Reactive state için basit helper
 */
function createReactiveState<T>(initialValue: T) {
  let value = initialValue;
  const listeners = new Set<(newValue: T) => void>();

  return {
    get value() { return value; },
    set value(newValue: T) {
      value = newValue;
      listeners.forEach(listener => listener(value));
    },
    subscribe(listener: (value: T) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

/**
 * Async operation'ı delay ile çalıştır
 */
export async function withDelay<T>(
  promise: Promise<T>,
  delay: number = 100
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      resolve(await promise);
    }, delay);
  });
}

/**
 * Retry logic ile async operation
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
