/**
 * @ack/plugin-system - Plugin System API
 * Türkçe: Genişletilebilir plugin mimarisi
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PluginConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
  hooks?: PluginHooks;
  commands?: PluginCommand[];
  components?: PluginComponent[];
  middlewares?: PluginMiddleware[];
  enhancers?: PluginEnhancer[];
}

export interface PluginHooks {
  beforeMount?: HookFunction[];
  afterMount?: HookFunction[];
  beforeUnmount?: HookFunction[];
  afterUnmount?: HookFunction[];
  beforeUpdate?: HookFunction[];
  afterUpdate?: HookFunction[];
  onError?: HookFunction[];
  onRouteChange?: HookFunction[];
  onStateChange?: HookFunction[];
  [key: string]: HookFunction[] | undefined;
}

export interface PluginCommand {
  name: string;
  description: string;
  handler: CommandHandler;
  options?: CommandOption[];
}

export interface CommandOption {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any;
  description?: string;
}

export interface PluginComponent {
  name: string;
  component: any;
  props?: Record<string, any>;
}

export interface PluginMiddleware {
  name: string;
  handler: MiddlewareHandler;
  priority?: number;
}

export interface PluginEnhancer {
  name: string;
  enhancer: any;
  target?: string;
}

export type HookFunction = (...args: any[]) => void | Promise<void>;
export type CommandHandler = (args: Record<string, any>) => void | Promise<void>;
export type MiddlewareHandler = (ctx: any, next: () => void) => void | Promise<void>;

export interface PluginManagerConfig {
  autoLoad?: boolean;
  pluginDir?: string;
  registry?: PluginRegistry;
  onPluginLoad?: (plugin: PluginInstance) => void;
  onPluginUnload?: (plugin: PluginInstance) => void;
  onPluginError?: (plugin: PluginInstance, error: Error) => void;
}

export interface PluginInstance {
  config: PluginConfig;
  instance: any;
  isLoaded: boolean;
  hooks: Map<string, HookFunction[]>;
  commands: Map<string, PluginCommand>;
  components: Map<string, PluginComponent>;
  middlewares: Map<string, PluginMiddleware>;
  enhancers: Map<string, PluginEnhancer>;
}

export interface PluginRegistry {
  plugins: Map<string, PluginInstance>;
  hooks: Map<string, HookFunction[]>;
  commands: Map<string, PluginCommand>;
  components: Map<string, PluginComponent>;
  middlewares: Map<string, PluginMiddleware>;
  enhancers: Map<string, PluginEnhancer>;
}

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

export class PluginManager {
  private config: PluginManagerConfig;
  private registry: PluginRegistry = {
    plugins: new Map(),
    hooks: new Map(),
    commands: new Map(),
    components: new Map(),
    middlewares: new Map(),
    enhancers: new Map()
  };

  constructor(config: PluginManagerConfig = {}) {
    this.config = {
      autoLoad: true,
      ...config
    };
  }

  /**
   * Plugin kaydet ve yükle
   */
  async registerPlugin(pluginConfig: PluginConfig): Promise<PluginInstance> {
    const pluginInstance: PluginInstance = {
      config: pluginConfig,
      instance: null,
      isLoaded: false,
      hooks: new Map(),
      commands: new Map(),
      components: new Map(),
      middlewares: new Map(),
      enhancers: new Map()
    };

    try {
      // Plugin instance'ı oluştur
      pluginInstance.instance = await this.createPluginInstance(pluginConfig);

      // Plugin'ı registry'e kaydet
      this.registry.plugins.set(pluginConfig.name, pluginInstance);

      // Hook'ları kaydet
      this.registerPluginHooks(pluginInstance);

      // Command'ları kaydet
      this.registerPluginCommands(pluginInstance);

      // Component'ları kaydet
      this.registerPluginComponents(pluginInstance);

      // Middleware'leri kaydet
      this.registerPluginMiddlewares(pluginInstance);

      // Enhancer'ları kaydet
      this.registerPluginEnhancers(pluginInstance);

      pluginInstance.isLoaded = true;

      // Plugin yüklendi callback
      this.config.onPluginLoad?.(pluginInstance);

      return pluginInstance;
    } catch (error) {
      this.config.onPluginError?.(pluginInstance, error as Error);
      throw error;
    }
  }

  /**
   * Plugin instance'ı oluştur
   */
  private async createPluginInstance(pluginConfig: PluginConfig): Promise<any> {
    // Plugin factory function kontrolü
    if ((pluginConfig as any).instance && typeof (pluginConfig as any).instance === 'function') {
      return (pluginConfig as any).instance();
    }

    // Plugin constructor kontrolü
    if ((pluginConfig as any).constructor && typeof (pluginConfig as any).constructor === 'function') {
      return new (pluginConfig as any).constructor();
    }

    // Default plugin instance
    return {
      name: pluginConfig.name,
      version: pluginConfig.version,
      initialize: async () => {},
      destroy: async () => {}
    };
  }

  /**
   * Plugin hook'larını kaydet
   */
  private registerPluginHooks(plugin: PluginInstance): void {
    if (!plugin.config.hooks) return;

    Object.entries(plugin.config.hooks).forEach(([hookName, hookFunctions]) => {
      if (!hookFunctions || !Array.isArray(hookFunctions)) return;

      hookFunctions.forEach(hookFn => {
        // Plugin instance'ı bağla
        const boundHook = hookFn.bind(plugin.instance);

        // Global hook registry'e ekle
        if (!this.registry.hooks.has(hookName)) {
          this.registry.hooks.set(hookName, []);
        }
        this.registry.hooks.get(hookName)!.push(boundHook);

        // Plugin'ın kendi hook map'ine ekle
        if (!plugin.hooks.has(hookName)) {
          plugin.hooks.set(hookName, []);
        }
        plugin.hooks.get(hookName)!.push(boundHook);
      });
    });
  }

  /**
   * Plugin command'larını kaydet
   */
  private registerPluginCommands(plugin: PluginInstance): void {
    if (!plugin.config.commands) return;

    plugin.config.commands.forEach(command => {
      this.registry.commands.set(command.name, command);
      plugin.commands.set(command.name, command);
    });
  }

  /**
   * Plugin component'larını kaydet
   */
  private registerPluginComponents(plugin: PluginInstance): void {
    if (!plugin.config.components) return;

    plugin.config.components.forEach(component => {
      this.registry.components.set(component.name, component);
      plugin.components.set(component.name, component);
    });
  }

  /**
   * Plugin middleware'lerini kaydet
   */
  private registerPluginMiddlewares(plugin: PluginInstance): void {
    if (!plugin.config.middlewares) return;

    plugin.config.middlewares.forEach(middleware => {
      this.registry.middlewares.set(middleware.name, middleware);
      plugin.middlewares.set(middleware.name, middleware);
    });
  }

  /**
   * Plugin enhancer'larını kaydet
   */
  private registerPluginEnhancers(plugin: PluginInstance): void {
    if (!plugin.config.enhancers) return;

    plugin.config.enhancers.forEach(enhancer => {
      this.registry.enhancers.set(enhancer.name, enhancer);
      plugin.enhancers.set(enhancer.name, enhancer);
    });
  }

  /**
   * Plugin'ı kaldır
   */
  async unregisterPlugin(pluginName: string): Promise<boolean> {
    const plugin = this.registry.plugins.get(pluginName);
    if (!plugin) return false;

    try {
      // Plugin'ı temizle
      if (plugin.instance && typeof plugin.instance.destroy === 'function') {
        await plugin.instance.destroy();
      }

      // Hook'ları kaldır
      this.unregisterPluginHooks(plugin);

      // Command'ları kaldır
      this.unregisterPluginCommands(plugin);

      // Component'ları kaldır
      this.unregisterPluginComponents(plugin);

      // Middleware'leri kaldır
      this.unregisterPluginMiddlewares(plugin);

      // Enhancer'ları kaldır
      this.unregisterPluginEnhancers(plugin);

      // Plugin'ı registry'den kaldır
      this.registry.plugins.delete(pluginName);

      // Plugin kaldırıldı callback
      this.config.onPluginUnload?.(plugin);

      return true;
    } catch (error) {
      this.config.onPluginError?.(plugin, error as Error);
      return false;
    }
  }

  /**
   * Plugin hook'larını kaldır
   */
  private unregisterPluginHooks(plugin: PluginInstance): void {
    plugin.hooks.forEach((hookFunctions, hookName) => {
      const globalHooks = this.registry.hooks.get(hookName);
      if (globalHooks) {
        hookFunctions.forEach(hookFn => {
          const index = globalHooks.indexOf(hookFn);
          if (index > -1) {
            globalHooks.splice(index, 1);
          }
        });

        if (globalHooks.length === 0) {
          this.registry.hooks.delete(hookName);
        }
      }
    });
  }

  /**
   * Plugin command'larını kaldır
   */
  private unregisterPluginCommands(plugin: PluginInstance): void {
    plugin.commands.forEach((command, commandName) => {
      this.registry.commands.delete(commandName);
    });
  }

  /**
   * Plugin component'larını kaldır
   */
  private unregisterPluginComponents(plugin: PluginInstance): void {
    plugin.components.forEach((component, componentName) => {
      this.registry.components.delete(componentName);
    });
  }

  /**
   * Plugin middleware'lerini kaldır
   */
  private unregisterPluginMiddlewares(plugin: PluginInstance): void {
    plugin.middlewares.forEach((middleware, middlewareName) => {
      this.registry.middlewares.delete(middlewareName);
    });
  }

  /**
   * Plugin enhancer'larını kaldır
   */
  private unregisterPluginEnhancers(plugin: PluginInstance): void {
    plugin.enhancers.forEach((enhancer, enhancerName) => {
      this.registry.enhancers.delete(enhancerName);
    });
  }

  /**
   * Hook çalıştır
   */
  async executeHook(hookName: string, ...args: any[]): Promise<void> {
    const hooks = this.registry.hooks.get(hookName);
    if (!hooks || hooks.length === 0) return;

    const promises = hooks.map(hook => {
      try {
        const result = hook(...args);
        return result instanceof Promise ? result : Promise.resolve(result);
      } catch (error) {
        console.error(`Plugin hook ${hookName} error:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Command çalıştır
   */
  async executeCommand(commandName: string, args: Record<string, any> = {}): Promise<void> {
    const command = this.registry.commands.get(commandName);
    if (!command) {
      throw new Error(`Command ${commandName} not found`);
    }

    try {
      await command.handler(args);
    } catch (error) {
      console.error(`Plugin command ${commandName} error:`, error);
      throw error;
    }
  }

  /**
   * Component al
   */
  getComponent(componentName: string): PluginComponent | undefined {
    return this.registry.components.get(componentName);
  }

  /**
   * Middleware al
   */
  getMiddleware(middlewareName: string): PluginMiddleware | undefined {
    return this.registry.middlewares.get(middlewareName);
  }

  /**
   * Plugin al
   */
  getPlugin(pluginName: string): PluginInstance | undefined {
    return this.registry.plugins.get(pluginName);
  }

  /**
   * Tüm plugin'ları listele
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.registry.plugins.values());
  }

  /**
   * Registry'i al
   */
  getRegistry(): PluginRegistry {
    return { ...this.registry };
  }

  /**
   * Plugin yükleme durumunu kontrol et
   */
  isPluginLoaded(pluginName: string): boolean {
    const plugin = this.registry.plugins.get(pluginName);
    return plugin?.isLoaded || false;
  }

  /**
   * Tüm plugin'ları yükle
   */
  async loadAllPlugins(pluginConfigs: PluginConfig[]): Promise<void> {
    const promises = pluginConfigs.map(config => this.registerPlugin(config));
    await Promise.all(promises);
  }

  /**
   * Tüm plugin'ları kaldır
   */
  async unloadAllPlugins(): Promise<void> {
    const pluginNames = Array.from(this.registry.plugins.keys());
    const promises = pluginNames.map(name => this.unregisterPlugin(name));
    await Promise.all(promises);
  }
}

// ============================================================================
// PLUGIN FACTORY
// ============================================================================

/**
 * Plugin oluştur
 */
export function createPlugin(config: PluginConfig): PluginConfig {
  return {
    name: config.name,
    version: config.version || '1.0.0',
    description: config.description || '',
    author: config.author || '',
    dependencies: config.dependencies || {},
    hooks: config.hooks || {},
    commands: config.commands || [],
    components: config.components || [],
    middlewares: config.middlewares || [],
    enhancers: config.enhancers || []
  };
}

/**
 * Plugin Manager oluştur
 */
export function createPluginManager(config?: PluginManagerConfig): PluginManager {
  return new PluginManager(config);
}

// ============================================================================
// BUILT-IN PLUGINS
// ============================================================================

/**
 * Logger plugin
 */
export const loggerPlugin: PluginConfig = createPlugin({
  name: 'logger',
  version: '1.0.0',
  description: 'Logging plugin for ACK Framework',
  hooks: {
    onError: [
      (error: Error) => {
        console.error('[ACK Logger] Error occurred:', error);
      }
    ],
    beforeMount: [
      (component: any) => {
        console.log('[ACK Logger] Component mounting:', component?.constructor?.name || 'Unknown');
      }
    ],
    afterMount: [
      (component: any) => {
        console.log('[ACK Logger] Component mounted:', component?.constructor?.name || 'Unknown');
      }
    ]
  }
});

/**
 * Performance monitor plugin
 */
export const performancePlugin: PluginConfig = createPlugin({
  name: 'performance-monitor',
  version: '1.0.0',
  description: 'Performance monitoring plugin',
  hooks: {
    beforeUpdate: [
      (component: any) => {
        performance.mark(`${component?.constructor?.name || 'Unknown'}-update-start`);
      }
    ],
    afterUpdate: [
      (component: any) => {
        const markName = `${component?.constructor?.name || 'Unknown'}-update-end`;
        performance.mark(markName);
        performance.measure(
          `${component?.constructor?.name || 'Unknown'}-update`,
          `${component?.constructor?.name || 'Unknown'}-update-start`,
          markName
        );
      }
    ]
  }
});

/**
 * Analytics plugin
 */
export const analyticsPlugin: PluginConfig = createPlugin({
  name: 'analytics',
  version: '1.0.0',
  description: 'Analytics tracking plugin',
  hooks: {
    onRouteChange: [
      (route: string) => {
        console.log('[ACK Analytics] Route changed to:', route);
        // Here you would send data to analytics service
      }
    ],
    beforeMount: [
      (component: any) => {
        console.log('[ACK Analytics] Component view:', component?.constructor?.name || 'Unknown');
      }
    ]
  }
});

/**
 * Theme plugin
 */
export const themePlugin: PluginConfig = createPlugin({
  name: 'theme',
  version: '1.0.0',
  description: 'Theme management plugin',
  components: [
    {
      name: 'ThemeProvider',
      component: class ThemeProvider {
        private currentTheme: string = 'light';

        setTheme(theme: string) {
          this.currentTheme = theme;
          document.documentElement.setAttribute('data-theme', theme);
        }

        getTheme() {
          return this.currentTheme;
        }

        toggleTheme() {
          this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
        }
      }
    }
  ],
  hooks: {
    beforeMount: [
      () => {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('ack-theme');
        if (savedTheme) {
          document.documentElement.setAttribute('data-theme', savedTheme);
        }
      }
    ]
  }
});

// ============================================================================
// PLUGIN REGISTRY
// ============================================================================

/**
 * Plugin registry singleton
 */
class PluginRegistryManager {
  private static instance: PluginRegistryManager;
  private manager: PluginManager;

  private constructor() {
    this.manager = createPluginManager({
      onPluginLoad: (plugin) => {
        console.log(`Plugin loaded: ${plugin.config.name}@${plugin.config.version}`);
      },
      onPluginUnload: (plugin) => {
        console.log(`Plugin unloaded: ${plugin.config.name}@${plugin.config.version}`);
      },
      onPluginError: (plugin, error) => {
        console.error(`Plugin error in ${plugin.config.name}:`, error);
      }
    });
  }

  static getInstance(): PluginRegistryManager {
    if (!PluginRegistryManager.instance) {
      PluginRegistryManager.instance = new PluginRegistryManager();
    }
    return PluginRegistryManager.instance;
  }

  getManager(): PluginManager {
    return this.manager;
  }

  /**
   * Built-in plugin'ları yükle
   */
  async loadBuiltInPlugins(): Promise<void> {
    const builtInPlugins = [
      loggerPlugin,
      performancePlugin,
      analyticsPlugin,
      themePlugin
    ];

    await this.manager.loadAllPlugins(builtInPlugins);
  }
}

/**
 * Global plugin registry instance
 */
export const globalPluginRegistry = PluginRegistryManager.getInstance();

/**
 * Plugin utilities
 */
export const PluginUtils = {
  /**
   * Plugin dependency kontrolü
   */
  checkDependencies(pluginConfig: PluginConfig, installedPlugins: Map<string, string>): boolean {
    if (!pluginConfig.dependencies) return true;

    return Object.entries(pluginConfig.dependencies).every(([depName, requiredVersion]) => {
      const installedVersion = installedPlugins.get(depName);
      if (!installedVersion) return false;

      // Simple version comparison (could be enhanced with semver)
      return installedVersion === requiredVersion;
    });
  },

  /**
   * Plugin compatibility kontrolü
   */
  checkCompatibility(pluginConfig: PluginConfig, frameworkVersion: string): boolean {
    // Simple compatibility check (could be enhanced)
    return true;
  },

  /**
   * Plugin metadata çıkar
   */
  extractMetadata(pluginConfig: PluginConfig): {
    name: string;
    version: string;
    description: string;
    author: string;
    dependencies: string[];
  } {
    return {
      name: pluginConfig.name,
      version: pluginConfig.version,
      description: pluginConfig.description || '',
      author: pluginConfig.author || '',
      dependencies: Object.keys(pluginConfig.dependencies || {})
    };
  }
};
