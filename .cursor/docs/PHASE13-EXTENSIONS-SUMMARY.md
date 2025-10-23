# Phase 13 Extensions - Summary

Added to roadmap:

- Observability & Telemetry (@ack/telemetry): OpenTelemetry traces/metrics/logs across compiler, dev server, runtime, plugins; correlation IDs and OTLP exporters.
- Security & Sandboxing (@ack/security): Template sandbox, strict SSR escaping, sanitization, plugin capability model, CSP helpers.
- Bundler Abstraction (@ack/build): Unified unplugin-based core; adapters for Vite, Rspack, Rollup/Rolldown, esbuild; optional federation support.
- ACK Language Server & Template Type Checker (@ack/lsp): Diagnostics for templates; hover, go-to, completions, quick-fixes.
- Scheduler & Transitions (@ack/scheduler): Cooperative scheduler; time-slicing; interruptible transitions to reduce jank.
- Edge & Streaming SSR (@ack/edge): Adapters (Vercel/Cloudflare/Netlify/Node/Deno); streaming SSR and islands.
- Module Federation & Microfrontends (@ack/mf): Remote modules, isolation, safe runtime loader.

Matrices & metrics updated:
- Priority matrix extended with above items.
- New metrics: HMR P95 < 50ms; Edge SSR TTFB P95 < 100ms; template type-check false positives < 1%; security posture target.

Next steps:
- Create tracking issues and feature branches for each item; align CI and examples.
