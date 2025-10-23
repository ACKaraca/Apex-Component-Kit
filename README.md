# ACK Framework - Phase 1 Implementation

**Apex Component Kit (ACK)** - Next-generation JavaScript framework.

## 🚀 Get Started

To get started with the ACK Framework, you can use the CLI to create a new project.

### 🛠 Installation

First, make sure you have Node.js 16+ and pnpm installed. Then, you can create a new ACK project using the following command:

```bash
pnpm create ack-app my-ack-app
```

This will create a new directory called `my-ack-app` with a basic ACK project setup.

### 🏃‍♀️ Running the Development Server

To start the development server, navigate to your new project directory and run the following command:

```bash
cd my-ack-app
pnpm dev
```

This will start a Vite-based development server with Hot Module Replacement (HMR) enabled.

### 📦 Building for Production

To build your ACK application for production, run the following command:

```bash
pnpm build
```

This will create a `dist` directory with the optimized and bundled application.

## API Reference

The ACK Framework is composed of several packages, each with its own API.

- **`@ack/compiler`**: The compiler for `.ack` files.
- **`@ack/runtime`**: The runtime for ACK components.
- **`@ack/kit`**: A set of tools for building ACK applications.
- **`@ack/cli`**: The command-line interface for the ACK Framework.
- **`@ack/vite-plugin`**: The Vite plugin for `.ack` files.

## Examples

You can find examples of ACK components in the `packages/cli/src/create.ts` file. These examples demonstrate how to create a counter, a to-do list, and a blank project.

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

Unit and integration tests are **now implemented** for:

- ✅ Parser tests (TokenLexer, BlockParser, TemplateParser, StyleParser, ComponentParser)
- ✅ Analyzer tests (ReactivityAnalyzer, DependencyGraph)
- ✅ Full pipeline integration tests (55+ test cases)

### Running Tests

```bash
# All tests
pnpm --filter @ack/compiler test

# Watch mode
pnpm --filter @ack/compiler test:watch
```

**Test Coverage:**
- 12 Analyzer Tests
- 26 Parser Tests
- 17 Integration Tests
- **Total: 55+ test cases**

See `packages/compiler/README.md#🧪-test-çalıştırma` for detailed test documentation.

## 📚 Documentation

- **README.md** - Quick start and project overview
- **ARCHITECTURE.md** - Detailed system architecture
- **packages/compiler/README.md** - Compiler API
- **packages/runtime/README.md** - Runtime API

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
