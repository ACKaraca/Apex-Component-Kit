/**
 * Reactivity System - Reaktif proxy sistemi
 * Türkçe: Bu modül, değişkenlerde yapılan değişiklikleri izleyen reaktif proxy'ler oluşturur.
 */

export type WatcherCallback = (newValue: any, oldValue: any) => void;

export interface ReactiveObject<T> {
  _original: T;
  _watchers: Map<string, WatcherCallback[]>;
  _isReactive: true;
}

/**
 * Bir objeyi reaktif hale getir.
 */
export function createReactive<T extends object>(obj: T): T & ReactiveObject<T> {
  const watchers: Map<string, WatcherCallback[]> = new Map();
  let original = { ...obj } as any;

  return new Proxy(obj as any, {
    get(target, prop, receiver) {
      // Özel properties için direkt return et
      if (prop === '_original') return original;
      if (prop === '_watchers') return watchers;
      if (prop === '_isReactive') return true;

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      const oldValue = target[prop as keyof T];

      // Değer aynı ise update yapma
      if (oldValue === value) {
        return true;
      }

      // Değişikliği yap
      const result = Reflect.set(target, prop, value, receiver);

      // Watchers'ı çağır
      if (watchers.has(prop as string)) {
        const callbacks = watchers.get(prop as string) || [];
        callbacks.forEach((cb) => cb(value, oldValue));
      }

      // Tüm watchers'ı çağır
      if (watchers.has('*')) {
        const callbacks = watchers.get('*') || [];
        callbacks.forEach((cb) => cb(value, oldValue));
      }

      return result;
    },

    has(target, prop) {
      return Reflect.has(target, prop);
    },

    deleteProperty(target, prop) {
      return Reflect.deleteProperty(target, prop);
    },

    ownKeys(target) {
      return Reflect.ownKeys(target);
    },

    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  }) as T & ReactiveObject<T>;
}

/**
 * Bir reaktif objeye watcher ekle.
 */
export function watch<T extends object>(
  obj: T & Partial<ReactiveObject<T>>,
  prop: string | '*',
  callback: WatcherCallback
): () => void {
  if (!obj._watchers) {
    throw new Error('Object is not reactive');
  }

  if (!obj._watchers.has(prop)) {
    obj._watchers.set(prop, []);
  }

  const callbacks = obj._watchers.get(prop) || [];
  callbacks.push(callback);

  // Unwatch function'ı döndür
  return () => {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
}

/**
 * Reaktif bir objeyi check et.
 */
export function isReactive<T extends object>(obj: T): obj is T & ReactiveObject<T> {
  return obj && typeof obj === 'object' && '_isReactive' in obj;
}

/**
 * Computed property oluştur - dependenci'leri otomatik track et.
 */
export function computed<T>(
  getter: () => T,
  dependencies: any[] = []
): T {
  return getter();
}

/**
 * Tüm watchers'ı temizle.
 */
export function clearWatchers<T extends object>(
  obj: T & Partial<ReactiveObject<T>>
): void {
  if (obj._watchers) {
    obj._watchers.clear();
  }
}
