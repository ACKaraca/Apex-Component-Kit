/**
 * CJSGenerator - CommonJS formatında kod üretir
 * Türkçe: Bu sınıf, .ack bileşenini CommonJS formatında JavaScript'e dönüştürür.
 */

import {
  ComponentModel,
  CodegenOptions,
} from '../types/index';
import { ESMGenerator } from './esmGenerator';

/**
 * The CJSGenerator class is responsible for generating JavaScript code in the
 * CommonJS format from a ComponentModel.
 * @class CJSGenerator
 */
export class CJSGenerator {
  private component: ComponentModel;
  private options: CodegenOptions;
  private esmGenerator: ESMGenerator;

  /**
   * Creates an instance of CJSGenerator.
   * @param {ComponentModel} component The component model to generate code from.
   * @param {Partial<CodegenOptions>} [options={}] Code generation options.
   */
  constructor(component: ComponentModel, options: Partial<CodegenOptions> = {}) {
    this.component = component;
    this.options = {
      format: 'cjs',
      minify: false,
      sourceMap: false,
      ssr: false,
      componentName: component.name,
      ...options,
    };
    this.esmGenerator = new ESMGenerator(component, this.options);
  }

  /**
   * Generates the full CommonJS module code for the component.
   * @returns {string} The generated JavaScript code as a string.
   */
  public generate(): string {
    let code = '';

    // Requires'ü ekle
    code += this.generateRequires();

    // Module exports
    code += this.generateModuleExports();

    return code;
  }

  /**
   * Require statement'larını üret.
   */
  private generateRequires(): string {
    let requires = '';

    // Runtime requires
    requires += "const { mount: ackMount, createReactive } = require('@ack/runtime');\n";
    requires += '\n';

    // Component requires
    if (this.component.scriptBlock.imports.length > 0) {
      this.component.scriptBlock.imports.forEach((imp) => {
        requires += `const ${this.formatRequireSpecifiers(imp.specifiers)} = require('${imp.source}');\n`;
      });
      requires += '\n';
    }

    return requires;
  }

  /**
   * Require specifiers'ı format et.
   */
  private formatRequireSpecifiers(specifiers: any[]): string {
    if (specifiers.length === 1 && specifiers[0].type === 'default') {
      return specifiers[0].local;
    }

    const props = specifiers
      .filter((s) => s.type === 'named')
      .map((s) => (s.local === s.imported ? s.imported : `${s.imported}: ${s.local}`))
      .join(', ');

    return `{ ${props} }`;
  }

  /**
   * Module exports'unu üret.
   */
  private generateModuleExports(): string {
    let code = '';

    code += `function ${this.component.name}(props = {}) {\n`;
    code += this.generateComponentBody();
    code += '}\n\n';

    code += `module.exports = ${this.component.name};\n`;

    return code;
  }

  /**
   * Component body'sini üret.
   */
  private generateComponentBody(): string {
    let code = '';

    // Reaktif değişkenleri kur
    code += '  // Reaktif değişkenleri kur\n';
    this.component.scriptBlock.reactiveVariables.forEach((variable) => {
      code += `  let ${variable.name} = ${variable.initialValue};\n`;
    });

    code += '\n';
    code += '  // Reaktif proxy oluştur\n';
    code += '  const reactive = createReactive({\n';
    this.component.scriptBlock.reactiveVariables.forEach((variable) => {
      code += `    ${variable.name},\n`;
    });
    code += '  });\n';

    code += '\n';

    // HTML'i oluştur
    code += '  // HTML Template\n';
    code += `  const element = document.createElement('div');\n`;
    code += `  element.setAttribute('${this.component.styleBlock.scopeId}', '');\n`;
    code += `  element.innerHTML = \`<div><!-- Generated template --></div>\`;\n`;

    code += '\n';

    // Event handlers
    if (this.component.templateBlock.events.length > 0) {
      code += '  // Event handlers\n';
      this.component.templateBlock.events.forEach((event) => {
        code += `  const ${event.element}_${event.event}_handler = ${event.handler};\n`;
      });
      code += '\n';
    }

    // Return component
    code += '  return {\n';
    code += '    element,\n';
    code += '    mount(target) {\n';
    code += '      ackMount(this, target);\n';
    code += '    },\n';
    code += '    destroy() {\n';
    code += "      element?.remove();\n";
    code += '    }\n';
    code += '  };\n';

    return code;
  }

  /**
   * CSS'i bir string olarak döndür.
   */
  public generateStyles(): string {
    if (this.component.styleBlock.scoped) {
      return this.generateScopedStyles();
    }
    return this.component.styleBlock.content;
  }

  /**
   * Scoped CSS üret.
   */
  private generateScopedStyles(): string {
    let css = '';

    this.component.styleBlock.rules.forEach((rule) => {
      css += `${rule.selector}[${this.component.styleBlock.scopeId}] {\n`;
      rule.properties.forEach((prop) => {
        css += `  ${prop.name}: ${prop.value};\n`;
      });
      css += '}\n\n';
    });

    return css;
  }
}
