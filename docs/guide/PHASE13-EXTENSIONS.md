# ACK Framework - Phase 13 Extensions (Detailed Plan)

## Scope

This guide summarizes the additional Phase 13 initiatives added to the roadmap: Edge adapters, Observability/Telemetry, Security/Sandboxing, Bundler Abstraction, Language Server & Template Type Checking, Scheduler & Transitions, and Module Federation.

## 1) Edge & Streaming SSR (@ack/edge)

- Adapters: Vercel, Cloudflare Workers, Netlify Edge, Node, Deno
- Features: Streaming SSR, Islands/partial hydration, Web-standard Request/Response APIs

Example adapter usage:
```ts
import { createEdgeAdapter } from '@ack/edge';

export default createEdgeAdapter({
  target: 'vercel',
  streaming: true,
  islands: true
});
```

Acceptance criteria:
- Edge adapter compiles and serves a demo app with streaming SSR
- Islands hydration manifest generated and consumed at runtime
- TTFB P95 < 100ms on Edge in example deployment

## 2) Observability & Telemetry (@ack/telemetry)

- Unifies traces/metrics/logs across compiler, dev server, runtime, and plugins
- OpenTelemetry SDK integration; OTLP/HTTP exporters
- Correlate router navigations, store mutations, HMR cycles and network timings

Helper:
```ts
export function withSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> | T { /* see roadmap */ }
```

Acceptance criteria:
- Traces for compile → HMR apply visible in a demo backend
- Metrics: render time, effect flush time, store mutation rate
- Logs enriched with correlation IDs

## 3) Security & Sandboxing (@ack/security)

- Template sandbox with allowlisted helpers
- Strict SSR escaping; sanitization utilities for attributes/URLs
- Plugin capability model and CSP helpers

Acceptance criteria:
- XSS tests: dangerous inputs are escaped by default
- Plugins cannot access disallowed capabilities without explicit opt-in
- Security guide documents guarantees and limits

## 4) Bundler Abstraction (@ack/build)

- Unified transform via unplugin; adapters for Vite, Rspack, Rollup/Rolldown, esbuild
- Optional module federation integration

Example skeleton:
```ts
import { createUnplugin } from 'unplugin';

export const AckPluginBase = createUnplugin((options) => ({
  name: 'ack',
  transformInclude(id) { return id.endsWith('.ack'); },
  transform(code, id) { return compileAck(code, id, options); },
}));
```

Acceptance criteria:
- Same .ack file builds successfully under Vite and Rspack demos
- HMR hooks mapped equivalently where supported

## 5) Language Server & Template Type Checker (@ack/lsp)

- LSP server with diagnostics for template expressions, slots, events, bindings
- Editor features: hover, go-to, completions, quick-fixes

Acceptance criteria:
- Invalid template binding produces an inline diagnostic
- Slot prop type mismatches detected in CI

## 6) Scheduler & Transitions (@ack/scheduler)

- Cooperative scheduler with priority lanes and time-slicing
- Transitions API for interruptible, low-priority updates

Example:
```ts
import { startTransition } from '@ack/scheduler';

startTransition(() => state.applyLargeUpdate());
```

Acceptance criteria:
- Input responsiveness unaffected during heavy renders in demo
- Benchmarks show reduced long tasks and improved responsiveness

## 7) Module Federation & Microfrontends (@ack/mf)

- Remote modules with versioning and isolation
- Runtime loader with safe fallbacks and error boundaries

Acceptance criteria:
- Example app loads a remote component with clear error handling path

## Risks & Open Questions

- Template sandbox design trade-offs vs developer ergonomics
- Telemetry overhead in production; sampling and privacy considerations
- Federation version compatibility and shared dependencies strategy
- Edge/Node feature divergence and conditional polyfills

## Documentation & Testing

- Add guides: security hardening, telemetry setup, edge deployment
- Example apps for each adapter/bundler
- CI checks for template diagnostics and SSR escaping
