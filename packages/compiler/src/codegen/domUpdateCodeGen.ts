/**
 * DOMUpdateCodeGen - DOM güncellemesi kodunu üretir
 * Türkçe: Bu sınıf, bir değişken değiştiğinde DOM'un hangi bölümünü güncellenmesi gerektiğini belirleyen kodu üretir.
 */

import { ComponentModel, ReactiveVariable } from '../types/index';
import { DependencyGraph } from '../analyzer/dependencyGraph';

export interface DOMUpdateInstruction {
  varName: string;
  selector: string;
  operation: 'textContent' | 'innerHTML' | 'attribute' | 'class' | 'style';
  value: string;
}

export class DOMUpdateCodeGen {
  private component: ComponentModel;
  private dependencyGraph: DependencyGraph;
  private updateInstructions: DOMUpdateInstruction[] = [];

  constructor(component: ComponentModel, depGraph: DependencyGraph) {
    this.component = component;
    this.dependencyGraph = depGraph;
    this.analyzeUpdates();
  }

  /**
   * Güncellemeleri analiz et.
   */
  private analyzeUpdates(): void {
    // Template'de kullanılan değişkenleri bul
    this.component.templateBlock.usedVariables.forEach((varName) => {
      // Basit DOM update instruction'ları oluştur
      this.updateInstructions.push({
        varName,
        selector: `[data-variable="${varName}"]`,
        operation: 'textContent',
        value: varName,
      });
    });
  }

  /**
   * DOM update kodunu üret.
   */
  public generate(): string {
    let code = '';

    code += '// DOM Update handlers\n';
    code += 'const domUpdateHandlers = new Map();\n\n';

    this.component.scriptBlock.reactiveVariables.forEach((variable) => {
      code += this.generateUpdateHandler(variable);
    });

    return code;
  }

  /**
   * Bir değişken için update handler'ı üret.
   */
  private generateUpdateHandler(variable: ReactiveVariable): string {
    let code = '';

    code += `domUpdateHandlers.set('${variable.name}', (newValue) => {\n`;

    // Template'de kullanılan tüm referansları bul
    const relevantInstructions = this.updateInstructions.filter(
      (instr) => instr.varName === variable.name
    );

    if (relevantInstructions.length === 0) {
      code += '  // Variable not used in template\n';
    } else {
      relevantInstructions.forEach((instr) => {
        code += `  const elements_${variable.name} = element.querySelectorAll('${instr.selector}');\n`;
        code += `  elements_${variable.name}.forEach(el => {\n`;
        code += `    el.${instr.operation} = newValue;\n`;
        code += '  });\n';
      });
    }

    // Affected variables'ı güncelle
    const affected = this.dependencyGraph.getAffectedVariables(variable.name);
    if (affected.length > 0) {
      code += '\n  // Update dependent variables\n';
      affected.forEach((dep) => {
        code += `  if (domUpdateHandlers.has('${dep}')) {\n`;
        code += `    domUpdateHandlers.get('${dep}')(${dep});\n`;
        code += '  }\n';
      });
    }

    code += '});\n\n';

    return code;
  }

  /**
   * Reactive proxy setup kodunu üret.
   */
  public generateReactiveProxy(): string {
    let code = '';

    code += '// Setup reactive proxy to track changes\n';
    code += 'const handleChange = (varName, newValue) => {\n';
    code += '  if (domUpdateHandlers.has(varName)) {\n';
    code += '    domUpdateHandlers.get(varName)(newValue);\n';
    code += '  }\n';
    code += '};\n\n';

    code += '// Override variable assignments\n';
    this.component.scriptBlock.reactiveVariables.forEach((variable) => {
      code += `const original_${variable.name} = ${variable.name};\n`;
      code += `Object.defineProperty(this, '${variable.name}', {\n`;
      code += `  get() { return original_${variable.name}; },\n`;
      code += `  set(value) {\n`;
      code += `    if (original_${variable.name} !== value) {\n`;
      code += `      original_${variable.name} = value;\n`;
      code += `      handleChange('${variable.name}', value);\n`;
      code += `    }\n`;
      code += `  }\n`;
      code += `});\n`;
    });

    code += '\n';

    return code;
  }

  /**
   * Update instructions'ları döndür.
   */
  public getUpdateInstructions(): DOMUpdateInstruction[] {
    return this.updateInstructions;
  }
}
