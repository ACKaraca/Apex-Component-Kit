/**
 * ReactivityAnalyzer - Reaktivite analizini gerçekleştirir
 * Türkçe: Bu sınıf, let/var atamalarını ve onların referanslarını izler.
 */

import { ReactiveVariable } from '../types/index';

export interface VariableReference {
  name: string;
  line: number;
  column: number;
  context: string; // assignment | read | function_call
}

export class ReactivityAnalyzer {
  private source: string;
  private variables: Map<string, ReactiveVariable> = new Map();
  private references: VariableReference[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Reaktivite analizini gerçekleştir.
   */
  public analyze(reactiveVariables: ReactiveVariable[]): ReactiveVariable[] {
    this.variables.clear();
    this.references = [];

    // Değişkenleri map'e koy
    reactiveVariables.forEach((v) => {
      this.variables.set(v.name, { ...v });
    });

    // Referansları bul
    this.findReferences();

    // Bağımlılıkları belirle
    this.resolveDependencies();

    return Array.from(this.variables.values());
  }

  /**
   * Değişken referanslarını bul.
   */
  private findReferences(): void {
    const lines = this.source.split('\n');
    const variableNames = Array.from(this.variables.keys());

    lines.forEach((line, lineIndex) => {
      // Her satırda değişkenlerin referanslarını ara
      variableNames.forEach((varName) => {
        // Basit regex ile variable referanslarını bul
        // (değişken tanımlanması hariç)
        const regex = new RegExp(`(?<!let\\s)(?<!var\\s)${varName}(?![a-zA-Z0-9_$])`, 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
          // Assignment (=) için kontrol et
          const isAssignment = line[match.index + varName.length] === '=' && 
                               line[match.index + varName.length + 1] !== '=';

          this.references.push({
            name: varName,
            line: lineIndex + 1,
            column: match.index,
            context: isAssignment ? 'assignment' : 'read',
          });

          // Bu değişkenin kullanıldığını işaretle
          const variable = this.variables.get(varName);
          if (variable) {
            variable.usedInTemplate = true;
          }
        }
      });
    });
  }

  /**
   * Değişken bağımlılıklarını çöz.
   */
  private resolveDependencies(): void {
    this.variables.forEach((variable) => {
      const dependencies: Set<string> = new Set();

      // İnitial value'daki bağımlılıkları bul
      this.extractDependenciesFromExpression(variable.initialValue).forEach((dep) => {
        dependencies.add(dep);
      });

      variable.dependencies = Array.from(dependencies);
    });
  }

  /**
   * Bir expression'dan bağımlılıkları ayıkla.
   */
  private extractDependenciesFromExpression(expression: string): string[] {
    const variableNames = Array.from(this.variables.keys());
    const dependencies: string[] = [];

    variableNames.forEach((varName) => {
      if (expression.includes(varName)) {
        dependencies.push(varName);
      }
    });

    return dependencies;
  }

  /**
   * Tüm referansları döndür.
   */
  public getReferences(): VariableReference[] {
    return this.references;
  }

  /**
   * Bir değişkenin tüm referanslarını döndür.
   */
  public getVariableReferences(varName: string): VariableReference[] {
    return this.references.filter((ref) => ref.name === varName);
  }

  /**
   * Kullanılmayan değişkenleri döndür.
   */
  public getUnusedVariables(): ReactiveVariable[] {
    return Array.from(this.variables.values()).filter((v) => !v.usedInTemplate);
  }

  /**
   * Circular dependency kontrol et.
   */
  public hasCircularDependency(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const visit = (varName: string): boolean => {
      visited.add(varName);
      recursionStack.add(varName);

      const variable = this.variables.get(varName);
      if (!variable) return false;

      for (const dep of variable.dependencies) {
        if (!visited.has(dep)) {
          if (this.visit(dep, visited, recursionStack)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(varName);
      return false;
    };

    for (const varName of this.variables.keys()) {
      if (!visited.has(varName)) {
        if (visit(varName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * DFS helper function.
   */
  private visit(
    varName: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(varName);
    recursionStack.add(varName);

    const variable = this.variables.get(varName);
    if (!variable) return false;

    for (const dep of variable.dependencies) {
      if (!visited.has(dep)) {
        if (this.visit(dep, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }

    recursionStack.delete(varName);
    return false;
  }
}
