/**
 * ACK Language Server
 * Türkçe: ACK dil desteği için basit language server
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class ACKLanguageServer {
  private client: vscode.LanguageClient | undefined;
  private context: vscode.ExtensionContext | undefined;

  /**
   * Language server'ı başlat
   */
  async start(): Promise<void> {
    if (!this.context) {
      throw new Error('Extension context not set');
    }

    const serverOptions: vscode.ServerOptions = {
      command: 'node',
      args: [path.join(this.context.extensionPath, 'out', 'server.js')],
      options: {
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
      }
    };

    const clientOptions: vscode.LanguageClientOptions = {
      documentSelector: [
        { scheme: 'file', language: 'ack' },
        { scheme: 'file', pattern: '**/*.ack' }
      ],
      synchronize: {
        fileEvents: [
          vscode.workspace.createFileSystemWatcher('**/*.ack'),
          vscode.workspace.createFileSystemWatcher('**/ack.config.*')
        ]
      },
      initializationOptions: {
        capabilities: {
          textDocumentSync: vscode.TextDocumentSyncKind.Full,
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: ['.', '{', '[', '(', ' ', '@']
          },
          hoverProvider: true,
          definitionProvider: true,
          referencesProvider: true,
          documentSymbolProvider: true,
          workspaceSymbolProvider: true,
          renameProvider: true,
          colorProvider: true,
          foldingRangeProvider: true
        }
      }
    };

    this.client = new vscode.LanguageClient(
      'ackLanguageServer',
      'ACK Language Server',
      serverOptions,
      clientOptions
    );

    try {
      await this.client.start();
      console.log('ACK Language Server started successfully');
    } catch (error) {
      console.error('Failed to start ACK Language Server:', error);
      throw error;
    }
  }

  /**
   * Language server'ı durdur
   */
  stop(): void {
    if (this.client) {
      this.client.stop();
      this.client = undefined;
    }
  }

  /**
   * Language client'ı al
   */
  getClient(): vscode.LanguageClient | undefined {
    return this.client;
  }

  /**
   * Extension context'i ayarla
   */
  setContext(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  /**
   * Language server durumunu kontrol et
   */
  isRunning(): boolean {
    return this.client?.state === vscode.State.Running;
  }
}

/**
 * ACK Language Server Provider (basit implementasyon)
 */
export class ACKLanguageServerProvider implements vscode.DocumentSemanticTokensProvider {
  /**
   * Semantic tokens sağla
   */
  provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
    const tokens = new vscode.SemanticTokensBuilder();

    const text = document.getText();
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      // Script bloğu içindeki JavaScript keywords
      if (line.trim().startsWith('<script>') || line.includes('let ') || line.includes('function ') || line.includes('const ')) {
        const keywords = ['let', 'const', 'function', 'if', 'else', 'for', 'while', 'return', 'import', 'export'];
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'g');
          let match;
          while ((match = regex.exec(line)) !== null) {
            tokens.push(
              lineIndex,
              match.index,
              match[0].length,
              this.getTokenType('keyword'),
              this.getTokenModifiers([])
            );
          }
        });
      }

      // Template interpolation
      const interpolationRegex = /\{([^}]+)\}/g;
      let match;
      while ((match = interpolationRegex.exec(line)) !== null) {
        tokens.push(
          lineIndex,
          match.index,
          match[0].length,
          this.getTokenType('variable'),
          this.getTokenModifiers([])
        );
      }

      // Event bindings
      const eventRegex = /@([a-zA-Z]+)={([^}]+)}/g;
      while ((match = eventRegex.exec(line)) !== null) {
        tokens.push(
          lineIndex,
          match.index,
          match[0].length,
          this.getTokenType('function'),
          this.getTokenModifiers([])
        );
      }
    });

    return tokens.build();
  }

  /**
   * Token tipini al
   */
  private getTokenType(tokenType: string): number {
    const tokenTypes = [
      'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
      'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
      'method', 'property', 'variable', 'parameter', 'label'
    ];

    return tokenTypes.indexOf(tokenType);
  }

  /**
   * Token modifier'larını al
   */
  private getTokenModifiers(modifiers: string[]): number {
    const modifierSet = new Set(modifiers);
    let result = 0;

    const allModifiers = [
      'declaration', 'definition', 'readonly', 'static', 'deprecated',
      'abstract', 'async', 'modification', 'documentation', 'defaultLibrary'
    ];

    allModifiers.forEach((modifier, index) => {
      if (modifierSet.has(modifier)) {
        result |= (1 << index);
      }
    });

    return result;
  }
}

/**
 * ACK Document Symbol Provider
 */
export class ACKDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  /**
   * Document symbol'larını sağla
   */
  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    const symbols: vscode.SymbolInformation[] = [];

    const text = document.getText();
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      // Function definitions
      const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
      let match;
      while ((match = functionRegex.exec(line)) !== null) {
        symbols.push(new vscode.SymbolInformation(
          match[1],
          vscode.SymbolKind.Function,
          '',
          new vscode.Location(document.uri, new vscode.Range(
            new vscode.Position(index, match.index),
            new vscode.Position(index, match.index + match[0].length)
          ))
        ));
      }

      // Variable declarations
      const variableRegex = /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
      while ((match = variableRegex.exec(line)) !== null) {
        symbols.push(new vscode.SymbolInformation(
          match[1],
          vscode.SymbolKind.Variable,
          '',
          new vscode.Location(document.uri, new vscode.Range(
            new vscode.Position(index, match.index),
            new vscode.Position(index, match.index + match[0].length)
          ))
        ));
      }
    });

    return symbols;
  }
}

/**
 * ACK Completion Provider
 */
export class ACKCompletionProvider implements vscode.CompletionItemProvider {
  /**
   * Completion item'larını sağla
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    // Basic ACK keywords
    const keywords = [
      'let', 'const', 'function', 'if', 'else', 'for', 'while', 'return',
      'import', 'export', 'class', 'extends', 'super'
    ];

    keywords.forEach(keyword => {
      const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
      item.detail = `ACK ${keyword} keyword`;
      items.push(item);
    });

    // ACK specific completions
    const ackCompletions = [
      { label: '@click', kind: vscode.CompletionItemKind.Event, detail: 'Click event binding' },
      { label: '@input', kind: vscode.CompletionItemKind.Event, detail: 'Input event binding' },
      { label: '@submit', kind: vscode.CompletionItemKind.Event, detail: 'Form submit event' },
      { label: '@change', kind: vscode.CompletionItemKind.Event, detail: 'Change event binding' },
      { label: 'scoped', kind: vscode.CompletionItemKind.Keyword, detail: 'Scoped CSS styles' }
    ];

    ackCompletions.forEach(({ label, kind, detail }) => {
      const item = new vscode.CompletionItem(label, kind);
      item.detail = detail;
      items.push(item);
    });

    return items;
  }
}

/**
 * ACK Hover Provider
 */
export class ACKHoverProvider implements vscode.HoverProvider {
  /**
   * Hover bilgilerini sağla
   */
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    const range = document.getWordRangeAtPosition(position);
    if (!range) return null;

    const word = document.getText(range);

    // ACK specific hover information
    const hoverInfo: Record<string, string> = {
      'scoped': 'Styles are scoped to this component only',
      '@click': 'Bind click events to functions',
      '@input': 'Bind input events to reactive variables',
      'let': 'Declare reactive variables that trigger re-renders',
      'function': 'Define functions that can be called from templates'
    };

    if (hoverInfo[word]) {
      return new vscode.Hover(hoverInfo[word]);
    }

    return null;
  }
}

/**
 * ACK Definition Provider
 */
export class ACKDefinitionProvider implements vscode.DefinitionProvider {
  /**
   * Definition bilgilerini sağla
   */
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location | null {
    const range = document.getWordRangeAtPosition(position);
    if (!range) return null;

    const word = document.getText(range);

    // Simple function/variable definition lookup
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Function definition
      if (line.includes(`function ${word}`) || line.includes(`${word}(`)) {
        return new vscode.Location(document.uri, new vscode.Range(
          new vscode.Position(i, 0),
          new vscode.Position(i, line.length)
        ));
      }

      // Variable declaration
      if (line.includes(`let ${word}`) || line.includes(`const ${word}`) || line.includes(`var ${word}`)) {
        return new vscode.Location(document.uri, new vscode.Range(
          new vscode.Position(i, 0),
          new vscode.Position(i, line.length)
        ));
      }
    }

    return null;
  }
}

/**
 * Language server özelliklerini kaydet
 */
export function registerACKLanguageFeatures(context: vscode.ExtensionContext): void {
  // Semantic tokens provider
  const semanticTokensProvider = new ACKLanguageServerProvider();
  vscode.languages.registerDocumentSemanticTokensProvider(
    { language: 'ack' },
    semanticTokensProvider,
    new vscode.SemanticTokensLegend([
      'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
      'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
      'method', 'property', 'variable', 'parameter', 'label'
    ], [
      'declaration', 'definition', 'readonly', 'static', 'deprecated',
      'abstract', 'async', 'modification', 'documentation', 'defaultLibrary'
    ])
  );

  // Document symbol provider
  const symbolProvider = new ACKDocumentSymbolProvider();
  vscode.languages.registerDocumentSymbolProvider(
    { language: 'ack' },
    symbolProvider
  );

  // Completion provider
  const completionProvider = new ACKCompletionProvider();
  vscode.languages.registerCompletionItemProvider(
    { language: 'ack' },
    completionProvider
  );

  // Hover provider
  const hoverProvider = new ACKHoverProvider();
  vscode.languages.registerHoverProvider(
    { language: 'ack' },
    hoverProvider
  );

  // Definition provider
  const definitionProvider = new ACKDefinitionProvider();
  vscode.languages.registerDefinitionProvider(
    { language: 'ack' },
    definitionProvider
  );

  context.subscriptions.push(
    semanticTokensProvider,
    symbolProvider,
    completionProvider,
    hoverProvider,
    definitionProvider
  );
}
