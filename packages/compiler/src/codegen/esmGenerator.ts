/**
 * ESMGenerator - ES6 Module formatında kod üretir
 * Türkçe: Bu sınıf, .ack bileşenini ES6 Module formatında JavaScript'e dönüştürür.
 */

import {
  ComponentModel,
  ReactiveVariable,
  ImportStatement,
  EventBinding,
  CodegenOptions,
} from '../types/index';

export class ESMGenerator {
  private component: ComponentModel;
  private options: CodegenOptions;

  constructor(component: ComponentModel, options: Partial<CodegenOptions> = {}) {
    this.component = component;
    this.options = {
      format: 'esm',
      minify: false,
      sourceMap: false,
      ssr: false,
      componentName: component.name,
      ...options,
    };
  }

  /**
   * ES6 Module kodunu üret.
   */
  public generate(): string {
    let code = '';

    // Imports'u ekle
    code += this.generateImports();

    // Export default component
    code += this.generateComponentExport();

    return code;
  }

  /**
   * Import statement'larını üret.
   */
  private generateImports(): string {
    let imports = "";
    
    // Runtime imports
    imports += "import { mount as ackMount, createReactive } from '@ack/runtime';\n";
    imports += "\n";

    // Component imports
    if (this.component.scriptBlock.imports.length > 0) {
      this.component.scriptBlock.imports.forEach((imp) => {
        imports += `import ${this.formatImportSpecifiers(imp.specifiers)} from '${imp.source}';\n`;
      });
      imports += "\n";
    }

    return imports;
  }

  /**
   * Import specifiers'ı format et.
   */
  private formatImportSpecifiers(specifiers: any[]): string {
    if (specifiers.length === 1 && specifiers[0].type === 'default') {
      return specifiers[0].local;
    }

    const named = specifiers
      .filter((s) => s.type === 'named')
      .map((s) => (s.local === s.imported ? s.local : `${s.imported} as ${s.local}`))
      .join(', ');

    return `{ ${named} }`;
  }

  /**
   * Component export'unu üret.
   */
  private generateComponentExport(): string {
    let code = '';

    code += `export default function ${this.component.name}(props = {}) {\n`;
    code += this.generateComponentBody();
    code += '}\n';

    return code;
  }

  /**
   * Component body'sini üret.
   */
  private generateComponentBody(): string {
    let code = '';

    // Reaktif değişkenleri kur
    code += this.generateReactiveSetup();

    // HTML'i oluştur
    code += this.generateHTMLTemplate();

    // Event handlers'ı kur
    code += this.generateEventHandlers();

    // Component'i return et
    code += `\n  return {\n`;
    code += `    element,\n`;
    code += `    mount(target) {\n`;
    code += `      ackMount(this, target);\n`;
    code += `    },\n`;
    code += `    destroy() {\n`;
    code += `      element?.remove();\n`;
    code += `    }\n`;
    code += `  };\n`;

    return code;
  }

  /**
   * Reaktif değişken setupini üret.
   */
  private generateReactiveSetup(): string {
    let code = '';

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

    // Script content'ini ekle (user-defined functions vb.)
    if (this.component.scriptBlock.content) {
      code += '  // User-defined code\n';
      const userCode = this.component.scriptBlock.content
        .split('\n')
        .map((line) => '  ' + line)
        .join('\n');
      code += userCode + '\n\n';
    }

    return code;
  }

  /**
   * HTML template'ini üret.
   */
  private generateHTMLTemplate(): string {
    let code = '';

    code += '  // HTML Template\n';
    code += `  const element = document.createElement('div');\n`;
    code += `  element.setAttribute('${this.component.styleBlock.scopeId}', '');\n`;
    code += `  element.innerHTML = \``;

    // Template'den HTML oluştur
    code += this.generateHTMLFromTemplate();

    code += `\`;\n\n`;

    return code;
  }

  /**
   * Template'den HTML oluştur.
   */
  private generateHTMLFromTemplate(): string {
    // Basit implementation - gerçek kod AST'den HTML string oluşturur
    return '<div><!-- Generated template --></div>';
  }

  /**
   * Event handler'ları üret.
   */
  private generateEventHandlers(): string {
    let code = '';

    if (this.component.templateBlock.events.length > 0) {
      code += '  // Event handlers\n';

      this.component.templateBlock.events.forEach((event) => {
        code += `  const ${event.element}_${event.type}_handler = ${event.handler};\n`;
      });

      code += '\n';
    }

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
