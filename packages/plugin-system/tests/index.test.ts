/**
 * @ack/plugin-system - Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PluginManager,
  createPlugin,
  createPluginManager,
  loggerPlugin,
  performancePlugin,
  analyticsPlugin,
  themePlugin,
  globalPluginRegistry,
  PluginUtils,
  type PluginConfig,
  type PluginInstance
} from '../src/index';

describe('Plugin System', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = createPluginManager();
  });

  describe('Plugin Creation', () => {
    it('should create a basic plugin', () => {
      const pluginConfig = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin'
      });

      expect(pluginConfig.name).toBe('test-plugin');
      expect(pluginConfig.version).toBe('1.0.0');
      expect(pluginConfig.description).toBe('Test plugin');
    });

    it('should create plugin with all fields', () => {
      const pluginConfig: PluginConfig = {
        name: 'advanced-plugin',
        version: '2.0.0',
        description: 'Advanced test plugin',
        author: 'Test Author',
        dependencies: {
          'other-plugin': '1.0.0'
        },
        hooks: {
          beforeMount: [() => {}],
          onError: [(error: Error) => {}]
        },
        commands: [
          {
            name: 'test-command',
            description: 'Test command',
            handler: async () => {}
          }
        ],
        components: [
          {
            name: 'TestComponent',
            component: class {}
          }
        ],
        middlewares: [
          {
            name: 'test-middleware',
            handler: (ctx: any, next: () => void) => next()
          }
        ],
        enhancers: [
          {
            name: 'test-enhancer',
            enhancer: {}
          }
        ]
      };

      expect(pluginConfig.name).toBe('advanced-plugin');
      expect(pluginConfig.dependencies?.['other-plugin']).toBe('1.0.0');
      expect(pluginConfig.hooks?.beforeMount).toHaveLength(1);
      expect(pluginConfig.commands).toHaveLength(1);
      expect(pluginConfig.components).toHaveLength(1);
      expect(pluginConfig.middlewares).toHaveLength(1);
      expect(pluginConfig.enhancers).toHaveLength(1);
    });
  });

  describe('Plugin Manager', () => {
    it('should register a plugin', async () => {
      const pluginConfig = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          beforeMount: [() => console.log('Before mount')]
        }
      });

      const pluginInstance = await pluginManager.registerPlugin(pluginConfig);

      expect(pluginInstance.config.name).toBe('test-plugin');
      expect(pluginInstance.isLoaded).toBe(true);
      expect(pluginManager.getPlugin('test-plugin')).toBeDefined();
    });

    it('should execute plugin hooks', async () => {
      const hookSpy = vi.fn();

      const pluginConfig = createPlugin({
        name: 'hook-test-plugin',
        version: '1.0.0',
        hooks: {
          beforeMount: [hookSpy]
        }
      });

      await pluginManager.registerPlugin(pluginConfig);

      await pluginManager.executeHook('beforeMount', { test: 'data' });

      expect(hookSpy).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should execute plugin commands', async () => {
      const commandSpy = vi.fn();

      const pluginConfig = createPlugin({
        name: 'command-test-plugin',
        version: '1.0.0',
        commands: [
          {
            name: 'test-command',
            description: 'Test command',
            handler: commandSpy
          }
        ]
      });

      await pluginManager.registerPlugin(pluginConfig);

      await pluginManager.executeCommand('test-command', { arg1: 'value1' });

      expect(commandSpy).toHaveBeenCalledWith({ arg1: 'value1' });
    });

    it('should unregister a plugin', async () => {
      const pluginConfig = createPlugin({
        name: 'unregister-test-plugin',
        version: '1.0.0'
      });

      await pluginManager.registerPlugin(pluginConfig);

      expect(pluginManager.getPlugin('unregister-test-plugin')).toBeDefined();

      const result = await pluginManager.unregisterPlugin('unregister-test-plugin');

      expect(result).toBe(true);
      expect(pluginManager.getPlugin('unregister-test-plugin')).toBeUndefined();
    });

    it('should handle plugin errors gracefully', async () => {
      const errorPluginConfig = createPlugin({
        name: 'error-plugin',
        version: '1.0.0',
        hooks: {
          beforeMount: [() => {
            throw new Error('Plugin error');
          }]
        }
      });

      await pluginManager.registerPlugin(errorPluginConfig);

      // Hook execution should not throw, but log error
      await expect(pluginManager.executeHook('beforeMount')).resolves.not.toThrow();
    });
  });

  describe('Built-in Plugins', () => {
    it('should have logger plugin', () => {
      expect(loggerPlugin.name).toBe('logger');
      expect(loggerPlugin.version).toBe('1.0.0');
      expect(loggerPlugin.hooks?.onError).toBeDefined();
      expect(loggerPlugin.hooks?.beforeMount).toBeDefined();
    });

    it('should have performance plugin', () => {
      expect(performancePlugin.name).toBe('performance-monitor');
      expect(performancePlugin.version).toBe('1.0.0');
      expect(performancePlugin.hooks?.beforeUpdate).toBeDefined();
      expect(performancePlugin.hooks?.afterUpdate).toBeDefined();
    });

    it('should have analytics plugin', () => {
      expect(analyticsPlugin.name).toBe('analytics');
      expect(analyticsPlugin.version).toBe('1.0.0');
      expect(analyticsPlugin.hooks?.onRouteChange).toBeDefined();
      expect(analyticsPlugin.hooks?.beforeMount).toBeDefined();
    });

    it('should have theme plugin', () => {
      expect(themePlugin.name).toBe('theme');
      expect(themePlugin.version).toBe('1.0.0');
      expect(themePlugin.components).toBeDefined();
      expect(themePlugin.components?.[0].name).toBe('ThemeProvider');
    });
  });

  describe('Global Plugin Registry', () => {
    it('should provide singleton instance', () => {
      const instance1 = globalPluginRegistry;
      const instance2 = globalPluginRegistry;

      expect(instance1).toBe(instance2);
    });

    it('should load built-in plugins', async () => {
      await globalPluginRegistry.loadBuiltInPlugins();

      const manager = globalPluginRegistry.getManager();
      const plugins = manager.getAllPlugins();

      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins.some(p => p.config.name === 'logger')).toBe(true);
      expect(plugins.some(p => p.config.name === 'performance-monitor')).toBe(true);
    });
  });

  describe('Plugin Utils', () => {
    it('should check plugin dependencies', () => {
      const pluginConfig = createPlugin({
        name: 'dependency-test',
        version: '1.0.0',
        dependencies: {
          'other-plugin': '1.0.0',
          'another-plugin': '2.0.0'
        }
      });

      const installedPlugins = new Map([
        ['other-plugin', '1.0.0'],
        ['another-plugin', '2.0.0']
      ]);

      const result = PluginUtils.checkDependencies(pluginConfig, installedPlugins);
      expect(result).toBe(true);
    });

    it('should fail dependency check when missing', () => {
      const pluginConfig = createPlugin({
        name: 'dependency-test',
        version: '1.0.0',
        dependencies: {
          'missing-plugin': '1.0.0'
        }
      });

      const installedPlugins = new Map();

      const result = PluginUtils.checkDependencies(pluginConfig, installedPlugins);
      expect(result).toBe(false);
    });

    it('should extract plugin metadata', () => {
      const pluginConfig = createPlugin({
        name: 'metadata-test',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        dependencies: {
          'dep1': '1.0.0',
          'dep2': '2.0.0'
        }
      });

      const metadata = PluginUtils.extractMetadata(pluginConfig);

      expect(metadata.name).toBe('metadata-test');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toBe('Test description');
      expect(metadata.author).toBe('Test Author');
      expect(metadata.dependencies).toEqual(['dep1', 'dep2']);
    });
  });

  describe('Plugin Components', () => {
    it('should register and retrieve components', async () => {
      const testComponent = class TestComponent {};

      const pluginConfig = createPlugin({
        name: 'component-test-plugin',
        version: '1.0.0',
        components: [
          {
            name: 'TestComponent',
            component: testComponent,
            props: { test: 'value' }
          }
        ]
      });

      await pluginManager.registerPlugin(pluginConfig);

      const component = pluginManager.getComponent('TestComponent');
      expect(component).toBeDefined();
      expect(component?.component).toBe(testComponent);
      expect(component?.props?.test).toBe('value');
    });
  });

  describe('Plugin Middlewares', () => {
    it('should register and retrieve middlewares', async () => {
      const middlewareHandler = vi.fn((ctx: any, next: () => void) => next());

      const pluginConfig = createPlugin({
        name: 'middleware-test-plugin',
        version: '1.0.0',
        middlewares: [
          {
            name: 'test-middleware',
            handler: middlewareHandler,
            priority: 10
          }
        ]
      });

      await pluginManager.registerPlugin(pluginConfig);

      const middleware = pluginManager.getMiddleware('test-middleware');
      expect(middleware).toBeDefined();
      expect(middleware?.handler).toBe(middlewareHandler);
      expect(middleware?.priority).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin registration errors', async () => {
      const errorPluginConfig = createPlugin({
        name: 'error-plugin',
        version: '1.0.0',
        instance: () => {
          throw new Error('Plugin initialization failed');
        }
      });

      await expect(pluginManager.registerPlugin(errorPluginConfig)).rejects.toThrow();
    });

    it('should handle hook execution errors gracefully', async () => {
      const errorHook = () => {
        throw new Error('Hook execution failed');
      };

      const pluginConfig = createPlugin({
        name: 'error-hook-plugin',
        version: '1.0.0',
        hooks: {
          beforeMount: [errorHook]
        }
      });

      await pluginManager.registerPlugin(pluginConfig);

      // Should not throw, but handle error internally
      await expect(pluginManager.executeHook('beforeMount')).resolves.not.toThrow();
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should handle plugin loading and unloading', async () => {
      const loadSpy = vi.fn();
      const unloadSpy = vi.fn();

      const pluginManager = createPluginManager({
        onPluginLoad: loadSpy,
        onPluginUnload: unloadSpy
      });

      const pluginConfig = createPlugin({
        name: 'lifecycle-test-plugin',
        version: '1.0.0'
      });

      const plugin = await pluginManager.registerPlugin(pluginConfig);
      expect(loadSpy).toHaveBeenCalledWith(plugin);

      await pluginManager.unregisterPlugin('lifecycle-test-plugin');
      expect(unloadSpy).toHaveBeenCalledWith(plugin);
    });
  });
});
