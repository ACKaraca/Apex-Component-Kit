/**
 * DOMUpdateCodeGen - DOM güncellemesi kodunu üretir
 * Türkçe: Bu sınıf, bir değişken değiştiğinde DOM'un hangi bölümünü güncellenmesi gerektiğini belirleyen kodu üretir.
 */

import { ComponentModel, ReactiveVariable } from '../types/index';
import { DependencyGraph } from '../analyzer/dependencyGraph';

/**
 * Represents a single instruction for updating the DOM when a reactive variable changes.
 * @interface DOMUpdateInstruction
 * @property {string} varName - The name of the reactive variable that triggers the update.
 * @property {string} selector - The CSS selector for the DOM element(s) to update.
 * @property {'textContent' | 'innerHTML' | 'attribute' | 'class' | 'style'} operation - The type of DOM operation to perform.
 * @property {string} value - The value to be applied, often the name of the variable itself.
 */
export interface DOMUpdateInstruction {
  varName: string;
  selector: string;
  operation: 'textContent' | 'innerHTML' | 'attribute' | 'class' | 'style';
  value: string;
}

/**
 * The DOMUpdateCodeGen class is responsible for generating the code that
 * updates the DOM when reactive variables change. It uses the dependency graph
 * to determine which parts of the DOM need to be updated.
 * @class DOMUpdateCodeGen
 */
export class DOMUpdateCodeGen {
  private component: ComponentModel;
  private dependencyGraph: DependencyGraph;
  private updateInstructions: DOMUpdateInstruction[] = [];

  /**
   * Creates an instance of DOMUpdateCodeGen.
   * @param {ComponentModel} component The component model.
   * @param {DependencyGraph} depGraph The dependency graph for the component's reactive variables.
   */
  constructor(component: ComponentModel, depGraph: DependencyGraph) {
    this.component = component;
    this.dependencyGraph = depGraph;
    this.analyzeUpdates();
  }

  /**
   * Analyzes the template to create a list of DOM update instructions.
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
