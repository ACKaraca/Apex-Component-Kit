# API Integration & Data Fetching - Komplet Guide

**ACK Framework'te API entegrasyonu ve veri fetching'i nasıl yapacağını öğren**

## İçerik

- [Başlangıç](#başlangıç)
- [HTTP Client](#http-client)
- [GraphQL](#graphql)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Interceptors](#interceptors)
- [Caching Stratejileri](#caching-stratejileri)
- [Error Handling](#error-handling)
- [Real-World Örnekleri](#real-world-örnekleri)
- [Best Practices](#best-practices)
- [Performance Tips](#performance-tips)

## Başlangıç

### Kurulum

```bash
pnpm add @ack/api
```

### İlk API Client'ı Oluştur

```typescript
import { createHttpClient } from '@ack/api';

const api = createHttpClient('https://api.example.com');

// Kullan
const response = await api.get('/users');
console.log(response.data);
```

## HTTP Client

### Temel CRUD İşlemleri

```typescript
import { createHttpClient } from '@ack/api';

const api = createHttpClient('https://api.example.com');

// CREATE
const user = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// READ
const users = await api.get('/users');
const user = await api.get('/users/1');

// UPDATE
await api.put('/users/1', {
  name: 'Jane Doe'
});

// PATCH (Partial Update)
await api.patch('/users/1', {
  status: 'active'
});

// DELETE
await api.delete('/users/1');
```

### Type-Safe Requests

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const api = createHttpClient('https://api.example.com');

// Type-safe GET
const response = await api.get<User>('/users/1');
const user: User = response.data; // Type inference

// Type-safe POST
const newUser = await api.post<User>('/users', {
  name: 'John',
  email: 'john@example.com'
});

// Type-safe arrays
const users = await api.get<User[]>('/users');
```

### Request Configuration

```typescript
const response = await api.get('/users', {
  timeout: 5000,      // 5 saniye timeout
  retry: 5,           // 5 deneme
  cache: false        // Cache devre dışı
});
```

## GraphQL

### Queries

```typescript
import { createGraphQLClient } from '@ack/api';

const gql = createGraphQLClient('https://graphql.example.com');

interface User {
  id: string;
  name: string;
  email: string;
}

const response = await gql.query<{ user: User }>(
  `query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }`,
  { id: '1' }
);

console.log(response.data.user);
```

### Mutations

```typescript
interface CreateUserResponse {
  createUser: User;
}

const response = await gql.mutate<CreateUserResponse>(
  `mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }`,
  { name: 'John', email: 'john@example.com' }
);

console.log(response.data.createUser);
```

## Data Fetching Patterns

### Sequential Fetching

```typescript
import { createHttpClient, createDataFetcher } from '@ack/api';

const api = createHttpClient('https://api.example.com');
const fetcher = createDataFetcher(api);

// Bir sonraki yapılacaklar
const user = await fetcher.fetch('/users/1');
const posts = await fetcher.fetch(`/users/${user.id}/posts`);
const comments = await fetcher.fetch(`/posts/${posts[0].id}/comments`);
```

### Parallel Fetching

```typescript
// Tüm istekler paralel yapılır
const [users, posts, comments] = await fetcher.fetchAll([
  '/users',
  '/posts',
  '/comments'
]);
```

### Batch Fetching

```typescript
const requests = [
  { url: '/users/1' },
  { url: '/users/2' },
  { url: '/users/3' }
];

const results = await fetcher.batch(requests);
```

### Polling

```typescript
// Her 5 saniyede bir, 10 kez istek yap
const results = await fetcher.poll('/status', 5000, 10);

// Sonuçlar: Array<T> - her istek bir sonuç
results.forEach((status, index) => {
  console.log(`Poll ${index + 1}:`, status);
});
```

### Retry Logic

```typescript
// Başarısız olursa retry
const data = await fetcher.fetchWithRetry(
  '/unreliable-endpoint',
  3,     // max 3 deneme
  1000   // 1 saniye backoff
);
```

## Interceptors

### Authentication

```typescript
import {
  createHttpClient,
  createBearerTokenInterceptor
} from '@ack/api';

const api = createHttpClient('https://api.example.com');

// Static token
const tokenInterceptor = createBearerTokenInterceptor('my-token');
api.useRequestInterceptor(tokenInterceptor);

// Dynamic token (function)
const dynamicTokenInterceptor = createBearerTokenInterceptor(() => {
  return localStorage.getItem('token') || '';
});
api.useRequestInterceptor(dynamicTokenInterceptor);
```

### API Key

```typescript
import { createApiKeyInterceptor } from '@ack/api';

const api = createHttpClient('https://api.example.com');

// Default header: X-API-Key
const keyInterceptor = createApiKeyInterceptor('secret-key');
api.useRequestInterceptor(keyInterceptor);

// Custom header adı
const customInterceptor = createApiKeyInterceptor(
  'secret-key',
  'Authorization'
);
api.useRequestInterceptor(customInterceptor);
```

### Custom Request Interceptor

```typescript
api.useRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Timestamp': Date.now().toString(),
      'X-Client-Version': '1.0.0',
      'Accept-Language': navigator.language
    }
  };
});
```

### Response Interceptor

```typescript
api.useResponseInterceptor((response) => {
  console.log(`[${response.status}] ${response.statusText}`);
  return response;
});
```

### Error Interceptor

```typescript
api.useErrorInterceptor((error) => {
  console.error(`Hata oluştu: ${error.message}`);

  // Custom error handling
  if (error.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  }

  return error;
});
```

### Multiple Interceptors (Chaining)

```typescript
// Tüm interceptors sırasında çalışır
api.useRequestInterceptor((config) => {
  // 1. Add timestamp
  return {
    ...config,
    headers: { ...config.headers, 'X-Time': Date.now().toString() }
  };
});

api.useRequestInterceptor((config) => {
  // 2. Add token
  return {
    ...config,
    headers: { ...config.headers, 'Authorization': 'Bearer token' }
  };
});

api.useResponseInterceptor((response) => {
  // 1. Log response
  console.log(`Response: ${response.status}`);
  return response;
});
```

## Caching Stratejileri

### Varsayılan Caching

```typescript
const api = createHttpClient('https://api.example.com');

// Otomatik 5-minute cache
const response1 = await api.get('/data'); // Network request
const response2 = await api.get('/data'); // Cache'den

// statusText: 'OK (cached)'
console.log(response2.statusText);
```

### Cache Devre Dışı

```typescript
const response = await api.get('/live-data', {
  cache: false
});
```

### Cache Management

```typescript
const api = createHttpClient('https://api.example.com');

// Cache temizle
api.clearCache();

// Sonra istek yapılırsa network'ten gelir
const response = await api.get('/data');
```

### Cache Stratejileri

```typescript
// Strategy 1: GET requests cachele (default)
const users = await api.get('/users', { cache: true });

// Strategy 2: Sadece POST sonucunu cache
const created = await api.post('/users', data, { cache: true });

// Strategy 3: Her istek fresh
const live = await api.get('/live', { cache: false });

// Strategy 4: Manual cache yönetimi
class CachedApi {
  private cache = new Map();

  async fetch(url: string) {
    if (this.cache.has(url)) return this.cache.get(url);

    const data = await api.get(url);
    this.cache.set(url, data);
    return data;
  }

  invalidate(url: string) {
    this.cache.delete(url);
  }
}
```

## Error Handling

### Basic Error Handling

```typescript
try {
  const response = await api.get('/users/999');
  console.log(response.data);
} catch (error: any) {
  console.error('Error:', error.message);
  console.error('Status:', error.status);
  console.error('Data:', error.data);
}
```

### Advanced Error Handling

```typescript
import { type ApiError } from '@ack/api';

async function safeApiFetch<T>(
  fetchFn: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fetchFn();
    return { data, error: null };
  } catch (error: any) {
    let errorMessage = 'Unknown error';

    if (error.status === 404) {
      errorMessage = 'Kaynak bulunamadı';
    } else if (error.status === 401) {
      errorMessage = 'Yetkilendirme hatası';
    } else if (error.status === 500) {
      errorMessage = 'Sunucu hatası';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { data: null, error: errorMessage };
  }
}

// Kullan
const { data, error } = await safeApiFetch(
  () => api.get('/users')
);

if (error) {
  console.error(error);
} else {
  console.log(data);
}
```

### Global Error Handler

```typescript
class ApiWithErrorHandler {
  private api: HttpClient;

  constructor(baseUrl: string) {
    this.api = createHttpClient(baseUrl);

    this.api.useErrorInterceptor((error) => {
      // Log to monitoring service
      console.error('API Error:', error);

      // Show user notification
      this.showNotification(error.message);

      // Trigger event
      window.dispatchEvent(
        new CustomEvent('api-error', { detail: error })
      );

      return error;
    });
  }

  private showNotification(message: string) {
    // Toast notification, alert, etc.
  }
}
```

## Real-World Örnekleri

### E-Commerce API

```typescript
import { createHttpClient } from '@ack/api';

const api = createHttpClient('https://shop-api.example.com');

// Ürünleri getir
const products = await api.get('/products');

// Ürün detaylarını getir
const product = await api.get(`/products/${id}`);

// Sepete ekle
await api.post('/cart/items', {
  productId: id,
  quantity: 1
});

// Ödeme yap
const order = await api.post('/orders', {
  items: cart,
  shippingAddress: address
});
```

### Social Media API

```typescript
import {
  createHttpClient,
  createBearerTokenInterceptor
} from '@ack/api';

const api = createHttpClient('https://social-api.example.com');

// Auth
const token = await api.post('/auth/login', {
  username: 'user',
  password: 'pass'
}).then(r => r.data.token);

api.useRequestInterceptor(createBearerTokenInterceptor(token));

// Feed
const feed = await api.get('/feed');

// Create post
await api.post('/posts', {
  content: 'Hello world!',
  image: imageUrl
});

// Like post
await api.post(`/posts/${postId}/like`);

// Get comments
const comments = await api.get(`/posts/${postId}/comments`);
```

### Real-Time Status API

```typescript
import { createHttpClient, createDataFetcher } from '@ack/api';

const api = createHttpClient('https://status-api.example.com');
const fetcher = createDataFetcher(api);

// 10 saniye aralıkla 5 kez polling yap
const statusHistory = await fetcher.poll(
  '/server-status',
  10000,
  5
);

statusHistory.forEach((status, i) => {
  console.log(`[${i}] Status: ${status.state}`);
});
```

## Best Practices

### 1. Environment Configuration

```typescript
// env.ts
export const API_CONFIG = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.example.com',
  production: 'https://api.example.com'
};

export const api = createHttpClient(
  API_CONFIG[process.env.NODE_ENV as keyof typeof API_CONFIG]
);
```

### 2. Service Layer Pattern

```typescript
// services/userService.ts
import { createHttpClient } from '@ack/api';

class UserService {
  private api = createHttpClient('/api');

  async getUsers() {
    return this.api.get('/users');
  }

  async getUser(id: number) {
    return this.api.get(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.api.post('/users', data);
  }

  async updateUser(id: number, data: any) {
    return this.api.put(`/users/${id}`, data);
  }

  async deleteUser(id: number) {
    return this.api.delete(`/users/${id}`);
  }
}

export const userService = new UserService();
```

### 3. Typed API Services

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

class TypedUserService {
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  }
}
```

### 4. Request Deduplication

```typescript
class DedupApi {
  private pendingRequests = new Map<string, Promise<any>>();

  async get(url: string) {
    // Aynı istek yapılıyorsa, mevcut promise'i döndür
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url);
    }

    const promise = api.get(url);
    this.pendingRequests.set(url, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(url);
    }
  }
}
```

## Performance Tips

### 1. Connection Pooling

```typescript
// Tek bir API client instance kullan
import { createHttpClient } from '@ack/api';

// ✅ Doğru
export const api = createHttpClient('https://api.example.com');

// ❌ Yanlış - her seferinde yeni instance
const api1 = createHttpClient('https://api.example.com');
const api2 = createHttpClient('https://api.example.com');
```

### 2. Request Batching

```typescript
// ❌ Yanlış - 3 ayrı request
await api.get('/users/1');
await api.get('/users/2');
await api.get('/users/3');

// ✅ Doğru - 1 batch request
const users = await fetcher.fetchAll([
  '/users/1',
  '/users/2',
  '/users/3'
]);
```

### 3. Selective Caching

```typescript
// ❌ Yanlış - her şeyi cache
const data = await api.get('/random', { cache: true });

// ✅ Doğru - statik veriyi cache
const users = await api.get('/users', { cache: true });

// ✅ Doğru - real-time veriyi cache'leme
const live = await api.get('/live', { cache: false });
```

### 4. Timeout Optimization

```typescript
// ❌ Yanlış - çok kısa timeout
const data = await api.get('/api', { timeout: 100 });

// ✅ Doğru - makul timeout
const data = await api.get('/api', { timeout: 5000 });
```

---

**Version**: 0.5.0  
**Last Updated**: 2025-10-18
