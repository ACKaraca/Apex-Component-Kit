/**
 * TemplateParser - Template DSL'ini AST'ye dönüştürür
 * Türkçe: Bu sınıf, .ack dosyasındaki template bölümünü ayrıştırır ve AST üretir.
 */

export interface TemplateAST {
  type: 'root';
  children: TemplateNode[];
  usedVariables: string[];
  events: EventBinding[];
}

export interface TemplateNode {
  type: 'element' | 'text' | 'interpolation';
  tag?: string;
  content?: string;
  attributes?: TemplateAttribute[];
  children?: TemplateNode[];
}

export interface TemplateAttribute {
  name: string;
  value: string;
  isBinding: boolean; // {@click} veya @click gibi
  isInterpolation: boolean; // {variable}
}

export interface EventBinding {
  element: string;
  event: string;
  handler: string;
  line: number;
}

export class TemplateParser {
  private source: string;
  private position: number = 0;
  private usedVariables: Set<string> = new Set();
  private events: EventBinding[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Template'i parse et.
   */
  public parse(): TemplateAST {
    this.position = 0;
    this.usedVariables.clear();
    this.events = [];

    const children = this.parseChildren();

    return {
      type: 'root',
      children,
      usedVariables: Array.from(this.usedVariables),
      events: this.events,
    };
  }

  /**
   * Alt öğeleri parse et.
   */
  private parseChildren(): TemplateNode[] {
    const children: TemplateNode[] = [];

    while (this.position < this.source.length) {
      const char = this.source[this.position];

      if (char === '<') {
        // Kapatma tag'ı mı?
        if (this.source[this.position + 1] === '/') {
          break;
        }

        const element = this.parseElement();
        if (element) {
          children.push(element);
        }
      } else if (char === '{') {
        const interpolation = this.parseInterpolation();
        if (interpolation) {
          children.push(interpolation);
        }
      } else {
        const text = this.parseText();
        if (text.content && text.content.trim()) {
          children.push(text);
        }
      }
    }

    return children;
  }

  /**
   * Öğeyi parse et.
   */
  private parseElement(): TemplateNode | null {
    if (this.source[this.position] !== '<') {
      return null;
    }

    this.position++; // '<' karakterini geç

    // Tag adını oku
    let tag = '';
    while (
      this.position < this.source.length &&
      /[a-zA-Z0-9-]/.test(this.source[this.position])
    ) {
      tag += this.source[this.position];
      this.position++;
    }

    // Öznitelikleri parse et
    const attributes: TemplateAttribute[] = [];
    while (
      this.position < this.source.length &&
      this.source[this.position] !== '>'
    ) {
      const attr = this.parseAttribute();
      if (attr) {
        attributes.push(attr);

        // Event binding'i trackle
        if (attr.isBinding) {
          this.events.push({
            element: tag,
            event: attr.name.replace('@', ''),
            handler: attr.value,
            line: this.calculateLineNumber(),
          });
        }
      }
    }

    if (this.source[this.position] === '>') {
      this.position++;
    }

    // Self-closing tag mı?
    if (tag === 'br' || tag === 'img' || tag === 'input') {
      return {
        type: 'element',
        tag,
        attributes,
        children: [],
      };
    }

    // Alt öğeleri parse et
    const children = this.parseChildren();

    // Kapatma tag'ını geç
    if (this.source[this.position] === '<' && this.source[this.position + 1] === '/') {
      this.position += 2; // '</' geç
      while (
        this.position < this.source.length &&
        this.source[this.position] !== '>'
      ) {
        this.position++;
      }
      if (this.source[this.position] === '>') {
        this.position++;
      }
    }

    return {
      type: 'element',
      tag,
      attributes,
      children,
    };
  }

  /**
   * Özniteliği parse et.
   */
  private parseAttribute(): TemplateAttribute | null {
    // Boşluk atla
    while (
      this.position < this.source.length &&
      /\s/.test(this.source[this.position])
    ) {
      this.position++;
    }

    if (this.position >= this.source.length || this.source[this.position] === '>') {
      return null;
    }

    // Öznitelik adını oku
    let name = '';
    while (
      this.position < this.source.length &&
      /[a-zA-Z@:-]/.test(this.source[this.position])
    ) {
      name += this.source[this.position];
      this.position++;
    }

    if (!name) {
      return null;
    }

    const isBinding = name.startsWith('@');

    // '=' karakterini geç
    while (
      this.position < this.source.length &&
      /[\s=]/.test(this.source[this.position])
    ) {
      this.position++;
    }

    // Değeri oku
    let value = '';
    if (this.source[this.position] === '"' || this.source[this.position] === "'") {
      const quote = this.source[this.position];
      this.position++;
      while (
        this.position < this.source.length &&
        this.source[this.position] !== quote
      ) {
        value += this.source[this.position];
        this.position++;
      }
      if (this.source[this.position] === quote) {
        this.position++;
      }
    }

    // Kullanılan değişkenleri extract et
    if (value.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/)) {
      const matches = value.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
      if (matches) {
        matches.forEach((m) => this.usedVariables.add(m));
      }
    }

    return {
      name,
      value,
      isBinding,
      isInterpolation: false,
    };
  }

  /**
   * İnterpolasyonu parse et.
   */
  private parseInterpolation(): TemplateNode | null {
    if (this.source[this.position] !== '{') {
      return null;
    }

    this.position++; // '{' karakterini geç

    let content = '';
    let braceCount = 1;

    while (
      this.position < this.source.length &&
      braceCount > 0
    ) {
      if (this.source[this.position] === '{') {
        braceCount++;
      } else if (this.source[this.position] === '}') {
        braceCount--;
      }

      if (braceCount > 0) {
        content += this.source[this.position];
      }
      this.position++;
    }

    // Değişkenleri trackle
    if (content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/)) {
      const matches = content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
      if (matches) {
        matches.forEach((m) => this.usedVariables.add(m));
      }
    }

    return {
      type: 'interpolation',
      content,
    };
  }

  /**
   * Metin'i parse et.
   */
  private parseText(): TemplateNode {
    let content = '';

    while (
      this.position < this.source.length &&
      this.source[this.position] !== '<' &&
      this.source[this.position] !== '{'
    ) {
      content += this.source[this.position];
      this.position++;
    }

    return {
      type: 'text',
      content,
    };
  }

  /**
   * Calculate the current line number in the source string.
   */
  private calculateLineNumber(): number {
    let line = 1;
    for (let i = 0; i < this.position; i++) {
      if (this.source[i] === '\n') {
        line++;
      }
    }
    return line;
  }
}
