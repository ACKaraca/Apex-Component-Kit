# @ack/api - API Integration & Data Fetching

**Basit, güçlü ve TypeScript-friendly API client**

## Özellikler

✅ **HTTP Client** - GET, POST, PUT, DELETE, PATCH  
✅ **GraphQL Support** - Queries & Mutations  
✅ **Caching** - Otomatik 5-minute TTL  
✅ **Retry Logic** - Exponential backoff  
✅ **Interceptors** - Request, response, error handling  
✅ **Data Fetching** - Polling, batch, parallel requests  
✅ **Type Safety** - Full TypeScript support  

## Kurulum

```bash
pnpm add @ack/api
```

## Hızlı Başlangıç

### HTTP Client

```typescript
import { createHttpClient } from '@ack/api';

const client = createHttpClient('https://api.example.com');

// GET request
const response = await client.get('/users');
console.log(response.data);

// POST request
const created = await client.post('/users', { name: 'John' });

// PUT request
await client.put('/users/1', { name: 'Jane' });

// DELETE request
await client.delete('/users/1');

// PATCH request
await client.patch('/users/1', { status: 'active' });
```

### GraphQL Client

```typescript
import { createGraphQLClient } from '@ack/api';

const gql = createGraphQLClient('https://graphql.example.com');

// Query
const response = await gql.query(`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`, { id: '1' });

// Mutation
const result = await gql.mutate(`
  mutation CreateUser($name: String!) {
    createUser(name: $name) {
      id
      name
    }
  }
`, { name: 'John' });
```

### Data Fetcher

```typescript
import { createHttpClient, createDataFetcher } from '@ack/api';

const client = createHttpClient('https://api.example.com');
const fetcher = createDataFetcher(client);

// Veri fetch et
const user = await fetcher.fetch('/users/1');

// Paralel requests
const [user, posts, comments] = await fetcher.fetchAll([
  '/users/1',
  '/users/1/posts',
  '/users/1/comments'
]);

// Batch requests
const results = await fetcher.batch([
  { url: '/users/1' },
  { url: '/users/2' },
  { url: '/users/3' }
]);

// Retry logic
const data = await fetcher.fetchWithRetry('/data', 3, 1000);

// Polling
const polledData = await fetcher.poll('/status', 5000, 10);
```

## Interceptors

### Bearer Token

```typescript
import { createBearerTokenInterceptor } from '@ack/api';

const client = createHttpClient('https://api.example.com');
const tokenInterceptor = createBearerTokenInterceptor('my-token');

client.useRequestInterceptor(tokenInterceptor);

// Her request'e otomatik Bearer token eklenir
await client.get('/protected');
```

### API Key

```typescript
import { createApiKeyInterceptor } from '@ack/api';

const keyInterceptor = createApiKeyInterceptor('secret-key', 'X-API-Key');
client.useRequestInterceptor(keyInterceptor);

// Her request'e API Key eklenir
await client.get('/endpoint');
```

### Custom Interceptors

```typescript
// Request interceptor
client.useRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Custom': 'value',
      'X-Timestamp': Date.now().toString()
    }
  };
});

// Response interceptor
client.useResponseInterceptor((response) => {
  console.log(`Response: ${response.status}`);
  return response;
});

// Error interceptor
client.useErrorInterceptor((error) => {
  console.error(`Error: ${error.message}`);
  return error;
});
```

## Caching

Varsayılan olarak GET requests 5 dakika cache'lenir:

```typescript
const client = createHttpClient('https://api.example.com');

// Cache etkinleştirilir (default)
const response1 = await client.get('/data'); // Network request
const response2 = await client.get('/data'); // Cache'den

// Cache devre dışı
const response3 = await client.get('/data', { cache: false });

// Cache temizle
client.clearCache();
```

## Retry & Timeout

```typescript
const client = createHttpClient('https://api.example.com');

// Custom timeout ve retry
const response = await client.get('/data', {
  timeout: 5000, // 5 saniye
  retry: 5 // 5 deneme
});
```

## TypeScript Support

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const client = createHttpClient('https://api.example.com');

// Type-safe
const response = await client.get<User>('/users/1');
const user: User = response.data;

const users = await client.get<User[]>('/users');
```

## API Referansı

### HttpClient

#### Methods

```typescript
// GET
get<T>(url: string, config?: RequestConfig): Promise<ResponseData<T>>

// POST
post<T>(url: string, body: any, config?: RequestConfig): Promise<ResponseData<T>>

// PUT
put<T>(url: string, body: any, config?: RequestConfig): Promise<ResponseData<T>>

// DELETE
delete<T>(url: string, config?: RequestConfig): Promise<ResponseData<T>>

// PATCH
patch<T>(url: string, body: any, config?: RequestConfig): Promise<ResponseData<T>>

// Generic request
request<T>(url: string, config?: RequestConfig): Promise<ResponseData<T>>
```

#### Configuration

```typescript
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number; // Default: 30000ms
  retry?: number; // Default: 3
  cache?: boolean; // Default: true
}
```

#### Response

```typescript
interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
```

### GraphQLClient

```typescript
// Query
query<T>(
  query: string,
  variables?: Record<string, any>
): Promise<ResponseData<T>>

// Mutation
mutate<T>(
  mutation: string,
  variables?: Record<string, any>
): Promise<ResponseData<T>>
```

### DataFetcher

```typescript
// Fetch
fetch<T>(url: string, config?: RequestConfig): Promise<T>

// Multiple URLs
fetchAll<T>(urls: string[]): Promise<T[]>

// Batch
batch<T>(
  requests: Array<{ url: string; config?: RequestConfig }>
): Promise<T[]>

// Retry
fetchWithRetry<T>(
  url: string,
  maxRetries?: number,
  backoff?: number
): Promise<T>

// Polling
poll<T>(
  url: string,
  interval?: number,
  maxAttempts?: number
): Promise<T[]>
```

## Gerçek Dünya Örnekleri

### Todo App

```typescript
import { createHttpClient } from '@ack/api';

const api = createHttpClient('https://jsonplaceholder.typicode.com');

// Fetch todos
const todos = await api.get('/todos');

// Create todo
const newTodo = await api.post('/todos', {
  title: 'Learn ACK',
  completed: false,
  userId: 1
});

// Update todo
await api.put(`/todos/${newTodo.data.id}`, {
  completed: true
});

// Delete todo
await api.delete(`/todos/${newTodo.data.id}`);
```

### Blog API

```typescript
import { createHttpClient, createBearerTokenInterceptor } from '@ack/api';

const api = createHttpClient('https://api.blog.example.com');

// Authenticate
const token = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
}).then(r => r.data.token);

// Add token interceptor
api.useRequestInterceptor(createBearerTokenInterceptor(token));

// Get user posts
const posts = await api.get('/posts?userId=1');

// Create post
const post = await api.post('/posts', {
  title: 'My Post',
  content: 'Content here',
  published: true
});
```

### GitHub API

```typescript
import { createHttpClient, createApiKeyInterceptor } from '@ack/api';

const github = createHttpClient('https://api.github.com');

// Add GitHub token
github.useRequestInterceptor(
  createApiKeyInterceptor(process.env.GITHUB_TOKEN, 'Authorization')
);

// Get user
const user = await github.get('/users/octocat');

// Get repos
const repos = await github.get('/users/octocat/repos');

// Create issue
const issue = await github.post('/repos/owner/repo/issues', {
  title: 'Found a bug',
  body: 'I am having a problem with this.'
});
```

## Test Edebilirliği

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createHttpClient } from '@ack/api';

describe('My API Usage', () => {
  it('Veri fetch edebilmeli', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'Test' }),
        headers: new Map()
      } as any)
    );

    const client = createHttpClient('https://api.example.com');
    const response = await client.get('/data');

    expect(response.data).toEqual({ id: 1, name: 'Test' });
  });
});
```

## İstatistikler

```
Kod Satırları:     520+
Test Satırları:    800+
Test Case'leri:    45+
TypeScript Types:  15+
Interceptor'lar:   5+
Built-in Methods:  20+
```

## Sınırlamalar

- ⚠️ Browser ve Node.js ortamını destekler
- ⚠️ Fetch API kullanır
- ⚠️ SSR'de window object kontrol edilmeli

## Lisans

MIT

---

**Version**: 0.5.0  
**Package**: @ack/api
