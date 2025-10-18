# ACK Framework API Reference

**Welcome to the official API reference for the ACK Framework.** This document provides a detailed overview of the core modules, classes, and functions available in the framework.

---

## Core Modules

The ACK Framework is organized into several core modules, each responsible for a specific set of functionalities.

- **`@ack/kit`**: The main toolkit, which includes the advanced router and core utilities.
- **`@ack/api`**: A powerful client for making HTTP and GraphQL requests.
- **`@ack/loader`**: A sophisticated module for lazy loading, code splitting, and prefetching.

---

## 1. `@ack/kit`

This is the foundational package for any ACK application.

### `createAdvancedRouter(sourceDir, options)`

Initializes the file-based routing system.

- **`sourceDir`**: `string` - The directory where your page components are located.
- **`options`**: `object` (optional) - Configuration for the router.
  - **`basePath`**: `string` - The base path for all routes.
  - **`middlewares`**: `MiddlewareFn[]` - An array of global middlewares.
  - **`beforeEach`**: `HookFn[]` - Global navigation guards that run before each navigation.
  - **`afterEach`**: `HookFn[]` - Global hooks that run after each navigation.

**Returns:** An `AdvancedRouter` instance.

### `AdvancedRouter` Instance

The router instance provides the following methods and properties:

- **`.navigate(path, options)`**: Programmatically navigates to a new route.
  - **`path`**: `string` - The path to navigate to.
  - **`options`**: `{ replace?: boolean }` - If `true`, replaces the current history entry.
- **`.back()`**: Navigates to the previous page in the session history.
- **`.forward()`**: Navigates to the next page in the session history.
- **`.use(middleware)`**: Registers a global middleware function.
- **`.beforeEach(hook)`**: Registers a global `beforeEach` hook.
- **`.afterEach(hook)`**: Registers a global `afterEach` hook.
- **`.getCurrentRoute()`**: Returns the current `RouteContext` object.
- **`.getAllRoutes()`**: Returns an array of all discovered routes.

---

## 2. `@ack/api`

This module simplifies communication with backend services.

### `createHttpClient(baseURL, options)`

Creates a new HTTP client instance.

- **`baseURL`**: `string` - The base URL for all requests made by this client.
- **`options`**: `object` (optional) - Configuration for the client.

**Returns:** An `HttpClient` instance.

### `HttpClient` Instance

- **`.get(url, config)`**: Performs a GET request.
- **`.post(url, data, config)`**: Performs a POST request.
- **`.put(url, data, config)`**: Performs a PUT request.
- **`.patch(url, data, config)`**: Performs a PATCH request.
- **`.delete(url, config)`**: Performs a DELETE request.
- **`.useRequestInterceptor(interceptor)`**: Adds a request interceptor.
- **`.useResponseInterceptor(interceptor)`**: Adds a response interceptor.
- **`.useErrorInterceptor(interceptor)`**: Adds an error interceptor.

### `createGraphQLClient(endpoint)`

Creates a new GraphQL client instance.

- **`endpoint`**: `string` - The URL of the GraphQL endpoint.

**Returns:** A `GraphQLClient` instance.

### `GraphQLClient` Instance

- **`.query(query, variables)`**: Executes a GraphQL query.
- **`.mutate(mutation, variables)`**: Executes a GraphQL mutation.

---

## 3. `@ack/loader`

This module provides advanced features for performance optimization.

### `createLazyLoader(options)`

Creates a loader for dynamically importing modules.

- **`options`**: `object` (optional)
  - **`maxConcurrentLoads`**: `number` - The maximum number of concurrent loads.

**Returns:** A `LazyLoader` instance.

### `LazyLoader` Instance

- **`.load(id, loaderFn)`**: Loads a module.
- **`.preload(id, loaderFn)`**: Preloads a module in the background.
- **`.unload(id)`**: Unloads a module from the cache.
- **`.unloadAll()`**: Clears the entire cache.

### `createChunkManager()`

Creates a manager for route-based code splitting.

**Returns:** A `ChunkManager` instance.

### `ChunkManager` Instance

- **`.registerChunk(id, loaderFn)`**: Registers a chunk.
- **`.defineChunks(route, chunkIds)`**: Associates chunks with a specific route.
- **`.loadRoute(route)`**: Loads all chunks for a given route.
- **`.preloadRoute(route)`**: Preloads all chunks for a given route.

### `createPrefetcher(strategy)`

Creates a prefetcher with a specific strategy.

- **`strategy`**: `'aggressive' | 'conservative' | 'idle'` - The prefetching strategy to use.

**Returns:** A `Prefetcher` instance.

### `Prefetcher` Instance

- **`.schedule(id, loaderFn, options)`**: Schedules a module for prefetching.
  - **`options`**: `{ priority?: 'high' | 'low' }`
- **`.prefetchBasedOnNetwork()`**: Automatically adjusts the strategy based on the user's network conditions.

---

This API reference provides a high-level overview. For more detailed examples and guides, please refer to the following documents:

- **[Advanced Routing Guide](./../guide/ADVANCED_ROUTING.md)**
- **[API Integration Guide](./../guide/API_INTEGRATION.md)**
- **[Lazy Loading & Code Splitting Guide](./../guide/LAZY_LOADING_CODE_SPLITTING.md)**