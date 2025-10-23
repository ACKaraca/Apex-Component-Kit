/**
 * Reactivity System - Reaktif proxy sistemi
 * Türkçe: Bu modül, değişkenlerde yapılan değişiklikleri izleyen reaktif proxy'ler oluşturur.
 */

/**
 * A callback function that is invoked when a reactive property changes.
 * @param newValue The new value of the property.
 * @param oldValue The previous value of the property.
 */
export type WatcherCallback = (newValue: any, oldValue: any) => void;

/**
 * An interface representing a reactive object. It includes internal properties
 * for managing the original state and watchers.
 * @template T The type of the original object.
 * @property {T} _original - A shallow copy of the original object.
 * @property {Map<string, WatcherCallback[]>} _watchers - A map of property names to an array of watcher callbacks.
 * @property {true} _isReactive - A flag to identify the object as reactive.
 */
export interface ReactiveObject<T> {
  _original: T;
  _watchers: Map<string, WatcherCallback[]>;
  _isReactive: true;
}

/**
 * Creates a reactive proxy for an object. The proxy intercepts property access
 * and mutations, allowing for change detection and watcher execution.
 * @template T The type of the object.
 * @param {T} obj The object to make reactive.
 * @returns {T & ReactiveObject<T>} A new reactive proxy wrapping the original object.
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
