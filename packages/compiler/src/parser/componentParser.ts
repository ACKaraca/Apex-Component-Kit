/**
 * ComponentParser - Tüm parserları orkestrasyonu
 * Türkçe: Bu sınıf, BlockParser, TemplateParser ve StyleParser'ı kullanarak tam bir ComponentModel üretir.
 */

import { BlockParser } from './blockParser';
import { TemplateParser, TemplateAST } from './templateParser';
import { StyleParser, ParsedStyle } from './styleParser';
import {
  ComponentModel,
  ScriptBlock,
  TemplateBlock,
  StyleBlock,
  ReactiveVariable,
  ImportStatement,
  ImportSpecifier,
  EventBinding,
} from '../types/index';

export class ComponentParser {
  private source: string;
  private filePath: string;
  private componentName: string;

  constructor(source: string, filePath: string, componentName?: string) {
    this.source = source;
    this.filePath = filePath;
    this.componentName =
      componentName || this.extractComponentNameFromPath(filePath);
  }

  /**
   * Dosya yolundan component adı çıkart.
   */
  private extractComponentNameFromPath(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace('.ack', '').charAt(0).toUpperCase() + fileName.slice(1);
  }

  /**
   * Component'i tam olarak parse et.
   */
  public parse(): ComponentModel {
    // Bloklarını ayır
    const blockParser = new BlockParser(this.source);
    const blocks = blockParser.parse();

    // Script bloğunu parse et
    const scriptBlock = this.parseScriptBlock(blocks.script);

    // Template bloğunu parse et
    const templateBlock = this.parseTemplateBlock(blocks.template);

    // Style bloğunu parse et
    const styleBlock = this.parseStyleBlock(blocks.style);

    return {
      name: this.componentName,
      scriptBlock,
      templateBlock,
      styleBlock,
      source: this.source,
      filePath: this.filePath,
    };
  }

  /**
   * Script bloğunu parse et.
   */
  private parseScriptBlock(content: string): ScriptBlock {
    const reactiveVariables = this.extractReactiveVariables(content);
    const imports = this.extractImports(content);

    return {
      content,
      ast: null, // Gerçek implementasyonda Babel AST'si burada olacak
      reactiveVariables,
      imports,
    };
  }

  /**
   * Template bloğunu parse et.
   */
  private parseTemplateBlock(content: string): TemplateBlock {
    const templateParser = new TemplateParser(content);
    const templateAST = templateParser.parse();

    return {
      content,
      ast: templateAST,
      usedVariables: templateAST.usedVariables,
      events: templateAST.events as EventBinding[],
    };
  }

  /**
   * Style bloğunu parse et.
   */
  private parseStyleBlock(content: string): StyleBlock {
    if (!content) {
      return {
        content: '',
        scoped: false,
        scopeId: '',
        rules: [],
      };
    }

    const styleParser = new StyleParser(content);
    const parsedStyle = styleParser.parse(true);

    return {
      content: parsedStyle.content,
      scoped: parsedStyle.scoped,
      scopeId: parsedStyle.scopeId,
      rules: parsedStyle.rules,
    };
  }

  /**
   * Reaktif değişkenleri ayıkla.
   * Türkçe: Script bloğundan let ve var deklarasyonlarını bulur.
   */
  private extractReactiveVariables(content: string): ReactiveVariable[] {
    const variables: ReactiveVariable[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // let x = değer; ve var x = değer; desenlerini ara
      const matches = line.match(/(let|var)\s+(\w+)\s*=\s*(.+);/);

      if (matches) {
        const varName = matches[2];
        const initialValue = matches[3];
        const type = matches[1];

        variables.push({
          name: varName,
          type,
          initialValue: initialValue.trim(),
          usedInTemplate: false, // Daha sonra TemplateBlock ile eşleştirilecek
          dependencies: [],
          line: index + 1,
        });
      }
    });

    return variables;
  }

  /**
   * Import statement'larını ayıkla.
   */
  private extractImports(content: string): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const lines = content.split('\n');

    lines.forEach((line) => {
      // import { x, y } from 'module' deseni
      const defaultMatch = line.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (defaultMatch) {
        imports.push({
          source: defaultMatch[2],
          specifiers: [
            {
              local: defaultMatch[1],
              imported: defaultMatch[1],
              type: 'default',
            },
          ],
        });
      }

      // import { named, imports } from 'module' deseni
      const namedMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
      if (namedMatch) {
        const specifiers = namedMatch[1]
          .split(',')
          .map((spec) => {
            const parts = spec.trim().split(' as ');
            return {
              imported: parts[0].trim(),
              local: parts[1]?.trim() || parts[0].trim(),
              type: 'named' as const,
            };
          });

        imports.push({
          source: namedMatch[2],
          specifiers,
        });
      }
    });

    return imports;
  }

  /**
   * Component adını döndür.
   */
  public getComponentName(): string {
    return this.componentName;
  }
}
