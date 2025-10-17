# ACK Framework - Detailed Architecture Documentation

## 📐 System Architecture

### High-Level Flow

```
Developer (writes code)
        ↓
    .ack file
        ↓
  @ack/compiler
    ├─ Parser → ComponentModel
    ├─ Analyzer → Reactivity Analysis
    └─ CodeGen → JavaScript code
        ↓
Optimized JS, CSS, HTML
        ↓
  @ack/runtime
    ├─ Reactivity System
    ├─ DOM Mounting
    └─ Effect Management
        ↓
Running component in browser
```

## 🔷 Compiler Architecture (@ack/compiler)

### 1. Parser Layer

#### TokenLexer
- **Purpose**: Text → Token stream
- **Output**: Token[]
- **Example**:
  ```
  "<script>let x = 0;</script>"
  ↓
  [
    {type: 'tagOpen', value: 'script', ...},
    {type: 'identifier', value: 'let', ...},
    ...
  ]
  ```

#### BlockParser
- **Purpose**: HTML structure → <script>, <template>, <style> blocks
- **Output**: ParsedBlocks {script, template, style}
- **Method**: Regex-based extraction

#### TemplateParser
- **Purpose**: Template HTML → AST + Variable references
- **Output**: TemplateAST
- **Handles**:
  - HTML element parsing
  - `{variableName}` interpolations
  - `@event={handler}` event bindings
  - Attribute parsing

#### StyleParser
- **Purpose**: CSS rules → ParsedStyle (scoped CSS)
- **Output**: ParsedStyle { content, scoped, scopeId, rules }
- **Scoping**: Using `[ack-xxxxx]` attribute selector

#### ComponentParser
- **Purpose**: Orchestrate all parsers
- **Output**: ComponentModel
- **Process**:
  1. BlockParser to separate blocks
  2. Parse let/var declarations
  3. Parse template
  4. Process CSS

### 2. Analyzer Layer

#### ReactivityAnalyzer
- **Purpose**: Identify reactive variables and track references
- **Output**: ReactiveVariable[] with dependencies
- **Algorithm**:
  ```
  1. Find let/var declarations in script
  2. Search for usages in template
  3. Resolve dependencies
  4. Check for circular dependencies
  ```

#### DependencyGraph
- **Purpose**: Represent variable relationships as graph
- **Data Structure**:
  ```
  nodes: Map<varName, DependencyNode>
  edges: Map<varName, dependencies[]>
  ```
- **Operations**:
  - `getTopologicalOrder()` - Update order
  - `getAffectedVariables()` - Cascade updates
  - `getFullDependencyChain()` - All dependencies

### 3. CodeGenerator Layer

#### ESMGenerator
- **Purpose**: ComponentModel → ES6 Module format JavaScript
- **Output**: JavaScript code
- **Structure**:
  ```javascript
  import { mount, createReactive } from '@ack/runtime';
  
  export default function Counter(props) {
    let count = 0;
    const reactive = createReactive({ count });
    
    const element = document.createElement('div');
    element.innerHTML = `<h1>Count: {count}</h1>...`;
    
    return {
      element,
      mount(target) { ackMount(this, target); },
      destroy() { element?.remove(); }
    };
  }
  ```

#### CJSGenerator
- **Purpose**: CommonJS format code
- Same as ESMGenerator, just different import/export syntax

#### DOMUpdateCodeGen
- **Purpose**: Generate DOM update code on reactive change
- **Output**: Handler functions
- **Principle**: Surgical DOM updates - update only changed parts
- **Example**:
  ```javascript
  domUpdateHandlers.set('count', (newValue) => {
    const elements = element.querySelectorAll('[data-variable="count"]');
    elements.forEach(el => { el.textContent = newValue; });
  });
  ```

#### HydrationCodeGen
- **Purpose**: Server-rendered HTML → Client hydration
- **Process**:
  1. Extract state from `[data-ack-state]` script tag
  2. Instantiate component with state
  3. Restore event listeners
  4. Make DOM interactive

## 🔶 Runtime Architecture (@ack/runtime)

### 1. Reactivity System

#### createReactive()
- **Purpose**: JavaScript object → Reactive proxy
- **Mechanism**: ES6 Proxy
- **Features**:
  ```javascript
  const reactive = createReactive({ count: 0 });
  reactive.count = 1;  // Automatically triggers watchers
  ```

#### watch()
- **Purpose**: Listen for changes
- **Usage**:
  ```javascript
  const unwatch = watch(reactive, 'count', (newVal, oldVal) => {
    console.log(`count changed: ${oldVal} → ${newVal}`);
  });
  ```

### 2. DOM Mounting

#### mount()
- **Purpose**: Attach component to DOM
- **Process**:
  1. Resolve target selector
  2. Append component.element to target
  3. Return element

#### unmount()
- **Purpose**: Remove component and cleanup
- **Steps**:
  1. Remove element from DOM
  2. Call destroy hook
  3. Clean up watchers

#### hydrate()
- **Purpose**: Hydrate SSR HTML
- **SSR State Pattern**:
  ```html
  <div id="app" ack-xxxxx><!-- Server rendered HTML --></div>
  <script data-ack-state type="application/json">
    {"count": 0, ...}
  </script>
  ```

### 3. Effect Management

#### createEffect()
- **Purpose**: Manage side effects (setup/cleanup)
- **Usage**:
  ```javascript
  createEffect(() => {
    console.log('Component mounted');
    
    return () => {
      console.log('Component destroyed');
    };
  });
  ```

#### Computed<T>
- **Purpose**: Memoized computed properties
- **Lazy evaluation** - calculated until accessed
- **Dirty tracking** - recalculate on change

#### EffectManager
- **Purpose**: Manage multiple effects
- **API**:
  ```javascript
  const manager = new EffectManager();
  manager.add('effect1', callback);
  manager.remove('effect1');
  manager.clear(); // Remove all
  ```

## 🔄 Data Flows

### Parse Flow

```
Input: .ack file content
  ↓
TokenLexer.tokenize()
  ↓ Token[]
BlockParser.parse()
  ↓ ParsedBlocks { script, template, style }
ComponentParser.parse()
  ↓ ComponentModel
  ├─ scriptBlock (ReactiveVariable[], ImportStatement[])
  ├─ templateBlock (usedVariables[], events[])
  └─ styleBlock (scopeId, rules[])
```

### Analysis Flow

```
ComponentModel.scriptBlock.reactiveVariables
  ↓
ReactivityAnalyzer.analyze()
  ↓ Enhanced ReactiveVariable[] (with dependencies)
DependencyGraph.buildFromVariables()
  ↓ Directed Graph
  └─ nodes, edges, topological sort possible
```

### Code Generation Flow

```
ComponentModel + DependencyGraph
  ↓
ESMGenerator (or CJSGenerator)
  ├─ generateImports()
  ├─ generateReactiveSetup()
  ├─ generateHTMLTemplate()
  ├─ generateEventHandlers()
  └─ generateComponentExport()
  ↓
JavaScript code (ESM format)
```

### Runtime Flow

```
User Action (e.g., button click)
    ↓
Variable Update (e.g., count++)
    ↓
Proxy Setter Triggered
    ↓
Watcher Callbacks Executed
    ↓
DOM Update Handler Called
    ↓
Element's Content Updated
    ↓
Browser Renders
```

## 🎯 Design Principles

### 1. No Virtual DOM - Direct DOM Manipulation

**Why**: Simpler, faster, less memory

**How**: Compiler generates exact selectors and update operations at compile time

### 2. Zero Runtime Framework

**Goal**: Minimal runtime - important logic in compiled code

**Benefit**: Small bundle size, fast boot

### 3. Reactivity via JavaScript Assignment

**Simplicity**: `count++` automatically triggers UI update

**Implementation**: ES6 Proxy + Compiler code generation

### 4. Scoped CSS by Default

**Isolation**: No style clashes

**Mechanism**: Unique attribute selector (e.g., `[ack-abc123]`)

### 5. Type-Safe Compiler

**Full Strict TypeScript**: Compile-time safety guarantee

**Benefit**: Fewer errors in large projects

## 📊 Performance Considerations

### Compiler

- **Tokenization**: O(n) - linear scan
- **Parsing**: O(n) - single pass
- **Analysis**: O(n + e) - graph traversal
- **Code generation**: O(n) - string building

### Runtime

- **Reactivity**: O(1) Proxy operations
- **DOM updates**: O(k) where k = affected elements
- **Effect tracking**: O(1) per effect

### Optimization Opportunities

1. **Memoization**: Parser output cache
2. **Tree shaking**: Unused variable elimination
3. **Code splitting**: Component-level lazy loading
4. **Incremental hydration**: Progressive enhancement

## 🔐 Security

### XSS Prevention

- Template interpolations → escape
- Attribute bindings → validation
- User input handling → sanitize

### Dependency Security

- Minimal runtime dependencies
- Parser libraries (Babel, Acorn) well-maintained
- Regular security audits

## 📚 Type Safety

### Strict TypeScript Configuration

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### Export Constraints

- Public API fully typed
- Internal types isolated
- Type narrowing enforced

## 🔗 Dependencies

### @ack/compiler

- `@babel/parser` - ES6+ parsing
- `@babel/traverse` - AST traversal
- `@babel/types` - Type definitions
- `acorn` - Lightweight parser
- `postcss` - CSS transformation
- `posthtml` - HTML transformation

### @ack/runtime

- **Zero production dependencies** - Pure JavaScript

## 📈 Scalability

### Monorepo Strategy

- Clear package boundaries
- Independent versioning
- Shared types via npm
- Easy integration

### Future Packages

- `@ack/kit` - Full framework
- `@ack/cli` - Scaffolding
- `@ack/vite-plugin` - Dev server
- `@ack/language-tools` - IDE support

---

**Version**: 0.0.1  
**Last Updated**: October 2025
