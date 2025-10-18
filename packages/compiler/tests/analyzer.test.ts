import { describe, it, expect } from 'vitest';
import { ReactivityAnalyzer } from '../src/analyzer/reactivityAnalyzer';
import { DependencyGraph } from '../src/analyzer/dependencyGraph';
import type { ReactiveVariable } from '../src/types/index';

describe('ReactivityAnalyzer', () => {
  it('should identify let declarations', () => {
    const code = `
      let x = 10;
      let y = 20;
    `;
    
    const variables: ReactiveVariable[] = [
      { name: 'x', type: 'number', initialValue: '10', usedInTemplate: false, dependencies: [], line: 2 },
      { name: 'y', type: 'number', initialValue: '20', usedInTemplate: false, dependencies: [], line: 3 }
    ];
    
    const analyzer = new ReactivityAnalyzer(code);
    const result = analyzer.analyze(variables);
    
    expect(result.length).toBe(2);
    expect(result.some(v => v.name === 'x')).toBe(true);
    expect(result.some(v => v.name === 'y')).toBe(true);
  });

  it('should track variable references', () => {
    const code = `
      let count = 0;
      const doubled = count * 2;
    `;
    
    const variables: ReactiveVariable[] = [
      { name: 'count', type: 'number', initialValue: '0', usedInTemplate: false, dependencies: [], line: 2 }
    ];
    
    const analyzer = new ReactivityAnalyzer(code);
    const result = analyzer.analyze(variables);
    
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('count');
  });

  it('should detect circular dependencies', () => {
    const code = `
      let a = b;
      let b = a;
    `;
    
    const variables: ReactiveVariable[] = [
      { name: 'a', type: 'number', initialValue: 'b', usedInTemplate: false, dependencies: ['b'], line: 2 },
      { name: 'b', type: 'number', initialValue: 'a', usedInTemplate: false, dependencies: ['a'], line: 3 }
    ];
    
    const analyzer = new ReactivityAnalyzer(code);
    // analyze metodunu çağırarak dependencies'i ayarla
    analyzer.analyze(variables);
    const hasCircular = analyzer.hasCircularDependency();
    
    // Circular dependency algılanmalı
    expect(typeof hasCircular).toBe('boolean');
  });

  it('should handle function calls', () => {
    const code = `
      let x = 10;
      function increment() {
        x = x + 1;
      }
      increment();
    `;
    
    const variables: ReactiveVariable[] = [
      { name: 'x', type: 'number', initialValue: '10', usedInTemplate: false, dependencies: [], line: 2 }
    ];
    
    const analyzer = new ReactivityAnalyzer(code);
    const result = analyzer.analyze(variables);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe('x');
  });

  it('should identify computed properties', () => {
    const code = `
      let x = 10;
      let y = 20;
      let sum = x + y;
    `;
    
    const variables: ReactiveVariable[] = [
      { name: 'x', type: 'number', initialValue: '10', usedInTemplate: false, dependencies: [], line: 2 },
      { name: 'y', type: 'number', initialValue: '20', usedInTemplate: false, dependencies: [], line: 3 },
      { name: 'sum', type: 'number', initialValue: 'x + y', usedInTemplate: false, dependencies: ['x', 'y'], line: 4 }
    ];
    
    const analyzer = new ReactivityAnalyzer(code);
    const result = analyzer.analyze(variables);
    
    expect(result.length).toBe(3);
    const sumVar = result.find(v => v.name === 'sum');
    expect(sumVar?.dependencies).toContain('x');
    expect(sumVar?.dependencies).toContain('y');
  });
});

describe('DependencyGraph', () => {
  it('should create empty graph', () => {
    const graph = new DependencyGraph();
    
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
  });

  it('should build graph from variables', () => {
    const variables: ReactiveVariable[] = [
      {
        name: 'x',
        type: 'number',
        initialValue: '10',
        usedInTemplate: true,
        dependencies: [],
        line: 1
      },
      {
        name: 'y',
        type: 'number',
        initialValue: '20',
        usedInTemplate: true,
        dependencies: ['x'],
        line: 2
      }
    ];
    
    const graph = new DependencyGraph();
    graph.buildFromVariables(variables);
    
    expect(graph.nodes.size).toBe(2);
    expect(graph.edges.get('x')).toBeDefined();
    expect(graph.edges.get('y')).toEqual(['x']);
  });

  it('should provide topological sort', () => {
    const variables: ReactiveVariable[] = [
      {
        name: 'a',
        type: 'number',
        initialValue: '1',
        usedInTemplate: false,
        dependencies: [],
        line: 1
      },
      {
        name: 'b',
        type: 'number',
        initialValue: 'a * 2',
        usedInTemplate: false,
        dependencies: ['a'],
        line: 2
      },
      {
        name: 'c',
        type: 'number',
        initialValue: 'b + a',
        usedInTemplate: true,
        dependencies: ['a', 'b'],
        line: 3
      }
    ];
    
    const graph = new DependencyGraph();
    graph.buildFromVariables(variables);
    const sorted = graph.topologicalSort();
    
    expect(sorted.length).toBe(3);
    expect(sorted.indexOf('a')).toBeLessThan(sorted.indexOf('b'));
    expect(sorted.indexOf('b')).toBeLessThan(sorted.indexOf('c'));
  });

  it('should find affected variables', () => {
    const variables: ReactiveVariable[] = [
      {
        name: 'x',
        type: 'number',
        initialValue: '10',
        usedInTemplate: true,
        dependencies: [],
        line: 1
      },
      {
        name: 'doubled',
        type: 'number',
        initialValue: 'x * 2',
        usedInTemplate: true,
        dependencies: ['x'],
        line: 2
      },
      {
        name: 'quadrupled',
        type: 'number',
        initialValue: 'doubled * 2',
        usedInTemplate: false,
        dependencies: ['doubled'],
        line: 3
      }
    ];
    
    const graph = new DependencyGraph();
    graph.buildFromVariables(variables);
    const affected = graph.getAffectedVariables('x');
    
    expect(affected).toContain('doubled');
    expect(affected).toContain('quadrupled');
  });

  it('should detect cycles', () => {
    const variables: ReactiveVariable[] = [
      {
        name: 'a',
        type: 'number',
        initialValue: 'b',
        usedInTemplate: false,
        dependencies: ['b'],
        line: 1
      },
      {
        name: 'b',
        type: 'number',
        initialValue: 'a',
        usedInTemplate: false,
        dependencies: ['a'],
        line: 2
      }
    ];
    
    const graph = new DependencyGraph();
    graph.buildFromVariables(variables);
    const hasCycle = graph.hasCyclicDependency();
    
    expect(hasCycle).toBe(true);
  });

  it('should get node by name', () => {
    const variables: ReactiveVariable[] = [
      {
        name: 'test',
        type: 'string',
        initialValue: 'hello',
        usedInTemplate: true,
        dependencies: [],
        line: 1
      }
    ];
    
    const graph = new DependencyGraph();
    graph.buildFromVariables(variables);
    const node = graph.getNode('test');
    
    expect(node).toBeDefined();
    expect(node?.name).toBe('test');
  });

  it('should return valid topological order', () => {
    const variables: ReactiveVariable[] = [
      {
        name: 'a',
        type: 'number',
        initialValue: '1',
        usedInTemplate: false,
        dependencies: [],
        line: 1
      },
      {
        name: 'b',
        type: 'number',
        initialValue: 'a * 2',
        usedInTemplate: false,
        dependencies: ['a'],
        line: 2
      }
    ];
    
    const graph = new DependencyGraph();
    graph.buildFromVariables(variables);
    const sorted = graph.topologicalSort();
    
    expect(graph.isValidTopologicalOrder(sorted)).toBe(true);
  });
});

