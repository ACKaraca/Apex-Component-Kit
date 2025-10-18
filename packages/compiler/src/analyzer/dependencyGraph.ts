/**
 * DependencyGraph - Bağımlılık grafiğini yönetir
 * Türkçe: Bu sınıf, değişkenlerin ilişkilerini bir graf yapısında temsil eder.
 */

import { ReactiveVariable, DependencyNode as DependencyNodeType } from '../types/index';

export class DependencyGraph {
  public nodes: Map<string, DependencyNodeType> = new Map();
  public edges: Map<string, string[]> = new Map();

  /**
   * Grafiği reaktif değişkenlerden oluştur.
   */
  public buildFromVariables(variables: ReactiveVariable[]): void {
    this.nodes.clear();
    this.edges.clear();

    // Node'ları oluştur
    variables.forEach((variable) => {
      this.nodes.set(variable.name, {
        name: variable.name,
        type: 'variable',
        dependencies: variable.dependencies || [],
        dependents: [],
      });
      this.edges.set(variable.name, variable.dependencies || []);
    });

    // Dependents'ları belirle
    this.nodes.forEach((node) => {
      node.dependencies.forEach((dep) => {
        const depNode = this.nodes.get(dep);
        if (depNode) {
          if (!depNode.dependents.includes(node.name)) {
            depNode.dependents.push(node.name);
          }
        }
      });
    });
  }

  /**
   * Bir değişkenin tüm bağımlılıklarını topologik sıra ile döndür.
   */
  public getTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (nodeName: string): void => {
      visited.add(nodeName);

      const node = this.nodes.get(nodeName);
      if (!node) return;

      node.dependencies.forEach((dep) => {
        if (!visited.has(dep)) {
          visit(dep);
        }
      });

      stack.push(nodeName);
    };

    this.nodes.forEach((node) => {
      if (!visited.has(node.name)) {
        visit(node.name);
      }
    });

    return stack;
  }

  /**
   * Bir değişkenin tüm dependency chain'ini döndür.
   */
  public getFullDependencyChain(nodeName: string): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const traverse = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const node = this.nodes.get(name);
      if (!node) return;

      node.dependencies.forEach((dep) => {
        traverse(dep);
      });

      if (name !== nodeName) {
        chain.push(name);
      }
    };

    traverse(nodeName);
    return chain;
  }

  /**
   * Bir değişkenin tüm dependent'larını döndür.
   */
  public getDependents(nodeName: string): string[] {
    const dependents: string[] = [];
    const visited = new Set<string>();

    const traverse = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const node = this.nodes.get(name);
      if (!node) return;

      node.dependents.forEach((dep) => {
        dependents.push(dep);
        traverse(dep);
      });
    };

    traverse(nodeName);
    return dependents;
  }

  /**
   * Değişkeni update ettiğinde etkilenen tüm değişkenleri döndür.
   */
  public getAffectedVariables(varName: string): string[] {
    const affected: string[] = [];
    const visited = new Set<string>();

    const traverse = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const node = this.nodes.get(name);
      if (!node) return;

      node.dependents.forEach((dependent) => {
        affected.push(dependent);
        traverse(dependent);
      });
    };

    traverse(varName);
    return affected;
  }

  /**
   * Bir sıralamanın topologik olup olmadığını kontrol et.
   */
  public isValidTopologicalOrder(order: string[]): boolean {
    const position = new Map<string, number>();

    order.forEach((name, index) => {
      position.set(name, index);
    });

    for (const node of this.nodes.values()) {
      const nodePos = position.get(node.name);
      if (nodePos === undefined) return false;

      for (const dep of node.dependencies) {
        const depPos = position.get(dep);
        if (depPos === undefined || depPos > nodePos) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Grafiğin reprezentasyonunu döndür.
   */
  public getRepresentation(): { nodes: DependencyNodeType[]; edges: [string, string][] } {
    const nodes = Array.from(this.nodes.values());
    const edges: [string, string][] = [];

    this.edges.forEach((deps, from) => {
      deps.forEach((to) => {
        edges.push([from, to]);
      });
    });

    return { nodes, edges };
  }

  /**
   * Node sayısını döndür.
   */
  public getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Bir node'u döndür.
   */
  public getNode(name: string): DependencyNodeType | undefined {
    return this.nodes.get(name);
  }

  /**
   * Topological sort (alias for getTopologicalOrder)
   */
  public topologicalSort(): string[] {
    return this.getTopologicalOrder();
  }

  /**
   * Grafikte döngü (cycle) olup olmadığını kontrol et
   */
  public hasCyclicDependency(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeName: string): boolean => {
      visited.add(nodeName);
      recursionStack.add(nodeName);

      const node = this.nodes.get(nodeName);
      if (!node) return false;

      for (const dep of node.dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(nodeName);
      return false;
    };

    for (const node of this.nodes.values()) {
      if (!visited.has(node.name)) {
        if (hasCycle(node.name)) {
          return true;
        }
      }
    }

    return false;
  }
}
