/**
 * StyleParser - Scoped CSS'i işler
 * Türkçe: Bu sınıf, CSS kurallarını parse eder ve scope'ları yönetir.
 */

export interface ParsedStyle {
  content: string;
  scoped: boolean;
  scopeId: string;
  rules: StyleRule[];
}

export interface StyleRule {
  selector: string;
  content: string;
  properties: CSSProperty[];
}

export interface CSSProperty {
  name: string;
  value: string;
}

export class StyleParser {
  private source: string;
  private scopeId: string;

  constructor(source: string, scopeId?: string) {
    this.source = source;
    this.scopeId = scopeId || `ack-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * CSS'i parse et.
   */
  public parse(scoped: boolean = true): ParsedStyle {
    const rules = this.parseRules();

    if (scoped) {
      // Eğer scoped ise, her selector'a scope ID'yi ekle
      rules.forEach((rule) => {
        rule.selector = `${rule.selector}[${this.scopeId}]`;
      });
    }

    return {
      content: this.source,
      scoped,
      scopeId: this.scopeId,
      rules,
    };
  }

  /**
   * CSS kurallarını parse et.
   */
  private parseRules(): StyleRule[] {
    const rules: StyleRule[] = [];
    let position = 0;

    while (position < this.source.length) {
      // Boşluk atla
      while (
        position < this.source.length &&
        /\s/.test(this.source[position])
      ) {
        position++;
      }

      if (position >= this.source.length) break;

      // Selector'u oku
      let selector = '';
      while (
        position < this.source.length &&
        this.source[position] !== '{'
      ) {
        selector += this.source[position];
        position++;
      }

      selector = selector.trim();

      if (!selector || this.source[position] !== '{') {
        position++;
        continue;
      }

      position++; // '{' karakterini geç

      // Kural içeriğini oku
      let content = '';
      let braceCount = 1;

      while (
        position < this.source.length &&
        braceCount > 0
      ) {
        if (this.source[position] === '{') {
          braceCount++;
        } else if (this.source[position] === '}') {
          braceCount--;
        }

        if (braceCount > 0) {
          content += this.source[position];
        }
        position++;
      }

      // Properties'i parse et
      const properties = this.parseProperties(content);

      rules.push({
        selector,
        content,
        properties,
      });
    }

    return rules;
  }

  /**
   * CSS properties'leri parse et.
   */
  private parseProperties(content: string): CSSProperty[] {
    const properties: CSSProperty[] = [];
    const declarations = content.split(';');

    declarations.forEach((decl) => {
      const trimmed = decl.trim();
      if (!trimmed) return;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return;

      const name = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (name && value) {
        properties.push({ name, value });
      }
    });

    return properties;
  }

  /**
   * Scope ID'yi döndür.
   */
  public getScopeId(): string {
    return this.scopeId;
  }

  /**
   * Scoped CSS'i oluştur (HTML attribute'ina eklenecek).
   */
  public generateScopedHTML(html: string): string {
    // HTML'deki her elemento scope attribute'ını ekle
    return html.replace(
      /(<[a-zA-Z][^>]*)(>)/g,
      `$1 ${this.scopeId}$2`
    );
  }

  /**
   * Scoped CSS output'unu oluştur.
   */
  public generateScopedCSS(): string {
    const rules = this.parseRules();
    let output = '';

    rules.forEach((rule) => {
      const scopedSelector = `${rule.selector}[${this.scopeId}]`;
      output += `${scopedSelector} {`;
      output += rule.content;
      output += '}\n';
    });

    return output;
  }
}
