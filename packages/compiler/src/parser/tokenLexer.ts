/**
 * The TokenLexer class is responsible for converting an .ack source string
 * into a stream of tokens. It handles basic tokenization for tags, attributes,
 * and string content.
 * @class TokenLexer
 */

/**
 * Represents a single token extracted by the TokenLexer.
 * @interface Token
 * @property {string} type - The type of the token (e.g., 'tagOpen', 'string', 'identifier').
 * @property {string} value - The actual string value of the token.
 * @property {number} line - The line number where the token starts.
 * @property {number} column - The column number where the token starts.
 */
export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

export class TokenLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  /**
   * Creates an instance of TokenLexer.
   * @param {string} source The source code to tokenize.
   */
  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenizes the entire source string into an array of tokens.
   * This is the main public method of the class.
   * @returns {Token[]} An array of tokens representing the source code.
   */
  public tokenize(): Token[] {
    while (this.position < this.source.length) {
      this.skipWhitespace();
      
      if (this.position >= this.source.length) break;

      const currentChar = this.source[this.position];

      // Açılan tag'ı kontrol et
      if (currentChar === '<' && this.peekNext() === '/') {
        const token = this.readTagOpen();
        if (token) {
          this.tokens.push(token);
        }
      } else if (currentChar === '<' && !this.isClosingTag()) {
        const token = this.readTagOpen();
        if (token) {
          this.tokens.push(token);
        }
      } else if (currentChar === '>' || currentChar === '/' || currentChar === '=') {
        this.tokens.push({
          type: 'operator',
          value: currentChar,
          line: this.line,
          column: this.column,
        });
        this.advance();
      } else if (currentChar === '{' || currentChar === '}') {
        this.tokens.push({
          type: 'brace',
          value: currentChar,
          line: this.line,
          column: this.column,
        });
        this.advance();
      } else if (currentChar === '"' || currentChar === "'") {
        const token = this.readString();
        this.tokens.push(token);
      } else if (/[a-zA-Z_$]/.test(currentChar)) {
        const token = this.readIdentifier();
        this.tokens.push(token);
      } else {
        this.advance();
      }
    }

    return this.tokens;
  }

  /**
   * Tag'ı oku.
   */
  private readTagOpen(): Token | null {
    const startLine = this.line;
    const startColumn = this.column;

    if (this.source[this.position] !== '<') {
      return null;
    }

    this.advance(); // '<' karakterini geç

    const isClosing = this.source[this.position] === '/';
    if (isClosing) {
      this.advance();
    }

    let tagName = '';
    while (
      this.position < this.source.length &&
      /[a-zA-Z0-9-]/.test(this.source[this.position])
    ) {
      tagName += this.source[this.position];
      this.advance();
    }

    // Eğer tag '>' ile kapanıyorsa, geri satır yazma
    while (
      this.position < this.source.length &&
      this.source[this.position] !== '>'
    ) {
      this.advance();
    }

    if (this.source[this.position] === '>') {
      this.advance();
    }

    return {
      type: isClosing ? 'tagClose' : 'tagOpen',
      value: tagName,
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * String'i oku.
   */
  private readString(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    const quote = this.source[this.position];
    let value = '';

    this.advance(); // Açılış tırnağını geç

    while (
      this.position < this.source.length &&
      this.source[this.position] !== quote
    ) {
      if (this.source[this.position] === '\\') {
        this.advance();
        if (this.position < this.source.length) {
          value += this.source[this.position];
          this.advance();
        }
      } else {
        value += this.source[this.position];
        this.advance();
      }
    }

    if (this.source[this.position] === quote) {
      this.advance(); // Kapanış tırnağını geç
    }

    return {
      type: 'string',
      value,
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * Identifier'ı oku.
   */
  private readIdentifier(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (
      this.position < this.source.length &&
      /[a-zA-Z0-9_$]/.test(this.source[this.position])
    ) {
      value += this.source[this.position];
      this.advance();
    }

    return {
      type: 'identifier',
      value,
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * Bir karakter ilerle.
   */
  private advance(): void {
    if (this.source[this.position] === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }

  /**
   * Sonraki karaktere bak.
   */
  private peekNext(): string {
    return this.source[this.position + 1] || '';
  }

  /**
   * Kapanış tag'ı mı kontrol et.
   */
  private isClosingTag(): boolean {
    if (this.position + 1 < this.source.length) {
      return this.source[this.position + 1] === '/';
    }
    return false;
  }

  /**
   * Boşluk karakterlerini atla.
   */
  private skipWhitespace(): void {
    while (
      this.position < this.source.length &&
      /\s/.test(this.source[this.position])
    ) {
      this.advance();
    }
  }
}
