/**
 * ACK Component Explorer Provider
 * Türkçe: ACK component'larını keşfetmek için tree view provider
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ComponentExplorerProvider implements vscode.TreeDataProvider<ComponentItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ComponentItem | undefined | void> = new vscode.EventEmitter<ComponentItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ComponentItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor() {}

  /**
   * Tree item'ları al
   */
  getTreeItem(element: ComponentItem): vscode.TreeItem {
    return element;
  }

  /**
   * Children'ları al
   */
  async getChildren(element?: ComponentItem): Promise<ComponentItem[]> {
    if (!element) {
      // Root level - find ACK components
      return this.getACKComponents();
    }

    // Component level - return component details
    return this.getComponentDetails(element);
  }

  /**
   * ACK component'larını bul
   */
  private async getACKComponents(): Promise<ComponentItem[]> {
    const components: ComponentItem[] = [];

    if (!vscode.workspace.workspaceFolders) {
      return components;
    }

    // Search for .ack files
    const ackFiles = await vscode.workspace.findFiles('**/*.ack');

    for (const file of ackFiles) {
      const componentName = path.basename(file.fsPath, '.ack');
      const relativePath = vscode.workspace.asRelativePath(file.fsPath);

      const componentItem = new ComponentItem(
        componentName,
        vscode.TreeItemCollapsibleState.Collapsed,
        'component',
        file.fsPath,
        relativePath
      );

      components.push(componentItem);
    }

    return components;
  }

  /**
   * Component detaylarını al
   */
  private getComponentDetails(component: ComponentItem): ComponentItem[] {
    const details: ComponentItem[] = [];

    // Add file path
    details.push(new ComponentItem(
      `📁 ${component.filePath}`,
      vscode.TreeItemCollapsibleState.None,
      'file'
    ));

    // Add component actions
    details.push(new ComponentItem(
      'Open Component',
      vscode.TreeItemCollapsibleState.None,
      'action',
      component.filePath,
      'Open in editor'
    ));

    details.push(new ComponentItem(
      'Create Test',
      vscode.TreeItemCollapsibleState.None,
      'action',
      component.filePath,
      'Generate test file'
    ));

    return details;
  }

  /**
   * Refresh tree
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get component by path
   */
  getComponentByPath(filePath: string): ComponentItem | undefined {
    // Implementation for finding specific component
    return undefined;
  }
}

/**
 * Component item class
 */
export class ComponentItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: string,
    public readonly filePath?: string,
    public readonly description?: string
  ) {
    super(label, collapsibleState);

    this.tooltip = this.getTooltip();
    this.description = description;
    this.iconPath = this.getIcon();
    this.command = this.getCommand();
  }

  /**
   * Tooltip al
   */
  private getTooltip(): string {
    switch (this.type) {
      case 'component':
        return `ACK Component: ${this.label}`;
      case 'file':
        return `File: ${this.filePath}`;
      case 'action':
        return this.description || this.label;
      default:
        return this.label;
    }
  }

  /**
   * Icon al
   */
  private getIcon(): vscode.ThemeIcon | string {
    switch (this.type) {
      case 'component':
        return new vscode.ThemeIcon('symbol-class');
      case 'file':
        return new vscode.ThemeIcon('file');
      case 'action':
        return new vscode.ThemeIcon('tools');
      default:
        return new vscode.ThemeIcon('question');
    }
  }

  /**
   * Command al
   */
  private getCommand(): vscode.Command | undefined {
    if (this.type === 'action' && this.filePath) {
      return {
        command: 'vscode.open',
        title: 'Open Component',
        arguments: [vscode.Uri.file(this.filePath)]
      };
    }

    if (this.type === 'component' && this.filePath) {
      return {
        command: 'vscode.open',
        title: 'Open Component',
        arguments: [vscode.Uri.file(this.filePath)]
      };
    }

    return undefined;
  }

  /**
   * Context menu actions
   */
  get contextValue(): string {
    switch (this.type) {
      case 'component':
        return 'ackComponent';
      case 'file':
        return 'ackFile';
      case 'action':
        return 'ackAction';
      default:
        return 'ackItem';
    }
  }
}

/**
 * Component creation helper
 */
export class ComponentCreator {
  /**
   * Component oluştur
   */
  static async createComponent(componentName: string, targetPath?: string): Promise<string | null> {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder found');
      return null;
    }

    const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const componentsDir = path.join(workspacePath, 'src', 'components');
    const filePath = path.join(componentsDir, `${componentName}.ack`);

    // Klasörü oluştur
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
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

    try {
      fs.writeFileSync(filePath, componentContent);

      // VSCode'da dosyayı aç
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);

      return filePath;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create component: ${error}`);
      return null;
    }
  }

  /**
   * Test dosyası oluştur
   */
  static async createTestFile(componentName: string, componentPath: string): Promise<string | null> {
    const testDir = path.dirname(componentPath).replace('src', 'tests');
    const testFileName = `${componentName}.test.ts`;
    const testFilePath = path.join(testDir, testFileName);

    // Test klasörünü oluştur
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const testContent = `/**
 * ${componentName} Component Tests
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@ack/runtime';

describe('${componentName}', () => {
  it('should render component', () => {
    // Test implementation would go here
    expect(true).toBe(true);
  });

  it('should handle user interactions', () => {
    // Test implementation would go here
    expect(true).toBe(true);
  });
});`;

    try {
      fs.writeFileSync(testFilePath, testContent);

      // VSCode'da test dosyasını aç
      const document = await vscode.workspace.openTextDocument(testFilePath);
      await vscode.window.showTextDocument(document);

      return testFilePath;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create test file: ${error}`);
      return null;
    }
  }
}
