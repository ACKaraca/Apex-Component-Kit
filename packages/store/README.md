# @ack/store - State Management

**Version**: 0.4.0

Reactive global state management for ACK Framework. Inspired by Vuex/Pinia with a modern API.

## 🚀 Features

- ✅ **Mutations** - Synchronous state changes
- ✅ **Actions** - Asynchronous operations with context
- ✅ **Getters** - Computed properties
- ✅ **Subscribers** - State change notifications
- ✅ **Plugins** - localStorage, sessionStorage, custom
- ✅ **Strict Mode** - Detect direct state mutations
- ✅ **DevTools** - Time-travel debugging support
- ✅ **Type Safety** - Full TypeScript support

## 📦 Installation

```bash
pnpm add @ack/store
```

## 🎯 Quick Start

```typescript
import { createStore } from '@ack/store';

// Create store
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    INCREMENT(state, amount = 1) {
      state.count += amount;
    }
  },
  actions: {
    async incrementAsync(context, amount) {
      await new Promise(resolve => setTimeout(resolve, 100));
      context.commit('INCREMENT', amount);
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  }
});

// Use store
await store.commit('INCREMENT', 5);
console.log(store.getState().count); // 5

const double = store.getGetter('doubleCount');
console.log(double); // 10

// Actions
await store.dispatch('incrementAsync', 3);
console.log(store.getState().count); // 8
```

## 📚 API Reference

### Store

```typescript
// Get state
store.getState(): S

// Commit mutation
await store.commit(name: string, payload?: any): Promise<void>

// Dispatch action
await store.dispatch(name: string, payload?: any): Promise<any>

// Get computed getter
store.getGetter(name: string): any

// Subscribe to changes
store.subscribe(callback: (state, oldState) => void): () => void

// Subscribe to actions
store.subscribeAction(callback: (payload) => void): () => void

// Reset state
store.reset(newState: S): void

// Clear all subscribers
store.clear(): void
```

### Options

```typescript
interface StoreOptions<S> {
  state: S;
  mutations?: Record<string, (state: S, payload?: any) => void>;
  actions?: Record<string, (context: ActionContext<S>, payload?: any) => any>;
  getters?: Record<string, (state: S) => any>;
  plugins?: StoragePlugin<S>[];
  strict?: boolean; // Default: true
}
```

## 🔌 Plugins

### localStorage

```typescript
import { createLocalStoragePlugin } from '@ack/store';

const store = createStore({
  state: { /* ... */ },
  plugins: [createLocalStoragePlugin('my-store')]
});
```

### sessionStorage

```typescript
import { createSessionStoragePlugin } from '@ack/store';

const store = createStore({
  state: { /* ... */ },
  plugins: [createSessionStoragePlugin('my-store')]
});
```

### Logger

```typescript
import { createLoggerPlugin } from '@ack/store';

const store = createStore({
  state: { /* ... */ },
  plugins: [createLoggerPlugin()]
});
```

## 📖 Examples

### Todo App

```typescript
const todoStore = createStore({
  state: {
    todos: []
  },
  mutations: {
    ADD_TODO(state, title) {
      state.todos.push({
        id: Date.now(),
        title,
        done: false
      });
    },
    TOGGLE_TODO(state, id) {
      const todo = state.todos.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    }
  },
  actions: {
    async addTodo(context, title) {
      // Validation or API call
      await new Promise(resolve => setTimeout(resolve, 100));
      context.commit('ADD_TODO', title);
    }
  },
  getters: {
    completedTodos(state) {
      return state.todos.filter(t => t.done).length;
    }
  }
});

// Usage
await todoStore.dispatch('addTodo', 'Learn ACK');
console.log(todoStore.getGetter('completedTodos'));
```

### Authentication

```typescript
const authStore = createStore({
  state: {
    user: null,
    token: null
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_TOKEN(state, token) {
      state.token = token;
    }
  },
  actions: {
    async login(context, { email, password }) {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const { user, token } = await response.json();
      
      context.commit('SET_USER', user);
      context.commit('SET_TOKEN', token);
    }
  },
  plugins: [createLocalStoragePlugin('auth-store')]
});
```

## 🧪 Testing

```bash
pnpm test
```

## 📊 Statistics

- **40+ Tests** - %100 pass rate
- **1000+ Lines** - Production code
- **Full TypeScript** - Type-safe API
- **Zero Dependencies** - Only @ack/runtime

---

**Version**: 0.4.0  
**License**: MIT
