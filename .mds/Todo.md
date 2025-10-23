# ACK Framework - Phase 13 Execution Tracker (EARS)

Date: 2025-10-23
Owner: Core Team
Status: Planned → In Progress

## R-1 Edge & Streaming SSR (@ack/edge)
- Event: A user deploys an ACK app to an Edge provider
- Action: Build uses the Edge adapter to emit streaming SSR output with islands
- Response: The app streams HTML progressively and hydrates only islands on the client
- Scope/Acceptance:
  - Vercel + Cloudflare Workers demo projects build and run
  - TTFB P95 < 100ms measured in example deployment
  - Islands manifest is generated and consumed by the client

## R-2 Observability & Telemetry (@ack/telemetry)
- Event: Developer triggers rebuild/HMR, navigates routes, and performs API calls
- Action: Telemetry emits spans/metrics/logs correlating these events
- Response: A single trace links compiler→HMR apply→router update→effect flush
- Scope/Acceptance:
  - OTLP endpoint receives traces and metrics in demo env
  - Correlation IDs propagate across layers
  - Overhead stays < 2% in benchmarks

## R-3 Security & Sandboxing (@ack/security)
- Event: Untrusted template expression and user content rendered via SSR
- Action: Engine applies sandbox rules and escape-by-default rendering
- Response: No XSS, dangerous URLs sanitized, plugins limited by capabilities
- Scope/Acceptance:
  - Security tests cover attribute/URL sanitization and HTML escaping
  - Plugin capabilities documented; CSP helpers available

## R-4 Bundler Abstraction (@ack/build)
- Event: Project builds under different bundlers (Vite, Rspack, Rollup/Rolldown, esbuild)
- Action: Unified transform pipeline compiles .ack consistently
- Response: Same app compiles and HMR works (where supported)
- Scope/Acceptance:
  - Demo projects for Vite and Rspack pass build + dev
  - Shared cache and HMR hook mapping validated

## R-5 Language Server & Template Type Checker (@ack/lsp)
- Event: Developer edits template bindings/slots/events
- Action: LSP reports precise diagnostics and offers quick-fixes
- Response: CI fails on invalid bindings; IDE shows hover and go-to
- Scope/Acceptance:
  - VSCode demo validates diagnostics and quick-fixes
  - Template false positives < 1% over smoke suite

## R-6 Scheduler & Transitions (@ack/scheduler)
- Event: Large UI updates and background computations occur
- Action: Scheduler time-slices work; transitions keep input responsive
- Response: Reduced long tasks; smoother interactions
- Scope/Acceptance:
  - Benchmarks show reduced jank vs baseline
  - Input latency remains P95 < 50ms under load

## R-7 Module Federation & Microfrontends (@ack/mf)
- Event: Host loads a remote component with version constraints
- Action: Loader fetches remote safely with fallback paths
- Response: Component renders or gracefully degrades with error boundary
- Scope/Acceptance:
  - Demo host app loads a remote within same major version
  - Clear error surface and fallback behavior

## Milestones & Dependencies
- M1 (Telemetry baseline) → unlocks perf/regression tracking for other tasks
- M2 (Security hardening) → required before public alpha of islands/edge
- M3 (Bundler abstraction) → required for ecosystem examples

## Deliverables
- Guides: edge deployment, telemetry setup, security hardening
- Example repos for bundlers and edge platforms
- CI checks for template diagnostics and SSR escaping
