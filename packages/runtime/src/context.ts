/**
 * @ack/runtime - Context API System
 * Türkçe: Componentler arası data sharing için context sistemi
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents the internal value of a Context, including its subscribers.
 * @template T The type of the context value.
 * @property {T} value - The current value of the context.
 * @property {Set<(value: T) => void>} subscribers - A set of functions that subscribe to context changes.
 */
export interface ContextValue<T = any> {
  value: T;
  subscribers: Set<(value: T) => void>;
}

/**
 * Props for a ContextProvider component.
 * @template T The type of the context value.
 * @property {T} value - The value to be provided by this provider.
 * @property {any} children - The child components that will consume the context.
 */
export interface ContextProviderProps<T = any> {
  value: T;
  children: any;
}

/**
 * Configuration options for creating a new Context.
 * @template T The type of the context value.
 * @property {T} [defaultValue] - The default value for the context.
 * @property {string} [displayName] - A display name for debugging purposes.
 * @property {(prevValue: T, nextValue: T) => number} [calculateChangedBits] - A function to determine if a context update should notify consumers.
 */
export interface ContextConfig<T = any> {
  defaultValue?: T;
  displayName?: string;
  calculateChangedBits?: (prevValue: T, nextValue: T) => number;
}

// ============================================================================
// CONTEXT CLASS
// ============================================================================

export class Context<T = any> {
  private value: T;
  private subscribers: Set<(value: T) => void> = new Set();
  private providers: Set<ContextProvider<T>> = new Set();
  private config: ContextConfig<T>;

  constructor(defaultValue: T, config: ContextConfig<T> = {}) {
    this.value = defaultValue;
    this.config = config;
  }

  /**
   * Provider kaydet
   */
  registerProvider(provider: ContextProvider<T>): void {
    this.providers.add(provider);
  }

  /**
   * Provider'ı kaldır
   */
  unregisterProvider(provider: ContextProvider<T>): void {
    this.providers.delete(provider);
  }

  /**
   * Value'yu güncelle
   */
  updateValue(newValue: T, provider?: ContextProvider<T>): void {
    const prevValue = this.value;

    // Calculate changed bits if function provided
    if (this.config.calculateChangedBits) {
      const changedBits = this.config.calculateChangedBits(prevValue, newValue);
      if (changedBits === 0) {
        return; // No changes
      }
    }

    this.value = newValue;

    // Notify all subscribers
    this.subscribers.forEach(listener => {
      try {
        listener(newValue);
      } catch (error) {
        console.error('Context subscriber error:', error);
      }
    });

    // Notify all providers
    this.providers.forEach(p => {
      if (p !== provider) { // Don't notify the provider that made the change
        p.onValueChange?.(newValue, prevValue);
      }
    });
  }

  /**
   * Value'ya erişim
   */
  getValue(): T {
    return this.value;
  }

  /**
   * Subscriber ekleme
   */
  subscribe(listener: (value: T) => void): () => void {
    this.subscribers.add(listener);

    // Immediately call with current value
    listener(this.value);

    return () => {
      this.subscribers.delete(listener);
    };
  }

  /**
   * Display name
   */
  get displayName(): string {
    return this.config.displayName || 'Context';
  }

  /**
   * Provider count
   */
  get providerCount(): number {
    return this.providers.size;
  }

  /**
   * Subscriber count
   */
  get subscriberCount(): number {
    return this.subscribers.size;
  }
}

// ============================================================================
// CONTEXT PROVIDER CLASS
// ============================================================================

export class ContextProvider<T = any> {
  private context: Context<T>;
  private props: ContextProviderProps<T>;
  private unsubscribe?: () => void;

  constructor(context: Context<T>, props: ContextProviderProps<T>) {
    this.context = context;
    this.props = props;

    // Register with context
    context.registerProvider(this);

    // Subscribe to context changes
    this.unsubscribe = context.subscribe((value) => {
      this.onValueChange?.(value, this.props.value);
    });

    // Set initial value
    context.updateValue(props.value, this);
  }

  /**
   * Props güncellemesi
   */
  updateProps(newProps: ContextProviderProps<T>): void {
    const prevValue = this.props.value;
    this.props = newProps;

    if (prevValue !== newProps.value) {
      this.context.updateValue(newProps.value, this);
    }
  }

  /**
   * Value change callback
   */
  onValueChange?(newValue: T, prevValue: T): void;

  /**
   * Provider'ı temizle
   */
  destroy(): void {
    this.context.unregisterProvider(this);
    this.unsubscribe?.();
  }

  /**
   * Current props
   */
  getProps(): ContextProviderProps<T> {
    return { ...this.props };
  }

  /**
   * Current context value
   */
  getContextValue(): T {
    return this.context.getValue();
  }
}

// ============================================================================
// CONTEXT CONSUMER CLASS
// ============================================================================

export class ContextConsumer<T = any> {
  private context: Context<T>;
  private listener?: (value: T) => void;
  private currentValue: T;

  constructor(context: Context<T>, renderProp?: (value: T) => any) {
    this.context = context;
    this.currentValue = context.getValue();

    if (renderProp) {
      this.listener = (value) => {
        this.currentValue = value;
        renderProp(value);
      };
    }
  }

  /**
   * Subscribe to context changes
   */
  subscribe(renderProp: (value: T) => any): () => void {
    if (this.listener) {
      this.context.subscribe(this.listener);
    }

    // Immediately render with current value
    renderProp(this.currentValue);

    return () => {
      if (this.listener) {
        this.context.subscribe(this.listener);
      }
    };
  }

  /**
   * Current value
   */
  getCurrentValue(): T {
    return this.currentValue;
  }

  /**
   * Manual render
   */
  render(renderProp: (value: T) => any): any {
    return renderProp(this.currentValue);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Context oluştur
 */
export function createContext<T>(defaultValue: T, config?: ContextConfig<T>): Context<T> {
  return new Context(defaultValue, config);
}

/**
 * Context Provider oluştur
 */
export function createContextProvider<T>(
  context: Context<T>,
  props: ContextProviderProps<T>
): ContextProvider<T> {
  return new ContextProvider(context, props);
}

/**
 * Context Consumer oluştur
 */
export function createContextConsumer<T>(
  context: Context<T>,
  renderProp?: (value: T) => any
): ContextConsumer<T> {
  return new ContextConsumer(context, renderProp);
}

// ============================================================================
// REACT-STYLE HOOKS API
// ============================================================================

/**
 * useContext hook benzeri API
 */
export function useContext<T>(context: Context<T>): T {
  return context.getValue();
}

/**
 * useContextSelector hook benzeri API
 */
export function useContextSelector<T, R>(
  context: Context<T>,
  selector: (value: T) => R
): R {
  return selector(context.getValue());
}

/**
 * useContext with subscription
 */
export function useContextWithSubscription<T>(
  context: Context<T>,
  renderProp: (value: T) => any
): () => void {
  const consumer = new ContextConsumer(context, renderProp);
  return consumer.subscribe(renderProp);
}

// ============================================================================
// MULTI-CONTEXT SUPPORT
// ============================================================================

/**
 * Multiple context'ları birleştir
 */
export function combineContexts<T extends Record<string, Context<any>>>(
  contexts: T
): Context<T> {
  const defaultValue = Object.fromEntries(
    Object.entries(contexts).map(([key, context]) => [key, context.getValue()])
  ) as T;

  const combinedContext = new Context(defaultValue, {
    displayName: 'CombinedContext'
  });

  // Subscribe to all contexts
  Object.values(contexts).forEach(context => {
    context.subscribe((value) => {
      const currentValues = combinedContext.getValue();
      const updatedValues = { ...currentValues };

      // Update the specific context value
      for (const [key, ctx] of Object.entries(contexts)) {
        if (ctx === context) {
          (updatedValues as any)[key] = value;
          break;
        }
      }

      combinedContext.updateValue(updatedValues);
    });
  });

  return combinedContext;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Context tree debug utility
 */
export function debugContextTree(context: Context): void {
  console.group(`🔍 Context Debug: ${context.displayName}`);
  console.log('Current Value:', context.getValue());
  console.log('Provider Count:', context.providerCount);
  console.log('Subscriber Count:', context.subscriberCount);
  console.groupEnd();
}

/**
 * Context performance monitor
 */
export function createContextPerformanceMonitor<T>(
  context: Context<T>,
  name?: string
): Context<T> {
  const originalSubscribe = context.subscribe.bind(context);

  context.subscribe = (listener: (value: T) => void) => {
    const startTime = performance.now();
    const unsubscribe = originalSubscribe((value) => {
      const endTime = performance.now();
      console.log(`⚡ ${name || context.displayName} update took ${endTime - startTime}ms`);
      listener(value);
    });
    return unsubscribe;
  };

  return context;
}

/**
 * Context dev tools integration
 */
export function integrateWithDevTools<T>(
  context: Context<T>,
  devTools?: any
): void {
  if (devTools && typeof devTools.subscribe === 'function') {
    context.subscribe((value) => {
      devTools.send('CONTEXT_UPDATE', {
        name: context.displayName,
        value,
        timestamp: Date.now()
      });
    });
  }
}
