# @ack/compiler

**ACK Core Compiler** - .ack bileşenlerini optimize edilmiş JavaScript'e dönüştürür.

## 📦 Kurulum

```bash
npm install @ack/compiler
# or
pnpm add @ack/compiler
```

## 🚀 Hızlı Kullanım

```typescript
import { compile } from '@ack/compiler';

const ackSource = `
<script>
  let count = 0;
  
  function increment() {
    count++;
  }
</script>

<template>
  <div class="counter">
    <h1>{count}</h1>
    <button @click={increment}>Artır</button>
  </div>
</template>

<style scoped>
  .counter { text-align: center; padding: 1em; }
</style>
`;

const result = compile(ackSource, {
  filePath: 'Counter.ack',
  format: 'esm',
  ssr: false
});

console.log(result.code);
console.log(result.errors);
```

## 📝 API

### compile(source, options)

Main compiler fonksiyonu.

**Parametreler:**
- `source: string` - .ack dosyası içeriği
- `options: CompileOptions` (optional)
  - `filePath?: string` - Dosya yolu (error reporting için)
  - `format?: 'esm' | 'cjs' | 'both'` - Çıktı formatı (default: 'esm')
  - `minify?: boolean` - Kodu minify et (default: false)
  - `sourceMap?: boolean` - Source map oluştur (default: false)
  - `ssr?: boolean` - SSR hydration kodu ekle (default: false)

**Dönüş:**
```typescript
interface CompileResult {
  code: string;           // Üretilen JavaScript kodu
  map?: string;          // Source map (if requested)
  ast?: any;             // AST (if requested)
  errors: CompileError[]; // Compilation errors
  warnings: CompileWarning[]; // Warnings
}
```

### Parser Classes

#### ComponentParser

```typescript
import { ComponentParser } from '@ack/compiler';

const parser = new ComponentParser(source, filePath, componentName);
const model = parser.parse();
```

**Çıktı:**
```typescript
interface ComponentModel {
  name: string;
  scriptBlock: ScriptBlock;
  templateBlock: TemplateBlock;
  styleBlock: StyleBlock;
  source: string;
  filePath: string;
}
```

#### TemplateParser

```typescript
import { TemplateParser } from '@ack/compiler';

const parser = new TemplateParser(templateHTML);
const ast = parser.parse();
// ast.usedVariables → ['count', 'name']
// ast.events → [{ element: 'button', type: 'click', handler: 'increment' }]
```

#### StyleParser

```typescript
import { StyleParser } from '@ack/compiler';

const parser = new StyleParser(cssContent);
const parsed = parser.parse(scoped = true);
// parsed.scopeId → 'ack-abc123'
// parsed.rules → [...] with scoped selectors
```

### Analyzer Classes

#### ReactivityAnalyzer

```typescript
import { ReactivityAnalyzer } from '@ack/compiler';

const analyzer = new ReactivityAnalyzer(scriptContent);
const variables = analyzer.analyze(reactiveVariables);

// Check for circular dependencies
if (analyzer.hasCircularDependency()) {
  console.error('Circular dependency detected!');
}
```

#### DependencyGraph

```typescript
import { DependencyGraph } from '@ack/compiler';

const graph = new DependencyGraph();
graph.buildFromVariables(variables);

// Get topological order for updates
const order = graph.getTopologicalOrder();

// Get all affected variables
const affected = graph.getAffectedVariables('count');
```

### Code Generators

#### ESMGenerator

```typescript
import { ESMGenerator } from '@ack/compiler';

const gen = new ESMGenerator(component, {
  format: 'esm',
  minify: false,
  ssr: false
});

const code = gen.generate();
const styles = gen.generateStyles();
```

#### CJSGenerator

```typescript
import { CJSGenerator } from '@ack/compiler';

const gen = new CJSGenerator(component);
const code = gen.generate();
```

## 🏗️ .ack Bileşen Formatı

### Genel Yapı

```html
<script>
  // JavaScript kodu
  let state = 'initial';
</script>

<template>
  <!-- HTML şablonu -->
  <div>{state}</div>
</template>

<style scoped>
  /* CSS - otomatik scoped */
  div { color: blue; }
</style>
```

### Script Bloku

- `let` ve `var` deklarasyonları reaktif
- Import statement'ları desteklenir
- Regular JavaScript fonksiyonları yazılabilir

```javascript
<script>
  import { helper } from 'utils';
  
  let count = 0;
  let name = 'Counter';
  
  function increment() {
    count++;
  }
</script>
```

### Template Bloku

- HTML elemanları
- `{variable}` interpolasyonları
- `@event={handler}` event bindingleri
- Öznitelik bindingleri

```html
<template>
  <div class="app">
    <h1>Count: {count}</h1>
    <p>Name: {name}</p>
    <button @click={increment} data-test="btn">Click me</button>
  </div>
</template>
```

### Style Bloku

- Regular CSS
- Otomatik scoping
- Nested selectors desteklenir

```css
<style scoped>
  .app {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .app h1 {
    color: #333;
  }
</style>
```

## ✅ Supported Features

- ✅ Reaktif değişkenler (let, var)
- ✅ Event bindingleri (@click, @input, vb.)
- ✅ Template interpolasyonları ({variable})
- ✅ Scoped CSS
- ✅ Import/export
- ✅ Circular dependency detection
- ✅ ES6 Module + CommonJS çıktı
- ✅ SSR hydration

## 🚫 Limitations (Faz 1)

- ❌ Computed properties (Faz 2)
- ❌ Async components (Faz 2)
- ❌ Component composition (Faz 2)
- ❌ Router integration (Faz 3)
- ❌ State management (Faz 3)

## 📚 Örnek: Tam Bileşen

**Counter.ack:**
```html
<script>
  let count = 0;
  let step = 1;
  
  function increment() {
    count += step;
  }
  
  function decrement() {
    count -= step;
  }
  
  function reset() {
    count = 0;
  }
</script>

<template>
  <div class="counter">
    <h2>Sayaç Uygulaması</h2>
    <div class="display">{count}</div>
    <div class="controls">
      <button @click={decrement}>−</button>
      <button @click={increment}>+</button>
      <button @click={reset}>Sıfırla</button>
    </div>
  </div>
</template>

<style scoped>
  .counter {
    max-width: 300px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: center;
  }
  
  .display {
    font-size: 48px;
    font-weight: bold;
    margin: 20px 0;
    color: #333;
  }
  
  .controls {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    transition: background 0.3s;
  }
  
  button:hover {
    background: #0056b3;
  }
</style>
```

**Compile:**
```typescript
const result = compile(fs.readFileSync('Counter.ack', 'utf-8'), {
  filePath: 'Counter.ack',
  format: 'esm'
});

fs.writeFileSync('Counter.js', result.code);
```

## 🔍 Error Handling

```typescript
const result = compile(badSource);

if (result.errors.length > 0) {
  result.errors.forEach(error => {
    console.error(`Line ${error.line}: ${error.message}`);
  });
}
```

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi için bkz: [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

**Version**: 0.0.1  
**License**: MIT
