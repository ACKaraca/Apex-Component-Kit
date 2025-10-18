/**
 * API Integration Tests
 * Türkçe: HTTP client, GraphQL, data fetching, interceptors test'leri
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HttpClient,
  GraphQLClient,
  DataFetcher,
  createHttpClient,
  createGraphQLClient,
  createDataFetcher,
  createBearerTokenInterceptor,
  createApiKeyInterceptor,
  type RequestConfig,
  type ResponseData
} from '../src/index';

describe('API Integration', () => {
  let httpClient: HttpClient;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    httpClient = new HttpClient(baseUrl);
    vi.clearAllMocks();
  });

  // ====================================================================
  // HTTP CLIENT TESTLERI
  // ====================================================================

  describe('HttpClient', () => {
    it('HttpClient instance oluşturulabilmeli', () => {
      expect(httpClient).toBeInstanceOf(HttpClient);
    });

    it('GET request başarılı olabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'test' }),
          headers: new Map()
        } as any)
      );

      const response = await httpClient.get('/users');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });

    it('POST request başarılı olabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          statusText: 'Created',
          json: () => Promise.resolve({ id: 1 }),
          headers: new Map()
        } as any)
      );

      const response = await httpClient.post('/users', { name: 'John' });
      expect(response.status).toBe(201);
    });

    it('PUT request başarılı olabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ id: 1, name: 'Jane' }),
          headers: new Map()
        } as any)
      );

      const response = await httpClient.put('/users/1', { name: 'Jane' });
      expect(response.status).toBe(200);
    });

    it('DELETE request başarılı olabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          statusText: 'No Content',
          json: () => Promise.resolve({}),
          headers: new Map()
        } as any)
      );

      const response = await httpClient.delete('/users/1');
      expect(response.status).toBe(204);
    });

    it('PATCH request başarılı olabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ id: 1, name: 'Updated' }),
          headers: new Map()
        } as any)
      );

      const response = await httpClient.patch('/users/1', { name: 'Updated' });
      expect(response.status).toBe(200);
    });

    it('HTTP hatasını handle edebilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({ error: 'Not found' }),
          headers: new Map()
        } as any)
      );

      try {
        await httpClient.get('/notfound');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    it('Cache çalışabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'cached' }),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/data', { cache: true });
      await httpClient.get('/data', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('Custom headers ayarlanabilmeli', async () => {
      httpClient.setHeaders({ 'X-Custom': 'value' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({}),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-Custom']).toBe('value');
    });

    it('Cache temizlenebilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'test' }),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/data', { cache: true });
      httpClient.clearCache();
      await httpClient.get('/data', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ====================================================================
  // INTERCEPTOR TESTLERI
  // ====================================================================

  describe('Interceptors', () => {
    it('Request interceptor çalışabilmeli', async () => {
      const interceptor = vi.fn((config: RequestConfig) => {
        return { ...config, headers: { ...config.headers, 'X-Modified': 'true' } };
      });

      httpClient.useRequestInterceptor(interceptor);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({}),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      expect(interceptor).toHaveBeenCalled();
    });

    it('Bearer token interceptor çalışabilmeli', async () => {
      const tokenInterceptor = createBearerTokenInterceptor('my-token');
      httpClient.useRequestInterceptor(tokenInterceptor);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({}),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBe('Bearer my-token');
    });

    it('API Key interceptor çalışabilmeli', async () => {
      const keyInterceptor = createApiKeyInterceptor('secret-key');
      httpClient.useRequestInterceptor(keyInterceptor);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({}),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-API-Key']).toBe('secret-key');
    });

    it('Response interceptor çalışabilmeli', async () => {
      const responseInterceptor = vi.fn((response: ResponseData) => response);
      httpClient.useResponseInterceptor(responseInterceptor);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ modified: true }),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      expect(responseInterceptor).toHaveBeenCalled();
    });
  });

  // ====================================================================
  // GRAPHQL CLIENT TESTLERI
  // ====================================================================

  describe('GraphQLClient', () => {
    it('GraphQLClient instance oluşturulabilmeli', () => {
      const gqlClient = new GraphQLClient('https://graphql.example.com');
      expect(gqlClient).toBeInstanceOf(GraphQLClient);
    });

    it('GraphQL query çalışabilmeli', async () => {
      const gqlClient = new GraphQLClient('https://graphql.example.com');

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: { user: { id: 1, name: 'John' } } }),
          headers: new Map()
        } as any)
      );

      const response = await gqlClient.query('{ user { id name } }');
      expect(response.status).toBe(200);
    });

    it('GraphQL mutation çalışabilmeli', async () => {
      const gqlClient = new GraphQLClient('https://graphql.example.com');

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: { createUser: { id: 1 } } }),
          headers: new Map()
        } as any)
      );

      const response = await gqlClient.mutate('mutation { createUser { id } }');
      expect(response.status).toBe(200);
    });

    it('GraphQL variables gönderebilmeli', async () => {
      const gqlClient = new GraphQLClient('https://graphql.example.com');

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: { user: {} } }),
          headers: new Map()
        } as any)
      );

      await gqlClient.query('query($id: ID!) { user(id: $id) { id } }', { id: '1' });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.variables).toEqual({ id: '1' });
    });
  });

  // ====================================================================
  // DATA FETCHER TESTLERI
  // ====================================================================

  describe('DataFetcher', () => {
    let fetcher: DataFetcher;

    beforeEach(() => {
      fetcher = new DataFetcher(httpClient);
    });

    it('DataFetcher instance oluşturulabilmeli', () => {
      expect(fetcher).toBeInstanceOf(DataFetcher);
    });

    it('Veri fetch edilebilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ id: 1, name: 'Test' }),
          headers: new Map()
        } as any)
      );

      const data = await fetcher.fetch('/users/1');
      expect(data).toEqual({ id: 1, name: 'Test' });
    });

    it('Paralel requests çalışabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ id: 1 }),
          headers: new Map()
        } as any)
      );

      const results = await fetcher.fetchAll(['/users/1', '/users/2', '/users/3']);
      expect(results).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('Batch requests çalışabilmeli', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ id: 1 }),
          headers: new Map()
        } as any)
      );

      const requests = [{ url: '/users/1' }, { url: '/users/2' }];
      const results = await fetcher.batch(requests);

      expect(results).toHaveLength(2);
    });

    it('Retry logic çalışabilmeli', async () => {
      let attempts = 0;

      global.fetch = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Map()
        } as any);
      });

      const data = await fetcher.fetchWithRetry('/test', 3, 10);
      expect(data).toEqual({ data: 'success' });
      expect(attempts).toBe(3);
    });

    it('Polling çalışabilmeli', async () => {
      let callCount = 0;

      global.fetch = vi.fn(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ poll: callCount }),
          headers: new Map()
        } as any);
      });

      const results = await fetcher.poll('/data', 10, 3);
      expect(results).toHaveLength(3);
    });
  });

  // ====================================================================
  // FACTORY FUNCTIONS TESTLERI
  // ====================================================================

  describe('Factory Functions', () => {
    it('createHttpClient çalışabilmeli', () => {
      const client = createHttpClient('https://api.example.com');
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('createGraphQLClient çalışabilmeli', () => {
      const client = createGraphQLClient('https://graphql.example.com');
      expect(client).toBeInstanceOf(GraphQLClient);
    });

    it('createDataFetcher çalışabilmeli', () => {
      const client = new HttpClient('https://api.example.com');
      const fetcher = createDataFetcher(client);
      expect(fetcher).toBeInstanceOf(DataFetcher);
    });
  });

  // ====================================================================
  // İNTEGRASYON TESTLERI
  // ====================================================================

  describe('Advanced Scenarios', () => {
    it('Multiple interceptors sırasında çalışabilmeli', async () => {
      const interceptor1 = vi.fn((config: RequestConfig) => ({
        ...config,
        headers: { ...config.headers, 'X-1': 'true' }
      }));

      const interceptor2 = vi.fn((config: RequestConfig) => ({
        ...config,
        headers: { ...config.headers, 'X-2': 'true' }
      }));

      httpClient.useRequestInterceptor(interceptor1);
      httpClient.useRequestInterceptor(interceptor2);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({}),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      expect(interceptor1).toHaveBeenCalled();
      expect(interceptor2).toHaveBeenCalled();
    });

    it('Error interceptor çalışabilmeli', async () => {
      const errorInterceptor = vi.fn((error: any) => error);
      httpClient.useErrorInterceptor(errorInterceptor);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ error: 'Server error' }),
          headers: new Map()
        } as any)
      );

      try {
        await httpClient.get('/error');
      } catch (error) {
        expect(errorInterceptor).toHaveBeenCalled();
      }
    });

    it('Full request lifecycle çalışabilmeli', async () => {
      const requestLog: string[] = [];

      httpClient.useRequestInterceptor((config) => {
        requestLog.push('request');
        return config;
      });

      httpClient.useResponseInterceptor((response) => {
        requestLog.push('response');
        return response;
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve({ success: true }),
          headers: new Map()
        } as any)
      );

      await httpClient.get('/test');

      expect(requestLog).toEqual(['request', 'response']);
    });
  });
});
