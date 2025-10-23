/**
 * @ack/api - API Integration & Data Fetching
 * Türkçe: HTTP client, GraphQL, caching, real-time data fetching
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for an HTTP request.
 * @interface RequestConfig
 * @property {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} [method='GET'] - The HTTP request method.
 * @property {Record<string, string>} [headers] - A dictionary of request headers.
 * @property {any} [body] - The request body for methods like POST or PUT.
 * @property {number} [timeout=30000] - The request timeout in milliseconds.
 * @property {number} [retry=3] - The number of times to retry a failed request.
 * @property {boolean} [cache=true] - If true, caches GET requests.
 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
  cache?: boolean;
}

/**
 * Represents the response from an HTTP request.
 * @template T The expected type of the response data.
 * @interface ResponseData
 * @property {T} data - The parsed response data.
 * @property {number} status - The HTTP status code.
 * @property {string} statusText - The HTTP status text.
 * @property {Record<string, string>} headers - A dictionary of response headers.
 */
export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Represents an error that occurred during an API request.
 * @interface ApiError
 * @property {string} message - The error message.
 * @property {number} [status] - The HTTP status code, if available.
 * @property {any} [data] - The error response data, if available.
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

/**
 * Represents an entry in the cache.
 * @template T The type of the cached data.
 * @interface CacheEntry
 * @property {T} data - The cached data.
 * @property {number} timestamp - The timestamp when the data was cached.
 * @property {number} ttl - The time-to-live for the cache entry in milliseconds.
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Represents the state of a data fetching operation.
 * @template T The expected type of the fetched data.
 * @interface DataFetchState
 * @property {T | null} data - The fetched data, or null if not yet fetched.
 * @property {boolean} loading - A flag indicating if the data is currently being fetched.
 * @property {ApiError | null} error - An error object if the fetch failed.
 * @property {() => Promise<void>} refetch - A function to re-trigger the data fetch.
 */
export interface DataFetchState<T = any> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Represents a GraphQL query.
 * @interface GraphQLQuery
 * @property {string} query - The GraphQL query string.
 * @property {Record<string, any>} [variables] - A dictionary of variables for the query.
 */
export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * HTTP Client - REST API requests
 */
class HttpClient {
  private baseUrl: string;
  private headers: Record<string, string> = {};
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTimeout: number = 30000;
  private interceptors = {
    request: [] as Array<(config: RequestConfig) => RequestConfig>,
    response: [] as Array<(response: ResponseData) => ResponseData>,
    error: [] as Array<(error: ApiError) => ApiError>
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Default headers set et
   */
  setHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * Request interceptor ekle
   */
  useRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Response interceptor ekle
   */
  useResponseInterceptor(interceptor: (response: ResponseData) => ResponseData): void {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Error interceptor ekle
   */
  useErrorInterceptor(interceptor: (error: ApiError) => ApiError): void {
    this.interceptors.error.push(interceptor);
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * HTTP request yap
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ResponseData<T>> {
    let requestConfig: any = {
      method: 'GET',
      timeout: this.defaultTimeout,
      retry: 3,
      cache: true,
      ...config,
      headers: { ...this.headers, ...(config.headers || {}) }
    };

    // Request interceptors
    for (const interceptor of this.interceptors.request) {
      requestConfig = interceptor(requestConfig);
    }

    // Cache check
    const cacheKey = `${requestConfig.method}:${url}`;
    if (requestConfig.cache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < entry.ttl) {
        return { data: entry.data, status: 200, statusText: 'OK (cached)', headers: {} };
      }
    }

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < requestConfig.retry!; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, requestConfig);

        // Cache save
        if (requestConfig.cache && requestConfig.method === 'GET') {
          this.cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
            ttl: 5 * 60 * 1000 // 5 minutes
          });
        }

        // Response interceptors
        let finalResponse = response;
        for (const interceptor of this.interceptors.response) {
          finalResponse = interceptor(finalResponse);
        }

        return finalResponse;
      } catch (error) {
        lastError = error as Error;
        if (attempt < requestConfig.retry! - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    const apiError: ApiError = {
      message: lastError?.message || 'Request failed',
      status: 0
    };

    // Error interceptors
    let finalError = apiError;
    for (const interceptor of this.interceptors.error) {
      finalError = interceptor(finalError);
    }

    throw finalError;
  }

  /**
   * Gerçek HTTP request yap
   */
  private async makeRequest<T = any>(url: string, config: any): Promise<ResponseData<T>> {
    const fullUrl = url.startsWith('http') ? url : this.baseUrl + url;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

    try {
      const response = await fetch(fullUrl, {
        method: config.method || 'GET',
        headers: config.headers || {},
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: `HTTP ${response.status}`,
          status: response.status,
          data
        };
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers)
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, body: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, body: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, body: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }
}

// ============================================================================
// GRAPHQL CLIENT
// ============================================================================

/**
 * GraphQL Client
 */
class GraphQLClient extends HttpClient {
  constructor(endpoint: string) {
    super(endpoint);
    this.setHeaders({ 'Content-Type': 'application/json' });
  }

  /**
   * GraphQL query çalıştır
   */
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<ResponseData<T>> {
    return this.post<T>('', {
      query,
      variables
    });
  }

  /**
   * GraphQL mutation çalıştır
   */
  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<ResponseData<T>> {
    return this.post<T>('', {
      query: mutation,
      variables
    });
  }
}

// ============================================================================
// DATA FETCHING UTILITIES
// ============================================================================

/**
 * Data fetching hook state manager
 */
class DataFetcher {
  private client: HttpClient;
  private cache: Map<string, any> = new Map();

  constructor(client: HttpClient) {
    this.client = client;
  }

  /**
   * Veri fetch et
   */
  async fetch<T = any>(url: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Paralel requests
   */
  async fetchAll<T = any>(urls: string[]): Promise<T[]> {
    const promises = urls.map((url) => this.fetch<T>(url));
    return Promise.all(promises);
  }

  /**
   * Polling - belirli aralıkta veri fetch et
   */
  async poll<T = any>(
    url: string,
    interval: number = 5000,
    maxAttempts: number = 10
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const data = await this.fetch<T>(url);
        results.push(data);
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Poll error:', error);
      }
    }

    return results;
  }

  /**
   * Retry logic ile request
   */
  async fetchWithRetry<T = any>(
    url: string,
    maxRetries: number = 3,
    backoff: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.fetch<T>(url);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, backoff * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Batch requests - array haline getir
   */
  async batch<T = any>(requests: Array<{ url: string; config?: RequestConfig }>): Promise<T[]> {
    return Promise.all(requests.map((req) => this.fetch<T>(req.url, req.config)));
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * HttpClient oluştur
 */
function createHttpClient(baseUrl: string): HttpClient {
  return new HttpClient(baseUrl);
}

/**
 * GraphQL client oluştur
 */
function createGraphQLClient(endpoint: string): GraphQLClient {
  return new GraphQLClient(endpoint);
}

/**
 * DataFetcher oluştur
 */
function createDataFetcher(client: HttpClient): DataFetcher {
  return new DataFetcher(client);
}

// ============================================================================
// BUILT-IN INTERCEPTORS
// ============================================================================

/**
 * Bearer token interceptor
 */
function createBearerTokenInterceptor(token: string | (() => string)) {
  return (config: RequestConfig): RequestConfig => {
    const tokenValue = typeof token === 'function' ? token() : token;
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${tokenValue}`
      }
    };
  };
}

/**
 * API Key interceptor
 */
function createApiKeyInterceptor(key: string, headerName: string = 'X-API-Key') {
  return (config: RequestConfig): RequestConfig => {
    return {
      ...config,
      headers: {
        ...config.headers,
        [headerName]: key
      }
    };
  };
}

/**
 * Request logging interceptor
 */
function createLoggingInterceptor() {
  return {
    request: (config: RequestConfig) => {
      console.log(`[API] ${config.method} ${config.headers?.['__url__'] || ''}`);
      return config;
    },
    response: (response: ResponseData) => {
      console.log(`[API] Response: ${response.status}`);
      return response;
    },
    error: (error: ApiError) => {
      console.error(`[API] Error: ${error.message}`);
      return error;
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  HttpClient,
  GraphQLClient,
  DataFetcher,
  createHttpClient,
  createGraphQLClient,
  createDataFetcher,
  createBearerTokenInterceptor,
  createApiKeyInterceptor,
  createLoggingInterceptor
};
