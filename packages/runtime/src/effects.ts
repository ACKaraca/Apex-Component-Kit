/**
 * Effects System - Effect yönetimi
 * Türkçe: Bu modül, computed properties ve side effects'leri yönetir.
 */

export type EffectCleanup = (() => void) | void;
export type EffectCallback = () => EffectCleanup;

export interface EffectOptions {
  immediate?: boolean;
  flush?: 'pre' | 'post' | 'sync';
}

/**
 * Effect oluştur - side effect'leri yönet.
 */
export function createEffect(
  callback: EffectCallback,
  options: EffectOptions = {}
): () => void {
  let cleanup: EffectCleanup = null;
  let isRunning = false;

  const run = () => {
    if (isRunning) return;

    isRunning = true;

    // Önceki cleanup'ı çağır
    if (typeof cleanup === 'function') {
      cleanup();
    }

    // Effect'i çalıştır
    try {
      cleanup = callback();
    } catch (error) {
      console.error('Effect error:', error);
    }

    isRunning = false;
  };

  // Immediate çalıştır
  if (options.immediate !== false) {
    run();
  }

  // Uneffect function'ı döndür
  return () => {
    if (typeof cleanup === 'function') {
      cleanup();
    }
    cleanup = null;
  };
}

/**
 * Computed property oluştur.
 */
export class Computed<T> {
  private getter: () => T;
  private value: T;
  private dirty: boolean = true;
  private watchers: Set<() => void> = new Set();

  constructor(getter: () => T) {
    this.getter = getter;
    this.value = getter();
  }

  /**
   * Değeri al.
   */
  public get(): T {
    if (this.dirty) {
      this.value = this.getter();
      this.dirty = false;
      this.notifyWatchers();
    }
    return this.value;
  }

  /**
   * Dirty mark et.
   */
  public markDirty(): void {
    if (!this.dirty) {
      this.dirty = true;
      this.notifyWatchers();
    }
  }

  /**
   * Watcher ekle.
   */
  public watch(callback: () => void): () => void {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  /**
   * Watchers'ı notify et.
   */
  private notifyWatchers(): void {
    this.watchers.forEach((watcher) => watcher());
  }
}

/**
 * Computed getter oluştur.
 */
export function computed<T>(getter: () => T): () => T {
  const computed = new Computed(getter);
  return () => computed.get();
}

/**
 * Memo'ized fonksiyon oluştur.
 */
export function memo<T>(
  getter: () => T,
  compareFn?: (a: T, b: T) => boolean
): () => T {
  let memoized: T | undefined;
  let firstRun = true;

  return () => {
    const current = getter();

    if (firstRun) {
      memoized = current;
      firstRun = false;
      return current;
    }

    if (compareFn) {
      if (!compareFn(memoized as T, current)) {
        memoized = current;
      }
    } else {
      if (memoized !== current) {
        memoized = current;
      }
    }

    return memoized as T;
  };
}

/**
 * Effect manager.
 */
export class EffectManager {
  private effects: Map<string, () => void> = new Map();

  /**
   * Effect ekle.
   */
  public add(id: string, callback: EffectCallback, options?: EffectOptions): void {
    const uneffect = createEffect(callback, options);
    this.effects.set(id, uneffect);
  }

  /**
   * Effect kaldır.
   */
  public remove(id: string): void {
    const uneffect = this.effects.get(id);
    if (uneffect) {
      uneffect();
      this.effects.delete(id);
    }
  }

  /**
   * Tüm effects'leri kaldır.
   */
  public clear(): void {
    this.effects.forEach((uneffect) => uneffect());
    this.effects.clear();
  }
}

/**
 * Batch updates'i yönet - birden fazla state update'ini tek bir rerender ile yapla.
 */
export function batch(callback: () => void): void {
  // Normalde, bu framework'te automatic batching olurdu
  callback();
}

/**
 * Scheduled effect - nextTick'e kadar defer et.
 */
export async function scheduledEffect(
  callback: EffectCallback,
  options: EffectOptions = {}
): Promise<() => void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const uneffect = createEffect(callback, options);
      resolve(uneffect);
    }, 0);
  });
}
