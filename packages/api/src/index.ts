/**
 * @ack/api - API Integration & Data Fetching
 * Türkçe: HTTP client, GraphQL, caching, real-time data fetching
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: number;
  cache?: boolean;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface DataFetchState<T = any> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

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
