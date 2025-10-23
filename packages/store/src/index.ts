/**
 * @ack/store - State Management  
 */

import { createReactive, watch } from '@ack/runtime';

// Types
/**
 * A function that mutates the store's state.
 * @template S The type of the state.
 * @template P The type of the payload.
 * @param {S} state - The current state.
 * @param {P} payload - The payload for the mutation.
 */
export type MutationFn<S, P = void> = (state: S, payload: P) => void | Promise<void>;

/**
 * A function that can perform asynchronous operations and commit mutations.
 * @template S The type of the state.
 * @template P The type of the payload.
 * @template R The return type of the action.
 * @param {ActionContext<S>} context - The action context, providing access to the state, getters, and other actions.
 * @param {P} payload - The payload for the action.
 * @returns {R | Promise<R>} The result of the action.
 */
export type ActionFn<S, P = void, R = void> = (context: ActionContext<S>, payload: P) => R | Promise<R>;

/**
 * A function that computes a derived state from the store's state.
 * @template S The type of the state.
 * @template R The return type of the getter.
 * @param {S} state - The current state.
 * @returns {R} The computed value.
 */
export type GetterFn<S, R = any> = (state: S) => R;

/**
 * A function that is called whenever the store's state changes.
 * @template S The type of the state.
 * @param {S} state - The new state.
 * @param {S} oldState - The old state.
 */
export type Subscriber<S> = (state: S, oldState: S) => void;

/**
 * A function that is called whenever an action is dispatched.
 * @template S The type of the state.
 * @param {{ action: string; payload?: any; timestamp: number }} payload - Information about the dispatched action.
 */
export type ActionSubscriber<S> = (payload: { action: string; payload?: any; timestamp: number }) => void;

/**
 * The context provided to a mutation.
 * @template S The type of the state.
 * @interface MutationContext
 * @property {S} state - The current state.
 * @property {Record<string, MutationFn<S, any>>} mutations - A dictionary of all mutations.
 */
export interface MutationContext<S> {
  state: S;
  mutations: Record<string, MutationFn<S, any>>;
}

/**
 * The context provided to an action.
 * @template S The type of the state.
 * @interface ActionContext
 * @property {S} state - The current state.
 * @property {(name: string, payload?: any) => void | Promise<void>} commit - A function to commit a mutation.
 * @property {(name: string, payload?: any) => Promise<any>} dispatch - A function to dispatch an action.
 * @property {Record<string, any>} getters - A dictionary of all getters.
 */
export interface ActionContext<S> {
  state: S;
  commit(name: string, payload?: any): void | Promise<void>;
  dispatch(name: string, payload?: any): Promise<any>;
  getters: Record<string, any>;
}

/**
 * The base interface for a store's state.
 * @interface StoreState
 */
export interface StoreState {
  [key: string]: any;
}

/**
 * Configuration options for creating a new store.
 * @template S The type of the state.
 * @interface StoreOptions
 * @property {S} state - The initial state of the store.
 * @property {Record<string, MutationFn<S, any>>} [mutations] - A dictionary of mutations.
 * @property {Record<string, ActionFn<S, any, any>>} [actions] - A dictionary of actions.
 * @property {Record<string, GetterFn<S, any>>} [getters] - A dictionary of getters.
 * @property {StoragePlugin<S>[]} [plugins] - An array of storage plugins.
 * @property {boolean} [strict=true] - If true, warns when state is mutated outside of mutations.
 */
export interface StoreOptions<S extends StoreState = StoreState> {
  state: S;
  mutations?: Record<string, MutationFn<S, any>>;
  actions?: Record<string, ActionFn<S, any, any>>;
  getters?: Record<string, GetterFn<S, any>>;
  plugins?: StoragePlugin<S>[];
  strict?: boolean;
}

/**
 * A plugin for persisting and rehydrating the store's state.
 * @template S The type of the state.
 * @interface StoragePlugin
 * @property {(state: S, key: string) => void | Promise<void>} save - A function to save the state.
 * @property {(key: string) => S | null | Promise<S | null>} load - A function to load the state.
 */
export interface StoragePlugin<S> {
  save(state: S, key: string): void | Promise<void>;
  load(key: string): S | null | Promise<S | null>;
}

/**
 * An adapter for connecting the store to developer tools.
 * @interface DevToolsAdapter
 * @property {(action: string, state: any) => void} send - A function to send an action and state to the dev tools.
 * @property {(callback: (message: any) => void) => void} subscribe - A function to subscribe to messages from the dev tools.
 */
export interface DevToolsAdapter {
  send(action: string, state: any): void;
  subscribe(callback: (message: any) => void): void;
}

// Store
export class Store<S extends StoreState = StoreState> {
  private state: S;
  private reactiveState: S;
  private mutations: Record<string, MutationFn<S, any>>;
  private actions: Record<string, ActionFn<S, any, any>>;
  private getters: Record<string, GetterFn<S, any>>;
  private _getters: Record<string, any> = {};
  private subscribers: Subscriber<S>[] = [];
  private actionSubscribers: ActionSubscriber<S>[] = [];
  private plugins: StoragePlugin<S>[] = [];
  private strict: boolean;
  private devtools: DevToolsAdapter | null = null;
  private uncommittedState: S;

  constructor(options: StoreOptions<S>) {
    this.state = options.state;
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};
    this.getters = options.getters || {};
    this.plugins = options.plugins || [];
    this.strict = options.strict !== false;
    this.uncommittedState = { ...this.state };

    this.reactiveState = createReactive(this.state);
    this.initializeGetters();

    this.plugins.forEach((plugin) => {
      const loadPromise = plugin.load(this.constructor.name);
      if (loadPromise instanceof Promise) {
        loadPromise.then((loadedState: S | null) => {
          if (loadedState) {
            Object.assign(this.state, loadedState);
            Object.assign(this.reactiveState, loadedState);
          }
        });
      } else if (loadPromise) {
        Object.assign(this.state, loadPromise);
        Object.assign(this.reactiveState, loadPromise);
      }
    });

    this.setupWatchers();
  }

  private initializeGetters(): void {
    Object.keys(this.getters).forEach((key) => {
      const getter = this.getters[key];
      Object.defineProperty(this._getters, key, {
        get: () => getter(this.state),
        enumerable: true
      });
    });
  }

  private setupWatchers(): void {
    Object.keys(this.state).forEach((key) => {
      watch(this.reactiveState, key, () => {
        if (this.strict) {
          console.warn(`State mutation detected outside of mutations. Use commit() instead.`);
        }
      });
    });
  }

  async commit(name: string, payload?: any): Promise<void> {
    const mutation = this.mutations[name];
    if (!mutation) {
      console.warn(`Mutation not found: ${name}`);
      return;
    }

    const oldState = JSON.parse(JSON.stringify(this.state));
    await mutation(this.reactiveState, payload);
    this.uncommittedState = JSON.parse(JSON.stringify(this.state));

    if (this.devtools) {
      this.devtools.send(`commit: ${name}`, this.state);
    }

    this.subscribers.forEach((subscriber) => {
      subscriber(this.state, oldState);
    });

    this.plugins.forEach((plugin) => {
      plugin.save(this.state, this.constructor.name);
    });
  }

  async dispatch(name: string, payload?: any): Promise<any> {
    const action = this.actions[name];
    if (!action) {
      console.warn(`Action not found: ${name}`);
      return;
    }

    const timestamp = Date.now();

    this.actionSubscribers.forEach((subscriber) => {
      subscriber({ action: name, payload, timestamp });
    });

    const context: ActionContext<S> = {
      state: this.state,
      commit: (mutationName: string, mutationPayload?: any) =>
        this.commit(mutationName, mutationPayload),
      dispatch: (actionName: string, actionPayload?: any) =>
        this.dispatch(actionName, actionPayload),
      getters: this._getters
    };

    const result = await action(context, payload);

    if (this.devtools) {
      this.devtools.send(`dispatch: ${name}`, this.state);
    }

    return result;
  }

  subscribe(callback: Subscriber<S>): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  subscribeAction(callback: ActionSubscriber<S>): () => void {
    this.actionSubscribers.push(callback);
    return () => {
      this.actionSubscribers = this.actionSubscribers.filter((sub) => sub !== callback);
    };
  }

  attachDevTools(adapter: DevToolsAdapter): void {
    this.devtools = adapter;
    this.devtools.send('INIT', this.state);
  }

  getState(): S {
    return this.state;
  }

  getReactiveState(): S {
    return this.reactiveState;
  }

  getGetter(name: string): any {
    return this._getters[name];
  }

  reset(newState: S): void {
    Object.assign(this.state, newState);
    Object.assign(this.reactiveState, newState);
    this.uncommittedState = JSON.parse(JSON.stringify(this.state));
  }

  clear(): void {
    this.subscribers = [];
    this.actionSubscribers = [];
  }
}

// Helpers
export function createStore<S extends StoreState = StoreState>(
  options: StoreOptions<S>
): Store<S> {
  return new Store(options);
}

export function createLocalStoragePlugin<S extends StoreState = StoreState>(
  storageKey: string
): StoragePlugin<S> {
  return {
    save(state: S): void {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save state:', error);
      }
    },
    load(): S | null {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error('Failed to load state:', error);
        return null;
      }
    }
  };
}

export function createSessionStoragePlugin<S extends StoreState = StoreState>(
  storageKey: string
): StoragePlugin<S> {
  return {
    save(state: S): void {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(storageKey, JSON.stringify(state));
        }
      } catch (error) {
        console.error('Failed to save session state:', error);
      }
    },
    load(): S | null {
      try {
        if (typeof sessionStorage !== 'undefined') {
          const stored = sessionStorage.getItem(storageKey);
          return stored ? JSON.parse(stored) : null;
        }
      } catch (error) {
        console.error('Failed to load session state:', error);
      }
      return null;
    }
  };
}

export function createLoggerPlugin<S extends StoreState = StoreState>(): StoragePlugin<S> {
  return {
    save(state: S): void {
      console.log('[Store] State updated:', state);
    },
    load(): S | null {
      return null;
    }
  };
}

export function createCompositePlugin<S extends StoreState = StoreState>(
  plugins: StoragePlugin<S>[]
): StoragePlugin<S> {
  return {
    save(state: S, key: string): void {
      plugins.forEach((plugin) => plugin.save(state, key));
    },
    load(key: string): S | null {
      for (const plugin of plugins) {
        const result = plugin.load(key);
        if (result && !(result instanceof Promise)) {
          return result as S;
        }
      }
      return null;
    }
  };
}
