/**
 * Store Tests
 * Türkçe: State management, mutations, actions, getters testleri
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Store,
  createStore,
  createLocalStoragePlugin,
  createLoggerPlugin,
  type StoreOptions
} from '../src/index';

describe('Store - State Management', () => {
  interface CounterState {
    count: number;
    todos: Array<{ id: number; title: string; done: boolean }>;
  }

  let store: Store<CounterState>;

  beforeEach(() => {
    const options: StoreOptions<CounterState> = {
      state: {
        count: 0,
        todos: []
      },
      mutations: {
        INCREMENT(state, amount = 1) {
          state.count += amount;
        },
        DECREMENT(state, amount = 1) {
          state.count -= amount;
        },
        RESET(state) {
          state.count = 0;
        },
        ADD_TODO(state, todo) {
          state.todos.push({
            id: Date.now(),
            title: todo,
            done: false
          });
        },
        TOGGLE_TODO(state, id) {
          const todo = state.todos.find((t) => t.id === id);
          if (todo) {
            todo.done = !todo.done;
          }
        },
        REMOVE_TODO(state, id) {
          state.todos = state.todos.filter((t) => t.id !== id);
        }
      },
      actions: {
        async incrementAsync(context, amount) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          context.commit('INCREMENT', amount);
          return { success: true };
        },
        async fetchTodos(context) {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 20));
          context.commit('ADD_TODO', 'Todo 1');
          context.commit('ADD_TODO', 'Todo 2');
        }
      },
      getters: {
        doubleCount(state) {
          return state.count * 2;
        },
        todoCount(state) {
          return state.todos.length;
        },
        completedTodos(state) {
          return state.todos.filter((t) => t.done).length;
        }
      }
    };

    store = createStore(options);
  });

  // ====================================================================
  // TEMEL STORE TESTLERI
  // ====================================================================

  describe('Temel Fonksiyonlar', () => {
    it('Store oluşturulabilmeli', () => {
      expect(store).toBeInstanceOf(Store);
    });

    it('İlk state döndürülmeli', () => {
      const state = store.getState();
      expect(state.count).toBe(0);
      expect(state.todos).toHaveLength(0);
    });

    it('Reactive state döndürülmeli', () => {
      const reactive = store.getReactiveState();
      expect(reactive.count).toBe(0);
    });
  });

  // ====================================================================
  // MUTATION TESTLERI
  // ====================================================================

  describe('Mutations', () => {
    it('Basit mutation çalışabilmeli', async () => {
      await store.commit('INCREMENT');
      expect(store.getState().count).toBe(1);
    });

    it('Payload ile mutation çalışabilmeli', async () => {
      await store.commit('INCREMENT', 5);
      expect(store.getState().count).toBe(5);
    });

    it('Birden fazla mutation sırasında çalışabilmeli', async () => {
      await store.commit('INCREMENT', 3);
      await store.commit('INCREMENT', 2);
      expect(store.getState().count).toBe(5);
    });

    it('DECREMENT mutation çalışabilmeli', async () => {
      await store.commit('INCREMENT', 10);
      await store.commit('DECREMENT', 3);
      expect(store.getState().count).toBe(7);
    });

    it('RESET mutation çalışabilmeli', async () => {
      await store.commit('INCREMENT', 10);
      await store.commit('RESET');
      expect(store.getState().count).toBe(0);
    });

    it('Array mutation çalışabilmeli', async () => {
      await store.commit('ADD_TODO', 'Test todo');
      expect(store.getState().todos).toHaveLength(1);
      expect(store.getState().todos[0].title).toBe('Test todo');
    });

    it('Var olmayan mutation warning vermelii', async () => {
      const warn = vi.spyOn(console, 'warn');
      await store.commit('NON_EXISTENT');
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  // ====================================================================
  // ACTION TESTLERI
  // ====================================================================

  describe('Actions', () => {
    it('Basit action çalışabilmeli', async () => {
      await store.dispatch('incrementAsync', 5);
      expect(store.getState().count).toBe(5);
    });

    it('Action dönüş değeri alınabilmeli', async () => {
      const result = await store.dispatch('incrementAsync', 3);
      expect(result).toEqual({ success: true });
    });

    it('Async action çalışabilmeli', async () => {
      const start = Date.now();
      await store.dispatch('fetchTodos');
      const duration = Date.now() - start;

      expect(store.getState().todos).toHaveLength(2);
      expect(duration).toBeGreaterThanOrEqual(20);
    });

    it('Action context.commit kullanabilmeli', async () => {
      await store.dispatch('incrementAsync', 10);
      expect(store.getState().count).toBe(10);
    });

    it('Var olmayan action warning vermelii', async () => {
      const warn = vi.spyOn(console, 'warn');
      await store.dispatch('NON_EXISTENT');
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  // ====================================================================
  // GETTER TESTLERI
  // ====================================================================

  describe('Getters (Computed)', () => {
    it('Basit getter döndürülebilmeli', () => {
      const doubled = store.getGetter('doubleCount');
      expect(doubled).toBe(0);
    });

    it('Getter state değişiminden sonra güncellenmeli', async () => {
      await store.commit('INCREMENT', 5);
      const doubled = store.getGetter('doubleCount');
      expect(doubled).toBe(10);
    });

    it('Getter array hesaplaması yapabilmeli', async () => {
      await store.commit('ADD_TODO', 'Todo 1');
      await store.commit('ADD_TODO', 'Todo 2');
      const count = store.getGetter('todoCount');
      expect(count).toBe(2);
    });

    it('Getter complex logic yapabilmeli', async () => {
      await store.commit('ADD_TODO', 'Todo 1');
      await store.commit('ADD_TODO', 'Todo 2');
      const todoId = store.getState().todos[0].id;

      await store.commit('TOGGLE_TODO', todoId);
      const completed = store.getGetter('completedTodos');
      expect(completed).toBe(1);
    });
  });

  // ====================================================================
  // SUBSCRIBER TESTLERI
  // ====================================================================

  describe('Subscribers', () => {
    it('State değişiminde subscriber çağrılmalı', async () => {
      const callback = vi.fn();
      store.subscribe(callback);

      await store.commit('INCREMENT', 5);

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ count: 5 }),
        expect.objectContaining({ count: 0 })
      );
    });

    it('Birden fazla subscriber eklenebilmeli', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      store.subscribe(callback1);
      store.subscribe(callback2);

      await store.commit('INCREMENT');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('Subscriber unsubscribe fonksiyonu döndürmeli', async () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);

      await store.commit('INCREMENT');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      await store.commit('INCREMENT');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ====================================================================
  // ACTION SUBSCRIBER TESTLERI
  // ====================================================================

  describe('Action Subscribers', () => {
    it('Action çağrısında subscriber bilgilendirilmeli', async () => {
      const callback = vi.fn();
      store.subscribeAction(callback);

      await store.dispatch('incrementAsync', 5);

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'incrementAsync',
          payload: 5
        })
      );
    });

    it('Action subscriber timestamp içermeli', async () => {
      const callback = vi.fn();
      store.subscribeAction(callback);

      const beforeTime = Date.now();
      await store.dispatch('incrementAsync', 1);
      const afterTime = Date.now();

      const call = callback.mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(call.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  // ====================================================================
  // RESET VE CLEAR TESTLERI
  // ====================================================================

  describe('Reset ve Clear', () => {
    it('State reset edilebilmeli', async () => {
      await store.commit('INCREMENT', 10);
      await store.commit('ADD_TODO', 'Test');

      store.reset({ count: 0, todos: [] });

      expect(store.getState().count).toBe(0);
      expect(store.getState().todos).toHaveLength(0);
    });

    it('Subscribers clear edilebilmeli', async () => {
      const callback = vi.fn();
      store.subscribe(callback);

      store.clear();

      await store.commit('INCREMENT');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ====================================================================
  // PLUGIN TESTLERI
  // ====================================================================

  describe('Plugins', () => {
    it('Logger plugin çalışabilmeli', async () => {
      const options: StoreOptions<CounterState> = {
        state: { count: 0, todos: [] },
        mutations: {
          INCREMENT(state) {
            state.count++;
          }
        },
        plugins: [createLoggerPlugin()]
      };

      const log = vi.spyOn(console, 'log');
      const storeWithLogger = createStore(options);

      await storeWithLogger.commit('INCREMENT');

      expect(log).toHaveBeenCalledWith('[Store] State updated:', expect.any(Object));
      log.mockRestore();
    });
  });

  // ====================================================================
  // STRICT MODE TESTLERI
  // ====================================================================

  describe('Strict Mode', () => {
    it('Strict mode etkinleştirilmeli', () => {
      const strictStore = createStore({
        state: { count: 0, todos: [] },
        strict: true
      });

      expect(strictStore).toBeInstanceOf(Store);
    });

    it('Strict mode devre dışı bırakılabilmeli', () => {
      const nonStrictStore = createStore({
        state: { count: 0, todos: [] },
        strict: false
      });

      expect(nonStrictStore).toBeInstanceOf(Store);
    });
  });

  // ====================================================================
  // İNTEGRASYON TESTLERI
  // ====================================================================

  describe('Advanced Scenarios', () => {
    it('Mutation ve Action kombine çalışabilmeli', async () => {
      await store.commit('INCREMENT', 5);
      await store.dispatch('incrementAsync', 3);

      expect(store.getState().count).toBe(8);
      expect(store.getGetter('doubleCount')).toBe(16);
    });

    it('Multiple async actions sırasında çalışabilmeli', async () => {
      await Promise.all([
        store.dispatch('incrementAsync', 5),
        store.dispatch('incrementAsync', 3),
        store.dispatch('fetchTodos')
      ]);

      expect(store.getState().count).toBe(8);
      expect(store.getState().todos).toHaveLength(2);
    });

    it('Complex state mutation yapılabilmeli', async () => {
      await store.commit('ADD_TODO', 'Todo 1');
      await store.commit('ADD_TODO', 'Todo 2');
      await store.commit('ADD_TODO', 'Todo 3');

      const todo1Id = store.getState().todos[0].id;

      await store.commit('TOGGLE_TODO', todo1Id);
      await store.commit('REMOVE_TODO', store.getState().todos[1].id);

      expect(store.getState().todos).toHaveLength(2);
      expect(store.getGetter('completedTodos')).toBe(1);
    });

    it('Getter reactive olmalı', async () => {
      let doubleCount = store.getGetter('doubleCount');
      expect(doubleCount).toBe(0);

      await store.commit('INCREMENT', 5);
      doubleCount = store.getGetter('doubleCount');
      expect(doubleCount).toBe(10);

      await store.commit('INCREMENT', 3);
      doubleCount = store.getGetter('doubleCount');
      expect(doubleCount).toBe(16);
    });
  });

  // ====================================================================
  // EDGE CASE TESTLERI
  // ====================================================================

  describe('Edge Cases', () => {
    it('Aynı mutation birden fazla çağrılabilmeli', async () => {
      const callback = vi.fn();
      store.subscribe(callback);

      for (let i = 0; i < 10; i++) {
        await store.commit('INCREMENT');
      }

      expect(store.getState().count).toBe(10);
      expect(callback).toHaveBeenCalledTimes(10);
    });

    it('Null payload mutation çalışabilmeli', async () => {
      await store.commit('RESET');
      expect(store.getState().count).toBe(0);
    });

    it('Store reset sonrası mutation çalışabilmeli', async () => {
      await store.commit('INCREMENT', 10);
      store.reset({ count: 0, todos: [] });
      await store.commit('INCREMENT', 5);

      expect(store.getState().count).toBe(5);
    });
  });
});
