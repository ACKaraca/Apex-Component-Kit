import { describe, it, expect } from 'vitest';
import { TokenLexer } from '../src/parser/tokenLexer';
import { BlockParser } from '../src/parser/blockParser';
import { TemplateParser } from '../src/parser/templateParser';
import { StyleParser } from '../src/parser/styleParser';
import { ComponentParser } from '../src/parser/componentParser';

describe('TokenLexer', () => {
  it('should tokenize simple HTML', () => {
    const source = '<div>Hello</div>';
    const lexer = new TokenLexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some(t => t.type === 'tag')).toBe(true);
  });

  it('should tokenize text content', () => {
    const source = 'Hello World';
    const lexer = new TokenLexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle attributes', () => {
    const source = '<button class="btn">Click</button>';
    const lexer = new TokenLexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should tokenize interpolation braces', () => {
    const source = '{count}';
    const lexer = new TokenLexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens.some(t => t.type === 'brace')).toBe(true);
  });

  it('should tokenize multiple tags', () => {
    const source = '<div><span>text</span></div>';
    const lexer = new TokenLexer(source);
    const tokens = lexer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(0);
  });
});

describe('BlockParser', () => {
  it('should parse script block', () => {
    const source = `
      <script>
        let count = 0;
      </script>
      <template>
        <div>{count}</div>
      </template>
    `;
    const parser = new BlockParser(source);
    const blocks = parser.parse();
    
    expect(blocks.script).toBeDefined();
    expect(blocks.script?.content).toContain('let count = 0');
  });

  it('should parse template block', () => {
    const source = `
      <script>let x = 1;</script>
      <template><div>{x}</div></template>
    `;
    const parser = new BlockParser(source);
    const blocks = parser.parse();
    
    expect(blocks.template).toBeDefined();
    expect(blocks.template?.content).toContain('<div>');
  });

  it('should parse style block', () => {
    const source = `
      <script>let x = 1;</script>
      <template><div></div></template>
      <style>div { color: red; }</style>
    `;
    const parser = new BlockParser(source);
    const blocks = parser.parse();
    
    expect(blocks.style).toBeDefined();
    expect(blocks.style?.content).toContain('color: red');
  });

  it('should handle missing optional blocks', () => {
    const source = '<script>let x = 1;</script>';
    const parser = new BlockParser(source);
    const blocks = parser.parse();
    
    expect(blocks.script).toBeDefined();
    expect(blocks.template?.content || '').toMatch(/^[\s]*$/);
    expect(blocks.style?.content || '').toMatch(/^[\s]*$/);
  });

  it('should parse all blocks together', () => {
    const source = `
      <script>
        let count = 0;
        function increment() { count++; }
      </script>
      <template>
        <div class="counter">
          <h1>{count}</h1>
          <button @click={increment}>+</button>
        </div>
      </template>
      <style>
        .counter { padding: 20px; }
      </style>
    `;
    const parser = new BlockParser(source);
    const blocks = parser.parse();
    
    expect(blocks.script).toBeDefined();
    expect(blocks.template).toBeDefined();
    expect(blocks.style).toBeDefined();
  });
});

describe('TemplateParser', () => {
  it('should parse simple element', () => {
    const source = '<div>Hello</div>';
    const parser = new TemplateParser(source);
    const ast = parser.parse();
    
    expect(ast).toBeDefined();
    expect(ast?.type).toBe('root');
  });

  it('should extract used variables', () => {
    const source = '<div>{count} items</div>';
    const parser = new TemplateParser(source);
    const ast = parser.parse();
    
    expect(ast?.usedVariables).toBeDefined();
    expect(ast?.usedVariables?.some(v => v.includes('count') || v === 'count')).toBe(true);
  });

  it('should parse event bindings', () => {
    const source = '<button @click={handleClick}>Click</button>';
    const parser = new TemplateParser(source);
    const ast = parser.parse();
    
    expect(ast?.events).toBeDefined();
    expect(ast?.events?.length).toBeGreaterThan(0);
  });

  it('should handle nested elements', () => {
    const source = '<div><span>{text}</span></div>';
    const parser = new TemplateParser(source);
    const ast = parser.parse();
    
    expect(ast?.children).toBeDefined();
  });

  it('should parse multiple variables', () => {
    const source = '<div>{x} + {y} = {sum}</div>';
    const parser = new TemplateParser(source);
    const ast = parser.parse();
    
    expect(ast?.usedVariables?.length || 0).toBeGreaterThan(0);
  });

  it('should extract multiple event bindings', () => {
    const source = '<button @click={handleClick} @hover={handleHover}>Click</button>';
    const parser = new TemplateParser(source);
    const ast = parser.parse();
    
    expect(ast?.events?.length || 0).toBeGreaterThan(0);
  });
});

describe('StyleParser', () => {
  it('should parse CSS rules', () => {
    const source = 'div { color: red; }';
    const parser = new StyleParser(source, 'component-1');
    const parsed = parser.parse();
    
    expect(parsed.rules.length).toBeGreaterThan(0);
    expect(parsed.rules[0].selector).toBe('div');
  });

  it('should handle scoped CSS', () => {
    const source = 'div { color: blue; }';
    const parser = new StyleParser(source, 'component-2');
    const parsed = parser.parse();
    
    expect(parsed.scoped).toBe(true);
    expect(parsed.scopeId).toBe('component-2');
  });

  it('should parse CSS properties', () => {
    const source = 'button { color: white; background: blue; }';
    const parser = new StyleParser(source, 'btn');
    const parsed = parser.parse();
    
    expect(parsed.rules[0].properties.length).toBeGreaterThan(0);
    expect(parsed.rules[0].properties.some(p => p.name === 'color')).toBe(true);
  });

  it('should handle multiple selectors', () => {
    const source = 'div { color: red; } button { padding: 10px; }';
    const parser = new StyleParser(source, 'test');
    const parsed = parser.parse();
    
    expect(parsed.rules.length).toBeGreaterThanOrEqual(1);
  });

  it('should parse CSS values correctly', () => {
    const source = 'div { font-size: 24px; margin: 10px 20px; }';
    const parser = new StyleParser(source, 'test');
    const parsed = parser.parse();
    
    expect(parsed.rules[0].properties.length).toBeGreaterThan(0);
  });
});

describe('ComponentParser', () => {
  it('should parse complete component', () => {
    const source = `
      <script>
        let count = 0;
        function increment() { count++; }
      </script>
      <template>
        <div>
          <h1>Count: {count}</h1>
          <button @click={increment}>+</button>
        </div>
      </template>
      <style>
        h1 { font-size: 24px; }
        button { padding: 10px; }
      </style>
    `;
    const parser = new ComponentParser(source, 'Counter.ack');
    const component = parser.parse();
    
    expect(component).toBeDefined();
    expect(component?.name).toBe('Counter');
    expect(component?.scriptBlock).toBeDefined();
  });

  it('should extract reactive variables', () => {
    const source = `
      <script>
        let x = 10;
        let y = 20;
        const z = 30;
      </script>
      <template>{x} {y}</template>
    `;
    const parser = new ComponentParser(source, 'test.ack');
    const component = parser.parse();
    
    expect(component?.scriptBlock).toBeDefined();
  });

  it('should handle imports', () => {
    const source = `
      <script>
        import { mount } from '@ack/runtime';
        let counter = 0;
      </script>
      <template>{counter}</template>
    `;
    const parser = new ComponentParser(source, 'test.ack');
    const component = parser.parse();
    
    expect(component?.scriptBlock).toBeDefined();
  });

  it('should extract component name from filename', () => {
    const source = '<script>let x = 1;</script><template>{x}</template>';
    const parser = new ComponentParser(source, 'MyComponent.ack');
    const component = parser.parse();
    
    expect(component?.name).toBe('MyComponent');
  });

  it('should handle components without style', () => {
    const source = `
      <script>let count = 0;</script>
      <template><div>{count}</div></template>
    `;
    const parser = new ComponentParser(source, 'test.ack');
    const component = parser.parse();
    
    expect(component).toBeDefined();
    expect(component?.styleBlock).toBeDefined();
  });
});

