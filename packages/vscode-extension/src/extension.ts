/**
 * ACK Framework VSCode Extension
 * Türkçe: ACK Framework için VSCode uzantısı
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ACKLanguageServer } from './language-server';
import { ACKDevToolsProvider } from './dev-tools-provider';
import { ComponentExplorerProvider } from './component-explorer';
import { PluginExplorerProvider } from './plugin-explorer';

let languageServer: ACKLanguageServer | undefined;
let devToolsProvider: ACKDevToolsProvider | undefined;
let componentExplorer: ComponentExplorerProvider | undefined;
let pluginExplorer: PluginExplorerProvider | undefined;

/**
 * Extension aktivasyonu
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('ACK Framework extension is now active!');

  // Language server'ı başlat
  await startLanguageServer(context);

  // Dev tools provider'ı kaydet
  registerDevToolsProvider(context);

  // Component explorer'ı kaydet
  registerComponentExplorer(context);

  // Plugin explorer'ı kaydet
  registerPluginExplorer(context);

  // Commands'ı kaydet
  registerCommands(context);

  // Configuration değişikliklerini dinle
  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('ack')) {
      vscode.window.showInformationMessage('ACK Framework configuration updated. Restart may be required.');
    }
  });

  // Terminal link provider'ı kaydet
  vscode.window.registerTerminalLinkProvider({
    provideTerminalLinks: (context, token) => {
      const links: vscode.TerminalLink[] = [];

      // ACK error pattern'ları için link oluştur
      const ackErrorRegex = /error.*\.ack:(\d+):(\d+)/g;
      let match;

      while ((match = ackErrorRegex.exec(context.line)) !== null) {
        const line = parseInt(match[1]);
        const column = parseInt(match[2]);

        links.push({
          startIndex: match.index,
          length: match[0].length,
          tooltip: 'Go to ACK file',
          data: { line, column }
        });
      }

      return links;
    },

    handleTerminalLink: (link: vscode.TerminalLink) => {
      const data = link.data as { line: number; column: number };

      vscode.window.showTextDocument(vscode.Uri.file(link.startIndex.toString()), {
        selection: new vscode.Range(
          new vscode.Position(data.line - 1, data.column - 1),
          new vscode.Position(data.line - 1, data.column - 1)
        )
      });
    }
  });

  // Status bar item oluştur
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(rocket) ACK';
  statusBarItem.tooltip = 'ACK Framework is active';
  statusBarItem.command = 'ack.showDocumentation';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  return {
    languageServer,
    devToolsProvider,
    componentExplorer,
    pluginExplorer
  };
}

/**
 * Extension deaktivasyonu
 */
export function deactivate() {
  if (languageServer) {
    languageServer.stop();
  }

  if (devToolsProvider) {
    devToolsProvider.dispose();
  }

  console.log('ACK Framework extension is now deactivated!');
}

/**
 * Language server'ı başlat
 */
async function startLanguageServer(context: vscode.ExtensionContext) {
  try {
    languageServer = new ACKLanguageServer();
    await languageServer.start();

    // Language server client'ı kaydet
    const client = languageServer.getClient();
    if (client) {
      context.subscriptions.push(client);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to start ACK Language Server: ${error}`);
  }
}

/**
 * Dev tools provider'ı kaydet
 */
function registerDevToolsProvider(context: vscode.ExtensionContext) {
  devToolsProvider = new ACKDevToolsProvider();
  context.subscriptions.push(devToolsProvider);

  // Dev tools view'ı kaydet
  const devToolsView = vscode.window.createWebviewPanel(
    'ackDevTools',
    'ACK Dev Tools',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'out'))]
    }
  );

  devToolsProvider.setWebview(devToolsView);
  context.subscriptions.push(devToolsView);
}

/**
 * Component explorer'ı kaydet
 */
function registerComponentExplorer(context: vscode.ExtensionContext) {
  componentExplorer = new ComponentExplorerProvider();

  vscode.window.registerTreeDataProvider('ack.components', componentExplorer);
  context.subscriptions.push(componentExplorer);

  // Component commands
  const createComponentCommand = vscode.commands.registerCommand(
    'ack.createComponent',
    async (uri?: vscode.Uri) => {
      const componentName = await vscode.window.showInputBox({
        prompt: 'Enter component name',
        placeHolder: 'MyComponent'
      });

      if (componentName) {
        await createACKComponent(uri?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath, componentName);
      }
    }
  );

  context.subscriptions.push(createComponentCommand);
}

/**
 * Plugin explorer'ı kaydet
 */
function registerPluginExplorer(context: vscode.ExtensionContext) {
  pluginExplorer = new PluginExplorerProvider();

  vscode.window.registerTreeDataProvider('ack.plugins', pluginExplorer);
  context.subscriptions.push(pluginExplorer);
}

/**
 * Commands'ı kaydet
 */
function registerCommands(context: vscode.ExtensionContext) {
  // Create component command
  const createComponentCmd = vscode.commands.registerCommand(
    'ack.createComponent',
    async (uri?: vscode.Uri) => {
      const componentName = await vscode.window.showInputBox({
        prompt: 'Enter component name',
        placeHolder: 'MyComponent'
      });

      if (componentName) {
        await createACKComponent(uri?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath, componentName);
      }
    }
  );

  // Run dev server command
  const runDevServerCmd = vscode.commands.registerCommand(
    'ack.runDevServer',
    async () => {
      const terminal = vscode.window.createTerminal('ACK Dev Server');
      terminal.sendText('cd ' + (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '.'));
      terminal.sendText('npm run dev');
      terminal.show();
    }
  );

  // Build project command
  const buildProjectCmd = vscode.commands.registerCommand(
    'ack.buildProject',
    async () => {
      const terminal = vscode.window.createTerminal('ACK Build');
      terminal.sendText('cd ' + (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '.'));
      terminal.sendText('npm run build');
      terminal.show();
    }
  );

  // Run tests command
  const runTestsCmd = vscode.commands.registerCommand(
    'ack.runTests',
    async () => {
      const terminal = vscode.window.createTerminal('ACK Tests');
      terminal.sendText('cd ' + (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '.'));
      terminal.sendText('npm test');
      terminal.show();
    }
  );

  // Show documentation command
  const showDocumentationCmd = vscode.commands.registerCommand(
    'ack.showDocumentation',
    async () => {
      const panel = vscode.window.createWebviewPanel(
        'ackDocumentation',
        'ACK Framework Documentation',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(__dirname, '..', 'docs'))]
        }
      );

      panel.webview.html = getDocumentationWebviewContent();
    }
  );

  context.subscriptions.push(
    createComponentCmd,
    runDevServerCmd,
    buildProjectCmd,
    runTestsCmd,
    showDocumentationCmd
  );
}

/**
 * ACK component oluştur
 */
async function createACKComponent(folderPath?: string, componentName?: string) {
  if (!folderPath || !componentName) return;

  const componentDir = path.join(folderPath, 'src', 'components');
  const filePath = path.join(componentDir, `${componentName}.ack`);

  // Klasörü oluştur
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Component içeriğini oluştur
  const componentContent = `<script>
  let count = 0;

  function increment() {
    count++;
  }
</script>

<template>
  <div class="${componentName.toLowerCase()}">
    <h1>${componentName}</h1>
    <p>Count: {count}</p>
    <button @click={increment}>Increment</button>
  </div>
</template>

<style scoped>
  .${componentName.toLowerCase()} {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 10px 0;
  }
</style>`;

  // Dosyayı yaz
  fs.writeFileSync(filePath, componentContent);

  // VSCode'da dosyayı aç
  const document = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(document);

  vscode.window.showInformationMessage(`ACK component "${componentName}" created successfully!`);
}

/**
 * Documentation webview içeriğini al
 */
function getDocumentationWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ACK Framework Documentation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .hero {
          text-align: center;
          padding: 40px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-bottom: 40px;
          border-radius: 8px;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 40px 0;
        }
        .feature-card {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .feature-card h3 {
          margin: 0 0 10px 0;
          color: #667eea;
        }
        .code {
          background: #2d3748;
          color: #e2e8f0;
          padding: 15px;
          border-radius: 6px;
          font-family: 'Fira Code', monospace;
          margin: 15px 0;
          overflow-x: auto;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 10px 10px 0;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #5a67d8;
        }
      </style>
    </head>
    <body>
      <div class="hero">
        <h1>🚀 ACK Framework</h1>
        <p>Next-generation JavaScript framework for modern web development</p>
      </div>

      <h2>✨ Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>🔧 Zero Runtime</h3>
          <p>Minimal runtime overhead with compile-time optimizations</p>
        </div>
        <div class="feature-card">
          <h3>⚡ Reactive System</h3>
          <p>Proxy-based reactivity with automatic DOM updates</p>
        </div>
        <div class="feature-card">
          <h3>🎯 TypeScript First</h3>
          <p>Full TypeScript support with strict type checking</p>
        </div>
        <div class="feature-card">
          <h3>🧩 Component-Based</h3>
          <p>Modular component architecture with scoped styles</p>
        </div>
        <div class="feature-card">
          <h3>🚀 Production Ready</h3>
          <p>Comprehensive testing, performance optimization, and production features</p>
        </div>
        <div class="feature-card">
          <h3>🔌 Plugin System</h3>
          <p>Extensible architecture with hooks, commands, and middleware</p>
        </div>
      </div>

      <h2>📝 Quick Start</h2>
      <div class="code">
// Create a new ACK component
&lt;script&gt;
  let count = 0;

  function increment() {
    count++;
  }
&lt;/script&gt;

&lt;template&gt;
  &lt;div class="counter"&gt;
    &lt;h1&gt;Count: {count}&lt;/h1&gt;
    &lt;button @click={increment}&gt;Increment&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;style scoped&gt;
  .counter {
    text-align: center;
    padding: 1em;
  }
&lt;/style&gt;
      </div>

      <h2>🛠 Development Tools</h2>
      <p>
        <a href="#" class="btn">📚 Documentation</a>
        <a href="#" class="btn">🧪 Testing Guide</a>
        <a href="#" class="btn">🔧 API Reference</a>
        <a href="#" class="btn">🚀 Examples</a>
      </p>

      <h2>🏗 Architecture</h2>
      <p>ACK Framework follows a modern, modular architecture:</p>
      <ul>
        <li><strong>@ack/compiler</strong> - Compile-time optimizations and code generation</li>
        <li><strong>@ack/runtime</strong> - Minimal runtime with reactivity system</li>
        <li><strong>@ack/kit</strong> - Development tools and build system</li>
        <li><strong>@ack/plugin-system</strong> - Extensible plugin architecture</li>
        <li><strong>@ack/vscode-extension</strong> - IDE integration and tooling</li>
      </ul>

      <h2>🎯 Philosophy</h2>
      <p>ACK Framework is built on these core principles:</p>
      <ul>
        <li><strong>Developer Experience First</strong> - Intuitive APIs and excellent tooling</li>
        <li><strong>Performance by Default</strong> - Zero-runtime overhead and optimizations</li>
        <li><strong>Type Safety</strong> - Full TypeScript support with strict checking</li>
        <li><strong>Modularity</strong> - Independent packages that work together seamlessly</li>
        <li><strong>Extensibility</strong> - Plugin system for custom functionality</li>
      </ul>
    </body>
    </html>
  `;
}
