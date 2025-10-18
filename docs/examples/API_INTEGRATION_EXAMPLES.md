# API Integration Examples - Gerçek Dünya Uygulamaları

## 1. Todo App

### Setup

```typescript
// services/todoService.ts
import { createHttpClient } from '@ack/api';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

class TodoService {
  private api = createHttpClient('https://jsonplaceholder.typicode.com');

  async getTodos(): Promise<Todo[]> {
    const response = await this.api.get<Todo[]>('/todos');
    return response.data;
  }

  async getTodo(id: number): Promise<Todo> {
    const response = await this.api.get<Todo>(`/todos/${id}`);
    return response.data;
  }

  async createTodo(data: Partial<Todo>): Promise<Todo> {
    const response = await this.api.post<Todo>('/todos', data);
    return response.data;
  }

  async updateTodo(id: number, data: Partial<Todo>): Promise<Todo> {
    const response = await this.api.put<Todo>(`/todos/${id}`, data);
    return response.data;
  }

  async deleteTodo(id: number): Promise<void> {
    await this.api.delete(`/todos/${id}`);
  }

  async markComplete(id: number): Promise<Todo> {
    return this.updateTodo(id, { completed: true });
  }
}

export const todoService = new TodoService();
```

### Usage

```typescript
// main.ts
import { todoService } from './services/todoService';

// Tüm todos'ları getir
const todos = await todoService.getTodos();

// Yeni todo oluştur
const newTodo = await todoService.createTodo({
  title: 'Learn ACK Framework',
  completed: false,
  userId: 1
});

// Todo'yu tamamla
await todoService.markComplete(newTodo.id);

// Todo'yu sil
await todoService.deleteTodo(newTodo.id);
```

## 2. Blog Platform

### Authentication & Service

```typescript
// services/authService.ts
import { createHttpClient } from '@ack/api';

class AuthService {
  private api = createHttpClient('https://blog-api.example.com');
  private token: string | null = null;

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', {
      email,
      password
    });

    this.token = response.data.token;
    localStorage.setItem('token', this.token);

    return response.data;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export const authService = new AuthService();

// services/postService.ts
import { createHttpClient, createBearerTokenInterceptor } from '@ack/api';
import { authService } from './authService';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tags: string[];
}

class PostService {
  private api = createHttpClient('https://blog-api.example.com');

  constructor() {
    this.api.useRequestInterceptor(
      createBearerTokenInterceptor(() => authService.getToken() || '')
    );
  }

  async getPosts(page: number = 1): Promise<Post[]> {
    const response = await this.api.get<Post[]>('/posts', {
      timeout: 5000
    });
    return response.data;
  }

  async getPost(slug: string): Promise<Post> {
    const response = await this.api.get<Post>(`/posts/${slug}`);
    return response.data;
  }

  async createPost(data: Partial<Post>): Promise<Post> {
    const response = await this.api.post<Post>('/posts', data);
    return response.data;
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    const response = await this.api.put<Post>(`/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: number): Promise<void> {
    await this.api.delete(`/posts/${id}`);
  }
}

export const postService = new PostService();
```

### Usage

```typescript
import { authService, postService } from './services';

// Login
await authService.login('user@example.com', 'password');

// Posts'ları getir (Bearer token otomatik eklenir)
const posts = await postService.getPosts();

// Yeni post oluştur
const newPost = await postService.createPost({
  title: 'ACK Framework Tutorial',
  content: '...',
  tags: ['javascript', 'framework']
});

// Logout
authService.logout();
```

## 3. Weather App

### GraphQL API Integration

```typescript
// services/weatherService.ts
import { createGraphQLClient } from '@ack/api';

interface Weather {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

interface City {
  name: string;
  country: string;
  weather: Weather;
}

class WeatherService {
  private gql = createGraphQLClient('https://graphql-weather-api.herokuapp.com');

  async getWeather(city: string): Promise<City> {
    const response = await this.gql.query<{ weather: City }>(
      `
      query GetWeather($city: String!) {
        weather(city: $city) {
          name
          country
          weather {
            temperature
            description
            humidity
            windSpeed
          }
        }
      }
      `,
      { city }
    );

    return response.data.weather;
  }

  async getWeatherMultipleCities(
    cities: string[]
  ): Promise<City[]> {
    const queries = cities
      .map(
        (city, i) => `
        city${i}: weather(city: "${city}") {
          name
          country
          weather {
            temperature
            description
          }
        }
      `
      )
      .join('\n');

    const response = await this.gql.query<Record<string, City>>(
      `query GetMultipleWeather {
        ${queries}
      }`
    );

    return Object.values(response.data);
  }
}

export const weatherService = new WeatherService();
```

### Usage

```typescript
import { weatherService } from './services';

// Tek şehrin havasını getir
const istanbul = await weatherService.getWeather('Istanbul');
console.log(`${istanbul.name}: ${istanbul.weather.temperature}°C`);

// Birden fazla şehir
const cities = await weatherService.getWeatherMultipleCities([
  'Istanbul',
  'Ankara',
  'Izmir'
]);

cities.forEach((city) => {
  console.log(`${city.name}: ${city.weather.temperature}°C`);
});
```

## 4. Rate Limiting

### Custom Interceptor with Backoff

```typescript
// interceptors/rateLimitInterceptor.ts
import { createHttpClient, type RequestConfig } from '@ack/api';

class RateLimitManager {
  private requestTimes: number[] = [];
  private requestsPerSecond: number;

  constructor(requestsPerSecond: number = 10) {
    this.requestsPerSecond = requestsPerSecond;
  }

  async checkAndWait() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Son 1 saniyedeki requests'i sil
    this.requestTimes = this.requestTimes.filter((t) => t > oneSecondAgo);

    // Limit kontrol et
    if (this.requestTimes.length >= this.requestsPerSecond) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = 1000 - (now - oldestRequest) + 10;

      console.log(`Rate limited, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Yeniden kontrol et
      return this.checkAndWait();
    }

    this.requestTimes.push(now);
  }
}

export const rateLimitManager = new RateLimitManager(10);

export function createRateLimitInterceptor() {
  return async (config: RequestConfig) => {
    await rateLimitManager.checkAndWait();
    return config;
  };
}
```

### Usage

```typescript
import { createHttpClient } from '@ack/api';
import { createRateLimitInterceptor } from './interceptors';

const api = createHttpClient('https://api.example.com');

// Rate limit interceptor'ı ekle
api.useRequestInterceptor(createRateLimitInterceptor());

// Çok sayıda request yap - rate limiting otomatik uygulanır
for (let i = 0; i < 50; i++) {
  api.get(`/users/${i}`);
}
```

## 5. Retry with Exponential Backoff

### Custom Retry Strategy

```typescript
// services/reliableApiService.ts
import { createHttpClient, type ApiError } from '@ack/api';

class ReliableApiService {
  private api = createHttpClient('https://api.example.com');

  async requestWithRetry<T>(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
    maxAttempts: number = 5
  ): Promise<T> {
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempting ${url} (attempt ${attempt}/${maxAttempts})`);

        let response;
        if (method === 'GET') {
          response = await this.api.get(url);
        } else {
          response = await this.api.post(url, data);
        }

        return response.data as T;
      } catch (error: any) {
        lastError = error;

        // 4xx hatalarda retry yapma (except 429 - rate limit)
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Son deneme değilse, bekle
        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s, 8s
          const delay = Math.pow(2, attempt - 1) * 1000;

          console.log(`Retry in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed after ${maxAttempts} attempts: ${lastError?.message}`
    );
  }

  async getWithRetry<T>(url: string): Promise<T> {
    return this.requestWithRetry<T>(url, 'GET');
  }

  async postWithRetry<T>(url: string, data: any): Promise<T> {
    return this.requestWithRetry<T>(url, 'POST', data);
  }
}

export const reliableApi = new ReliableApiService();
```

### Usage

```typescript
import { reliableApi } from './services';

try {
  const data = await reliableApi.getWithRetry('/unreliable-endpoint');
  console.log('Success:', data);
} catch (error) {
  console.error('Failed:', error);
}
```

## 6. Caching & Data Sync

### Smart Cache Manager

```typescript
// services/cacheManager.ts
import { createHttpClient } from '@ack/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class SmartCacheManager {
  private api = createHttpClient('https://api.example.com');
  private cache: Map<string, CacheEntry<any>> = new Map();

  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  async fetch<T>(
    url: string,
    options = { ttl: 5 * 60 * 1000 } // 5 minutes default
  ): Promise<T> {
    const cached = this.cache.get(url);

    if (cached && this.isCacheValid(cached)) {
      console.log(`Cache hit: ${url}`);
      return cached.data;
    }

    console.log(`Fetching: ${url}`);
    const response = await this.api.get(url);

    this.cache.set(url, {
      data: response.data,
      timestamp: Date.now(),
      ttl: options.ttl
    });

    return response.data;
  }

  invalidate(url: string) {
    this.cache.delete(url);
    console.log(`Cache invalidated: ${url}`);
  }

  invalidateAll() {
    this.cache.clear();
    console.log('All cache invalidated');
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([url, entry]) => ({
        url,
        cached: this.isCacheValid(entry),
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    };
  }
}

export const cacheManager = new SmartCacheManager();
```

### Usage

```typescript
import { cacheManager } from './services';

// İlk istek - network'ten
const users1 = await cacheManager.fetch('/users');

// İkinci istek - cache'ten
const users2 = await cacheManager.fetch('/users');

// Cache invalidate
cacheManager.invalidate('/users');

// Üçüncü istek - tekrar network'ten
const users3 = await cacheManager.fetch('/users');

// Cache istatistikleri
console.log(cacheManager.getStats());
```

## 7. Pagination & Infinite Scroll

### Pagination Service

```typescript
// services/paginationService.ts
import { createHttpClient } from '@ack/api';

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

class PaginationService {
  private api = createHttpClient('https://api.example.com');
  private currentPage: number = 1;
  private pageSize: number = 20;
  private allData: any[] = [];

  async getPage<T>(
    endpoint: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<T>> {
    const response = await this.api.get<PaginatedResponse<T>>(
      `${endpoint}?page=${page}&pageSize=${pageSize}`
    );

    return response.data;
  }

  async loadMore<T>(endpoint: string): Promise<T[]> {
    const response = await this.getPage<T>(
      endpoint,
      this.currentPage,
      this.pageSize
    );

    this.allData = [...this.allData, ...response.data];
    this.currentPage++;

    return response.data;
  }

  async reset() {
    this.currentPage = 1;
    this.allData = [];
  }

  getAll<T>(): T[] {
    return this.allData;
  }
}

export const paginationService = new PaginationService();
```

### Usage

```typescript
import { paginationService } from './services';

// İlk sayfa
let posts = await paginationService.loadMore('/posts');
console.log(`Loaded ${posts.length} posts`);

// Sonraki sayfa
posts = await paginationService.loadMore('/posts');
console.log(`Loaded ${posts.length} more posts`);

// Tüm yüklenen posts
const allPosts = paginationService.getAll();
```

## 8. Error Recovery

### Automatic Retry on Error

```typescript
// interceptors/errorRecovery.ts
import { createHttpClient, type ApiError } from '@ack/api';

export function createErrorRecoveryInterceptor() {
  return (error: ApiError) => {
    const statusCode = error.status;

    // Network hatası - retry yapılacak
    if (!statusCode) {
      console.log('Network error detected');
    }

    // Server error - retry yapılacak
    if (statusCode && statusCode >= 500) {
      console.log(`Server error ${statusCode} - will retry`);
    }

    // Rate limit - backoff yapılacak
    if (statusCode === 429) {
      console.log('Rate limited - waiting before retry');
    }

    // Client error - don't retry
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      console.log(`Client error ${statusCode} - no retry`);
    }

    return error;
  };
}
```

### Usage

```typescript
import { createHttpClient } from '@ack/api';
import { createErrorRecoveryInterceptor } from './interceptors';

const api = createHttpClient('https://api.example.com');
api.useErrorInterceptor(createErrorRecoveryInterceptor());

try {
  await api.get('/endpoint');
} catch (error: any) {
  if (error.status === 500) {
    // Server hatası - retry yapılabilir
  } else if (error.status === 429) {
    // Rate limited - wait and retry
  } else if (!error.status) {
    // Network hatası - offline mi?
  }
}
```

---

**Version**: 0.5.0  
**Last Updated**: 2025-10-18
