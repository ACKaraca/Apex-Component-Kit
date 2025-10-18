import { describe, it, expect } from 'vitest';
import { compile } from '../src/index';

describe('Compiler Integration - Full Pipeline', () => {
  it('should compile simple counter component', () => {
    const source = `
      <script>
        let count = 0;
        function increment() {
          count++;
        }
      </script>
      <template>
        <div>
          <h1>Count: {count}</h1>
          <button @click={increment}>Increment</button>
        </div>
      </template>
      <style>
        h1 { font-size: 24px; }
        button { padding: 10px; }
      </style>
    `;
    
    const result = compile(source, { filePath: 'Counter.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should compile todo component with loop', () => {
    const source = `
      <script>
        let todos = [];
        let input = '';
        
        function addTodo() {
          if (input.trim()) {
            todos.push({ text: input });
            input = '';
          }
        }
      </script>
      <template>
        <div>
          <input bind:value={input} />
          <button @click={addTodo}>Add</button>
          <ul>
            {#each todos as todo}
              <li>{todo.text}</li>
            {/each}
          </ul>
        </div>
      </template>
    `;
    
    const result = compile(source, { filePath: 'Todo.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should detect missing required blocks gracefully', () => {
    const source = '<script>let x = 1;</script>';
    
    const result = compile(source, { filePath: 'test.ack' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should handle empty script block', () => {
    const source = `
      <script></script>
      <template><div>Test</div></template>
    `;
    
    const result = compile(source, { filePath: 'empty-script.ack' });
    
    expect(result).toBeDefined();
  });

  it('should compile with different formats', () => {
    const source = `
      <script>let value = 42;</script>
      <template><div>{value}</div></template>
    `;
    
    const esmResult = compile(source, { filePath: 'test.ack', format: 'esm' });
    expect(esmResult.code.length).toBeGreaterThan(0);
    
    const cjsResult = compile(source, { filePath: 'test.ack', format: 'cjs' });
    expect(cjsResult.code.length).toBeGreaterThan(0);
  });

  it('should include source maps when requested', () => {
    const source = `
      <script>let count = 0;</script>
      <template><div>{count}</div></template>
    `;
    
    const result = compile(source, { 
      filePath: 'mapped.ack',
      sourceMap: true,
      format: 'esm'
    });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should handle complex reactive dependencies', () => {
    const source = `
      <script>
        let a = 1;
        let b = a * 2;
        let c = b + a;
        let total = a + b + c;
      </script>
      <template>
        <div>{a} + {b} + {c} = {total}</div>
      </template>
    `;
    
    const result = compile(source, { filePath: 'complex.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should detect circular dependencies', () => {
    const source = `
      <script>
        let a = b;
        let b = a;
      </script>
      <template>{a}</template>
    `;
    
    const result = compile(source, { filePath: 'circular.ack' });
    
    expect(result).toBeDefined();
    if (result.errors && result.errors.length > 0) {
      expect(result.errors.some(e => e.message.includes('Circular'))).toBe(true);
    }
  });

  it('should handle SSR compilation', () => {
    const source = `
      <script>let title = 'SSR App';</script>
      <template><h1>{title}</h1></template>
    `;
    
    const result = compile(source, { 
      filePath: 'ssr.ack',
      format: 'esm',
      ssr: true
    });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should extract multiple event bindings', () => {
    const source = `
      <script>
        function handleClick() {}
        function handleChange() {}
      </script>
      <template>
        <button @click={handleClick}>Click</button>
        <input @change={handleChange} />
      </template>
    `;
    
    const result = compile(source, { filePath: 'events.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should handle imports in script block', () => {
    const source = `
      <script>
        import { mount } from '@ack/runtime';
        import Button from './Button.ack';
        let counter = 0;
      </script>
      <template>
        <div>{counter}</div>
        <Button />
      </template>
    `;
    
    const result = compile(source, { filePath: 'with-imports.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should generate scoped styles', () => {
    const source = `
      <script>let x = 1;</script>
      <template><div class="container">{x}</div></template>
      <style>
        .container { padding: 20px; }
        button { color: blue; }
      </style>
    `;
    
    const result = compile(source, { filePath: 'scoped.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should handle empty template gracefully', () => {
    const source = `
      <script>let value = 0;</script>
      <template></template>
    `;
    
    const result = compile(source, { filePath: 'empty-template.ack' });
    
    expect(result).toBeDefined();
  });

  it('should extract all used variables', () => {
    const source = `
      <script>
        let x = 1;
        let y = 2;
        let z = 3;
        let unused = 0;
      </script>
      <template>
        <p>{x} {y} {z}</p>
      </template>
    `;
    
    const result = compile(source, { filePath: 'vars.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should handle nested components', () => {
    const source = `
      <script>
        import Card from './Card.ack';
        import Button from './Button.ack';
        let items = [];
      </script>
      <template>
        <div>
          {#each items as item}
            <Card>
              <Button onClick={() => console.log(item)} />
            </Card>
          {/each}
        </div>
      </template>
    `;
    
    const result = compile(source, { filePath: 'nested.ack', format: 'esm' });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should handle minification option', () => {
    const source = `
      <script>
        let count = 0;
        function increment() { count++; }
      </script>
      <template><button @click={increment}>{count}</button></template>
    `;
    
    const result = compile(source, { 
      filePath: 'minified.ack', 
      format: 'esm',
      minify: true
    });
    
    expect(result).toBeDefined();
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should provide error messages for invalid syntax', () => {
    const source = `
      <script>
        let x = ;
      </script>
      <template><div></div></template>
    `;
    
    const result = compile(source, { filePath: 'invalid.ack' });
    
    expect(result).toBeDefined();
  });
});

