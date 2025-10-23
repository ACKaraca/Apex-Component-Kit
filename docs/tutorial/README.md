# ACK Framework Tutorial

Bu tutorial, ACK Framework'ü öğrenmek için adım adım rehberdir. Başlangıç seviyesinden advanced konulara kadar tüm seviyeler için örnekler içerir.

## 🚀 Başlarken

### 1. Proje Oluşturma

İlk ACK projenizi oluşturmak için:

```bash
# CLI aracını kullanın
npx create-ack-app my-first-app

# Veya manuel kurulum
mkdir my-first-app
cd my-first-app
pnpm init
pnpm add @ack/kit @ack/runtime @ack/compiler
```

### 2. Proje Yapısı

ACK projesinin temel yapısı:

```
my-first-app/
├── src/
│   ├── pages/
│   │   └── index.ack          # Ana sayfa
│   └── main.ts               # Entry point
├── package.json
├── vite.config.ts            # Build config
└── index.html               # HTML template
```

### 3. İlk Component

`src/pages/index.ack` dosyasını oluşturun:

```ack
<script>
  let count = 0;

  function increment() {
    count++;
  }
</script>

<template>
  <div class="container">
    <h1>ACK Framework'e Hoş Geldiniz!</h1>
    <p>Counter: {count}</p>
    <button @click={increment}>Increment</button>
  </div>
</template>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  h1 {
    color: #333;
  }

  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #0056b3;
  }
</style>
```

## 📚 Temel Kavramlar

### State Management

ACK'da state'i reactive olarak yönetin:

```ack
<script>
  let todos = [];
  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false
      }];
      newTodo = '';
    }
  }

  function toggleTodo(id) {
    todos = todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    );
  }

  function removeTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }
</script>

<template>
  <div>
    <h2>Todo List</h2>

    <div>
      <input
        bind:value={newTodo}
        placeholder="Add a todo"
        @keydown.enter={addTodo}
      />
      <button @click={addTodo}>Add</button>
    </div>

    <ul>
      {#each todos as todo}
        <li class:completed={todo.completed}>
          <input
            type="checkbox"
            bind:checked={todo.completed}
            @change={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button @click={() => removeTodo(todo.id)}>×</button>
        </li>
      {/each}
    </ul>
  </div>
</template>

<style>
  li.completed span {
    text-decoration: line-through;
    color: #666;
  }

  button {
    margin-left: 10px;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 10px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
  }
</style>
```

### Props ve Event'ler

Component'ler arası iletişim:

```ack
<!-- Parent component -->
<script>
  import Counter from './Counter.ack';

  let maxCount = 10;
</script>

<template>
  <div>
    <Counter
      initialValue={5}
      max={maxCount}
      onMaxReached={() => alert('Maximum reached!')}
    />
  </div>
</template>
```

```ack
<!-- Counter.ack -->
<script>
  export let initialValue = 0;
  export let max = 100;
  export let onMaxReached;

  let count = initialValue;

  function increment() {
    if (count < max) {
      count++;
    } else {
      onMaxReached?.();
    }
  }
</script>

<template>
  <div>
    <p>Count: {count}</p>
    <button @click={increment}>Increment</button>
  </div>
</template>
```

## 🎯 Advanced Özellikler

### Routing

ACK Kit ile routing:

```typescript
// src/main.ts
import { createAdvancedRouter, createAuthMiddleware } from '@ack/kit';

const routes = [
  {
    path: '/',
    component: 'pages/Home.ack',
    name: 'Home'
  },
  {
    path: '/about',
    component: 'pages/About.ack',
    name: 'About'
  },
  {
    path: '/user/:id',
    component: 'pages/User.ack',
    name: 'User'
  }
];

const authMiddleware = createAuthMiddleware({
  loginPath: '/login',
  redirectIfNotAuth: true
});

const router = createAdvancedRouter({
  routes,
  middlewares: [authMiddleware]
});

router.start();
```

### API Integration

HTTP client kullanımı:

```typescript
// services/api.ts
import { createHttpClient } from '@ack/api';

const api = createHttpClient('https://jsonplaceholder.typicode.com');

// Interceptors ekleme
const authInterceptor = createBearerTokenInterceptor(token);
api.useRequestInterceptor(authInterceptor);

export const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async getUser(id: number) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: any) {
    const response = await api.post('/users', userData);
    return response.data;
  }
};
```

### State Management

Global state yönetimi:

```typescript
// stores/userStore.ts
import { createStore } from '@ack/store';

export const userStore = createStore({
  state: {
    currentUser: null,
    isLoading: false,
    error: null
  },

  mutations: {
    setLoading(state, isLoading: boolean) {
      state.isLoading = isLoading;
    },

    setUser(state, user: any) {
      state.currentUser = user;
      state.error = null;
    },

    setError(state, error: string) {
      state.error = error;
      state.isLoading = false;
    }
  },

  actions: {
    async login({ commit }, credentials: any) {
      commit('setLoading', true);

      try {
        const response = await api.post('/auth/login', credentials);
        commit('setUser', response.data.user);
        localStorage.setItem('token', response.data.token);
      } catch (error) {
        commit('setError', error.message);
      }
    },

    logout({ commit }) {
      commit('setUser', null);
      localStorage.removeItem('token');
    }
  }
});
```

## 🏗️ Build ve Deployment

### Development

Development server'ı başlatma:

```bash
# Development server
pnpm dev

# Build için izleme
pnpm dev:watch

# Type checking
pnpm type-check
```

### Production Build

```bash
# Production build
pnpm build

# Preview build
pnpm preview

# Lint
pnpm lint

# Test
pnpm test
```

### Deployment

#### Vercel

```bash
# Vercel CLI
npm i -g vercel
vercel

# Manuel deployment
vercel --prod
```

#### Netlify

```bash
# Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🧪 Testing

### Unit Tests

```typescript
// src/components/Counter.test.ts
import { mount } from '@ack/runtime/test-utils';
import Counter from './Counter.ack';

describe('Counter', () => {
  it('should increment count', async () => {
    const wrapper = mount(Counter);

    expect(wrapper.text()).toContain('Count: 0');

    await wrapper.find('button').trigger('click');

    expect(wrapper.text()).toContain('Count: 1');
  });
});
```

### E2E Tests

```typescript
// e2e/counter.spec.ts
import { test, expect } from '@playwright/test';

test('should increment counter', async ({ page }) => {
  await page.goto('/');

  const counter = page.locator('text=Count: 0');
  await expect(counter).toBeVisible();

  await page.click('button:has-text("Increment")');

  await expect(page.locator('text=Count: 1')).toBeVisible();
});
```

## 🎨 Styling

### CSS-in-JS

```ack
<style>
  .card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .card:hover {
    transform: translateY(-2px);
    transition: transform 0.2s;
  }
</style>
```

### Global Styles

```typescript
// src/styles/global.css
import { injectGlobalStyles } from '@ack/runtime';

injectGlobalStyles(`
  * {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
  }
`);
```

## 🔧 Configuration

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import ackPlugin from '@ack/vite-plugin';

export default defineConfig({
  plugins: [
    ackPlugin({
      include: ['**/*.ack'],
      exclude: ['node_modules/**']
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": [
    "src/**/*",
    "*.ts",
    "*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## 📱 PWA Support

Progressive Web App özellikleri:

```typescript
// src/pwa.ts
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  }
});
```

## 🔍 Debugging

### Development Tools

```typescript
// Enable debug mode
process.env.NODE_ENV = 'development';
localStorage.setItem('ACK_DEBUG', 'true');

// Console logging
console.log('Component state:', componentState);
console.log('Props:', props);
```

### Performance Monitoring

```typescript
// Performance monitoring
import { PerformanceMonitor } from '@ack/cicd';

const monitor = new PerformanceMonitor();

monitor.recordMetric('component-render', renderTime);
monitor.recordMetric('api-response', responseTime);
```

## 🚦 Best Practices

### 1. Component Design
- Tek sorumluluk prensibi
- Props'u immutable tutun
- Event handler'ları stable tutun

### 2. State Management
- Global state'i minimumda tutun
- Local state'i tercih edin
- Immutable updates kullanın

### 3. Performance
- Lazy loading kullanın
- Code splitting uygulayın
- Bundle size'ını optimize edin

### 4. Accessibility
- Semantic HTML kullanın
- ARIA attributes ekleyin
- Keyboard navigation destekleyin

## 📚 Örnek Projeler

### Todo App
Kapsamlı todo uygulaması örneği:

```ack
<script>
  import { createStore } from '@ack/store';
  import { createHttpClient } from '@ack/api';

  const api = createHttpClient('https://jsonplaceholder.typicode.com');

  const todoStore = createStore({
    state: {
      todos: [],
      filter: 'all',
      loading: false
    },

    mutations: {
      setTodos(state, todos) {
        state.todos = todos;
      },
      addTodo(state, todo) {
        state.todos.push(todo);
      },
      toggleTodo(state, id) {
        const todo = state.todos.find(t => t.id === id);
        if (todo) todo.completed = !todo.completed;
      }
    },

    actions: {
      async loadTodos({ commit }) {
        commit('setLoading', true);
        try {
          const response = await api.get('/todos');
          commit('setTodos', response.data);
        } finally {
          commit('setLoading', false);
        }
      }
    }
  });
</script>

<template>
  <div class="todo-app">
    <h1>ACK Todo App</h1>

    <TodoForm on:add={todoStore.dispatch('addTodo')} />
    <TodoList
      todos={todoStore.getters.filteredTodos}
      on:toggle={todoStore.dispatch('toggleTodo')}
    />
    <TodoFilters bind:filter={todoStore.state.filter} />
  </div>
</template>
```

## 🎯 Sonraki Adımlar

Bu tutorial'ı tamamladıktan sonra:

1. **Örnek Projeler**: [ACK Examples Repository](https://github.com/ack-framework/examples)'e bakın
2. **API Documentation**: [ACK API Docs](https://docs.ackframework.io/api)'u inceleyin
3. **Community**: [Discord Community](https://discord.gg/ack-framework)'ye katılın
4. **Contributing**: [Contributing Guide](https://github.com/ack-framework/ack/blob/main/CONTRIBUTING.md)'u okuyun

## 🆘 Yardım

Herhangi bir sorun yaşarsanız:

- [GitHub Issues](https://github.com/ack-framework/ack/issues)
- [Discord Community](https://discord.gg/ack-framework)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ack-framework)

---

**Mutlu kodlamalar! 🚀**

Bu tutorial, ACK Framework'ü öğrenmek için temel bilgileri içermektedir. Daha advanced konular için [Advanced Guide](https://docs.ackframework.io/advanced)'a bakınız.
