/**
 * HydrationCodeGen - SSR Hydration kodunu üretir
 * Türkçe: Bu sınıf, sunucu tarafı render edilen HTML'i client tarafında hydrate eden kodu üretir.
 */

import { ComponentModel } from '../types/index';

export interface HydrationData {
  variables: { name: string; value: any }[];
  selector: string;
  scopeId: string;
}

export class HydrationCodeGen {
  private component: ComponentModel;

  constructor(component: ComponentModel) {
    this.component = component;
  }

  /**
   * Hydration kodunu üret.
   */
  public generate(ssrHtml: string): string {
    let code = '';

    code += '// SSR Hydration code\n';
    code += 'export async function hydrate(targetSelector = "#app") {\n';
    code += `  const target = document.querySelector(targetSelector);\n`;
    code += `  if (!target) {\n`;
    code += `    console.error('Target element not found for hydration');\n`;
    code += `    return;\n`;
    code += `  }\n\n`;

    code += '  // Extract server-rendered state\n';
    code += this.generateStateExtraction();

    code += '\n';
    code += '  // Rehydrate component\n';
    code += this.generateRehydration();

    code += '}\n\n';

    return code;
  }

  /**
   * Server-rendered state'i ayıkla.
   */
  private generateStateExtraction(): string {
    let code = '';

    code += `  const stateScript = target.querySelector('[data-ack-state]');\n`;
    code += `  const initialState = {};\n\n`;

    code += `  if (stateScript && stateScript.textContent) {\n`;
    code += `    try {\n`;
    code += `      const state = JSON.parse(stateScript.textContent);\n`;

    this.component.scriptBlock.reactiveVariables.forEach((variable) => {
      code += `      initialState.${variable.name} = state.${variable.name} ?? ${variable.initialValue};\n`;
    });

    code += `    } catch (e) {\n`;
    code += `      console.error('Failed to parse server state:', e);\n`;
    code += `    }\n`;
    code += `  }\n`;

    return code;
  }

  /**
   * Component'i rehydrate et.
   */
  private generateRehydration(): string {
    let code = '';

    code += `  // Create component with initial state\n`;
    code += `  const component = new ${this.component.name}({ ...initialState });\n\n`;

    code += `  // Mount component to target\n`;
    code += `  component.mount(target);\n\n`;

    code += `  // Restore event listeners\n`;
    code += this.generateEventListenerRestoration();

    code += `\n  return component;\n`;

    return code;
  }

  /**
   * Event listener'ları restore et.
   */
  private generateEventListenerRestoration(): string {
    let code = '';

    if (this.component.templateBlock.events.length === 0) {
      code += '  // No events to restore\n';
      return code;
    }

    code += '  const events = [\n';

    this.component.templateBlock.events.forEach((event) => {
      code += `    { element: '${event.element}', event: '${event.event}', handler: '${event.handler}' },\n`;
    });

    code += '  ];\n\n';

    code += `  events.forEach(event => {\n`;
    code += `    const elements = target.querySelectorAll(event.element);\n`;
    code += `    elements.forEach(el => {\n`;
    code += `      if (component[event.handler]) {\n`;
    code += `        el.addEventListener(event.type, component[event.handler].bind(component));\n`;
    code += `      }\n`;
    code += `    });\n`;
    code += `  });\n`;

    return code;
  }

  /**
   * Server tarafı state'i JSON olarak döndür.
   */
  public generateServerState(): string {
    let state: { [key: string]: string } = {};

    this.component.scriptBlock.reactiveVariables.forEach((variable) => {
      state[variable.name] = variable.initialValue;
    });

    return JSON.stringify(state);
  }

  /**
   * Server-rendered HTML ile beraber kullanılacak state script'ini oluştur.
   */
  public generateStateScript(): string {
    return `<script data-ack-state type="application/json">${this.generateServerState()}</script>`;
  }

  /**
   * Full SSR HTML output'unu oluştur (component + state script).
   */
  public generateFullSSROutput(componentHtml: string): string {
    let output = '';

    // Component HTML
    output += componentHtml;

    // State script
    output += this.generateStateScript();

    // Hydration script
    output += '\n<script>\n';
    output += 'if (typeof hydrate === "function") {\n';
    output += '  hydrate("#app");\n';
    output += '}\n';
    output += '</script>\n';

    return output;
  }
}
