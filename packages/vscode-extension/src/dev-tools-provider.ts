/**
 * ACK DevTools Provider
 * Türkçe: ACK debugging ve geliştirme araçları
 */

import * as vscode from 'vscode';

export class ACKDevToolsProvider implements vscode.WebviewViewProvider {
  private webview?: vscode.WebviewPanel;
  private context?: vscode.ExtensionContext;

  constructor() {}

  /**
   * Webview'i ayarla
   */
  setWebview(webview: vscode.WebviewPanel): void {
    this.webview = webview;

    this.webview.webview.onDidReceiveMessage(
      message => {
        switch (message.type) {
          case 'ready':
            this.sendInitialData();
            break;
          case 'request-data':
            this.sendComponentData();
            break;
        }
      },
      undefined,
      []
    );

    this.webview.onDidDispose(() => {
      this.webview = undefined;
    });
  }

  /**
   * Webview view provider
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this.context?.extensionPath || '')]
    };

    webviewView.webview.html = this.getWebviewContent();

    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.type) {
          case 'ready':
            this.sendInitialData();
            break;
          case 'refresh':
            this.sendComponentData();
            break;
        }
      },
      undefined,
      []
    );
  }

  /**
   * Extension context'i ayarla
   */
  setContext(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.webview) {
      this.webview.dispose();
    }
  }

  /**
   * Başlangıç verilerini gönder
   */
  private sendInitialData(): void {
    if (this.webview) {
      this.webview.webview.postMessage({
        type: 'initial-data',
        data: {
          version: '0.8.0',
          features: [
            'Reactive System',
            'Component Architecture',
            'Plugin System',
            'Virtual Scrolling',
            'Error Boundaries',
            'Portal System',
            'Web Workers',
            'WebAssembly Support'
          ],
          workspace: vscode.workspace.workspaceFolders?.[0]?.name || 'No workspace'
        }
      });
    }
  }

  /**
   * Component verilerini gönder
   */
  private sendComponentData(): void {
    if (this.webview) {
      // Find ACK files in workspace
      vscode.workspace.findFiles('**/*.ack').then(files => {
        const components = files.map(file => ({
          name: file.fsPath.split('/').pop()?.replace('.ack', ''),
          path: file.fsPath,
          size: 'Unknown'
        }));

        this.webview!.webview.postMessage({
          type: 'component-data',
          data: {
            components,
            totalComponents: components.length,
            totalFiles: files.length
          }
        });
      });
    }
  }

  /**
   * Webview içeriğini al
   */
  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ACK Dev Tools</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
            color: #333;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
          }

          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }

          .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }

          .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
          }

          .stat-label {
            color: #666;
            font-size: 0.9em;
          }

          .components-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px 0;
          }

          .component-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .component-item:last-child {
            border-bottom: none;
          }

          .component-name {
            font-weight: 500;
          }

          .component-path {
            color: #666;
            font-size: 0.8em;
            margin-top: 2px;
          }

          .button {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
          }

          .button:hover {
            background: #5a67d8;
          }

          .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin: 20px 0;
          }

          .feature-item {
            background: #e8f4f8;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            font-size: 0.9em;
          }

          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }

          .error {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 ACK Dev Tools</h1>
            <p>Framework debugging and development tools</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number" id="totalComponents">0</div>
              <div class="stat-label">Components</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="totalFiles">0</div>
              <div class="stat-label">ACK Files</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="frameworkVersion">0.8.0</div>
              <div class="stat-label">Version</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="workspaceName">Loading...</div>
              <div class="stat-label">Workspace</div>
            </div>
          </div>

          <div class="components-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2>📦 Components</h2>
              <button class="button" onclick="refreshComponents()">Refresh</button>
            </div>
            <div id="componentsList">
              <div class="loading">Loading components...</div>
            </div>
          </div>

          <div class="components-section">
            <h2>✨ Framework Features</h2>
            <div class="feature-list" id="featuresList">
              <div class="loading">Loading features...</div>
            </div>
          </div>

          <div class="components-section">
            <h2>🛠 Development Actions</h2>
            <button class="button" onclick="runDevServer()">Start Dev Server</button>
            <button class="button" onclick="runTests()">Run Tests</button>
            <button class="button" onclick="buildProject()">Build Project</button>
            <button class="button" onclick="showDocumentation()">Show Documentation</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Initialize
          vscode.postMessage({ type: 'ready' });

          // Message handler
          window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
              case 'initial-data':
                handleInitialData(message.data);
                break;
              case 'component-data':
                handleComponentData(message.data);
                break;
            }
          });

          function handleInitialData(data) {
            document.getElementById('frameworkVersion').textContent = data.version;
            document.getElementById('workspaceName').textContent = data.workspace;

            const featuresList = document.getElementById('featuresList');
            featuresList.innerHTML = data.features.map(feature =>
              \`<div class="feature-item">\${feature}</div>\`
            ).join('');
          }

          function handleComponentData(data) {
            document.getElementById('totalComponents').textContent = data.totalComponents;
            document.getElementById('totalFiles').textContent = data.totalFiles;

            const componentsList = document.getElementById('componentsList');
            if (data.components.length === 0) {
              componentsList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No ACK components found</div>';
            } else {
              componentsList.innerHTML = data.components.map(component => \`
                <div class="component-item">
                  <div>
                    <div class="component-name">\${component.name}</div>
                    <div class="component-path">\${component.path}</div>
                  </div>
                  <div>\${component.size}</div>
                </div>
              \`).join('');
            }
          }

          function refreshComponents() {
            vscode.postMessage({ type: 'refresh' });
          }

          function runDevServer() {
            vscode.postMessage({ type: 'command', command: 'ack.runDevServer' });
          }

          function runTests() {
            vscode.postMessage({ type: 'command', command: 'ack.runTests' });
          }

          function buildProject() {
            vscode.postMessage({ type: 'command', command: 'ack.buildProject' });
          }

          function showDocumentation() {
            vscode.postMessage({ type: 'command', command: 'ack.showDocumentation' });
          }

          // Auto refresh every 30 seconds
          setInterval(() => {
            vscode.postMessage({ type: 'refresh' });
          }, 30000);
        </script>
      </body>
      </html>
    `;
  }
}
