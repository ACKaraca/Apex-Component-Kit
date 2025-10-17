# ACK Framework - Phase 1 Implementation

**Apex Component Kit (ACK)** - Next-generation JavaScript framework.

## 🚀 Project Status

This repository implements **Phase 1: Core Compiler (@ack/compiler)** and **Runtime (@ack/runtime)** packages.

## 📁 Project Structure

```
ACKFrame/
├── packages/
│   ├── compiler/          # @ack/compiler - Compiler core
│   │   ├── src/
│   │   │   ├── parser/    # Parser components
│   │   │   ├── analyzer/  # Reactivity analysis
│   │   │   ├── codegen/   # Code generation
│   │   │   ├── types/     # TypeScript types
│   │   │   └── index.ts   # Public API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── runtime/           # @ack/runtime - Minimal runtime
│   │   ├── src/
│   │   │   ├── reactivity.ts    # Reactive system
│   │   │   ├── mount.ts         # Component mounting
│   │   │   ├── effects.ts       # Effect management
│   │   │   └── index.ts         # Public API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── kit/               # @ack/kit - Application framework (Phase 2)
│   ├── cli/               # @ack/cli - Project scaffolding (Phase 2)
│   └── vite-plugin/       # @ack/vite-plugin - Vite integration (Phase 2)
│
├── pnpm-workspace.yaml    # Monorepo structure
├── tsconfig.json          # Root TypeScript config
├── package.json           # Root package.json
└── README.md              # This file
```

## 🛠 Installation

### Requirements

- Node.js 16+
- pnpm (or npm/yarn)

### Setup

```bash
# Install dependencies
pnpm install

# Build compiler
pnpm --filter @ack/compiler run build

# Build runtime
pnpm --filter @ack/runtime run build
```

## 📦 Packages

### @ack/compiler

**Purpose**: Parse .ack files into optimized JavaScript.

**Core Classes:**
- `TokenLexer` - Tokenization
- `BlockParser` - Script/Template/Style separation
- `TemplateParser` - Template DSL parsing
- `StyleParser` - Scoped CSS processing
- `ComponentParser` - Orchestrate all parsers
- `ReactivityAnalyzer` - Reactivity analysis
- `DependencyGraph` - Dependency tracking
- `ESMGenerator` - ES6 Module output
- `CJSGenerator` - CommonJS output
- `DOMUpdateCodeGen` - DOM update code generation
- `HydrationCodeGen` - SSR hydration support

**Public API:**

```typescript
import { compile } from '@ack/compiler';

const result = compile(sourceCode, {
  format: 'esm',  // 'esm' | 'cjs' | 'both'
  minify: false,
  sourceMap: false,
  ssr: false
});

console.log(result.code);
console.log(result.errors);
```

### @ack/runtime

**Purpose**: Mount compiled components and manage reactivity.

**Core Functions:**
- `createReactive()` - Create reactive proxy
- `watch()` - Watch for changes
- `mount()` - Mount component to DOM
- `hydrate()` - Hydrate SSR HTML
- `createEffect()` - Side effects management
- `computed()` - Computed properties

**Public API:**

```typescript
import { mount, createReactive } from '@ack/runtime';

const component = MyComponent({ initialProps });
mount(component, '#app');
```

## 🎯 Development Workflow

### Test Compiler

```bash
cd packages/compiler
pnpm dev    # Watch mode
pnpm test   # Run tests
```

### Test Runtime

```bash
cd packages/runtime
pnpm dev    # Watch mode
pnpm test   # Run tests
```

## 📝 .ack Component Format

```html
<script>
  let count = 0;
  
  function increment() {
    count++;
  }
</script>

<template>
  <div class="counter">
    <h1>Count: {count}</h1>
    <button @click={increment}>Increment</button>
  </div>
</template>

<style scoped>
  .counter {
    text-align: center;
    padding: 1em;
    border-radius: 8px;
  }
  button {
    padding: 0.5em 1em;
    font-size: 1.2em;
  }
</style>
```

## 🔄 Architecture Overview

### Parse Flow

```
.ack file
    ↓
TokenLexer (tokenization)
    ↓
BlockParser (script/template/style separation)
    ↓
ComponentParser (orchestrate all parsers)
    ↓
ReactivityAnalyzer (let/var analysis)
    ↓
DependencyGraph (dependency mapping)
    ↓
ESMGenerator/CJSGenerator (code generation)
    ↓
Optimized JavaScript code
```

### Reactivity Flow

```
let count = 0      → ReactiveVariable
  ↓
Template {count} usage → Template reference analysis
  ↓
count changes → DOMUpdateCodeGen triggered
  ↓
DOM elements updated surgically
```

## 🧪 Testing Strategy

Unit and integration tests are planned for:

- Parser tests (TokenLexer, BlockParser, etc.)
- Analyzer tests (ReactivityAnalyzer, DependencyGraph)
- CodeGenerator tests (ESM, CJS output validation)
- Full pipeline integration tests

## 📚 Documentation

- **README.md** - Quick start and project overview
- **ARCHITECTURE.md** - Detailed system architecture
- **packages/compiler/README.md** - Compiler API
- **packages/runtime/README.md** - Runtime API
- **FAZ2_README.md** - Phase 2: Application Kit

## 🔮 Next Phases (Phase 2+)

**Phase 2: Application Kit (@ack/kit)**
- Vite-based dev server
- File-based routing
- Build optimization
- CLI tools

**Phase 3: Advanced Features**
- Advanced routing
- State management
- Plugin system
- Performance optimization

**Phase 4: Ecosystem**
- VSCode language tools
- Official documentation website
- Component library
- Community resources

## 📄 License

MIT

---

**Note**: This project is under active development. API and structure are subject to change.
