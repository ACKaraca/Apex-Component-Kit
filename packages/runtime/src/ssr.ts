/**
 * @ack/runtime - Server-Side Rendering System
 * Türkçe: Server-side rendering için SSR implementasyonu
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SSRConfig {
  template?: string;
  hydration?: boolean;
  streaming?: boolean;
  cache?: boolean;
  timeout?: number;
}

export interface SSRContext {
  url: string;
  userAgent?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  state?: any;
  meta?: Record<string, any>;
}

export interface SSRResult {
  html: string;
  state?: any;
  meta?: Record<string, any>;
  scripts?: string[];
  styles?: string[];
  hydrationData?: any;
}

export interface SSRComponent {
  renderToString(context: SSRContext): Promise<SSRResult>;
  renderToStream?(context: SSRContext): AsyncIterable<string>;
}

// ============================================================================
// SSR MANAGER
// ============================================================================

export class SSRManager {
  private config: SSRConfig;
  private template: string;
  private components: Map<string, SSRComponent> = new Map();
  private cache: Map<string, { html: string; timestamp: number }> = new Map();

  constructor(config: SSRConfig = {}) {
    this.config = {
      template: this.getDefaultTemplate(),
      hydration: true,
      streaming: false,
      cache: true,
      timeout: 10000,
      ...config
    };

    this.template = this.config.template || this.getDefaultTemplate();
  }

  /**
   * SSR template'i ayarla
   */
  setTemplate(template: string): void {
    this.template = template;
  }

  /**
   * SSR component kaydet
   */
  registerComponent(name: string, component: SSRComponent): void {
    this.components.set(name, component);
  }

  /**
   * SSR component kaldır
   */
  unregisterComponent(name: string): boolean {
    return this.components.delete(name);
  }

  /**
   * Server-side rendering
   */
  async render(context: SSRContext): Promise<SSRResult> {
    const cacheKey = this.generateCacheKey(context);

    // Cache kontrolü
    if (this.config.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 dakika cache
        return {
          html: cached.html,
          cached: true
        } as SSRResult;
      }
    }

    try {
      const result = await this.renderToString(context);

      // Cache'e kaydet
      if (this.config.cache) {
        this.cache.set(cacheKey, {
          html: result.html,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('SSR rendering error:', error);
      throw error;
    }
  }

  /**
   * String olarak render et
   */
  private async renderToString(context: SSRContext): Promise<SSRResult> {
    // Component'ları render et
    const componentResults = await Promise.all(
      Array.from(this.components.values()).map(component =>
        component.renderToString(context)
      )
    );

    // HTML'i birleştir
    const combinedHtml = this.combineComponentResults(componentResults);

    // Template'e yerleştir
    const finalHtml = this.injectIntoTemplate(combinedHtml, context);

    return {
      html: finalHtml,
      scripts: componentResults.flatMap(r => r.scripts || []),
      styles: componentResults.flatMap(r => r.styles || []),
      meta: componentResults.reduce((acc, r) => ({ ...acc, ...r.meta }), {}),
      hydrationData: this.config.hydration ? {
        state: context.state,
        components: componentResults.map(r => r.hydrationData)
      } : undefined
    };
  }

  /**
   * Component sonuçlarını birleştir
   */
  private combineComponentResults(results: SSRResult[]): string {
    return results.map(result => result.html).join('\n');
  }

  /**
   * Template'e yerleştir
   */
  private injectIntoTemplate(content: string, context: SSRContext): string {
    let html = this.template;

    // Content injection
    html = html.replace('{{content}}', content);

    // Meta injection
    if (context.meta) {
      Object.entries(context.meta).forEach(([key, value]) => {
        const metaRegex = new RegExp(`{{meta:${key}}}`, 'g');
        html = html.replace(metaRegex, String(value));
      });
    }

    // State injection
    if (context.state && this.config.hydration) {
      const stateScript = `<script data-ack-state type="application/json">${JSON.stringify(context.state)}</script>`;
      html = html.replace('</head>', `${stateScript}\n</head>`);
    }

    // Hydration script injection
    if (this.config.hydration) {
      const hydrationScript = `
        <script>
          window.__ACK_SSR__ = true;
          window.__ACK_STATE__ = ${context.state ? JSON.stringify(context.state) : 'null'};
        </script>
      `;
      html = html.replace('</body>', `${hydrationScript}\n</body>`);
    }

    return html;
  }

  /**
   * Cache key oluştur
   */
  private generateCacheKey(context: SSRContext): string {
    return `${context.url}:${context.userAgent || 'unknown'}:${JSON.stringify(context.state || {})}`;
  }

  /**
   * Varsayılan template al
   */
  private getDefaultTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{meta:title}}</title>
  <meta name="description" content="{{meta:description}}">
  {{styles}}
</head>
<body>
  <div id="app">{{content}}</div>
  {{scripts}}
</body>
</html>`;
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Tüm component'ları al
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.components.keys());
  }
}

// ============================================================================
// SSR COMPONENT BASE CLASS
// ============================================================================

export abstract class BaseSSRComponent implements SSRComponent {
  protected config: SSRConfig;

  constructor(config: SSRConfig = {}) {
    this.config = config;
  }

  /**
   * String olarak render et
   */
  async renderToString(context: SSRContext): Promise<SSRResult> {
    try {
      const html = await this.renderComponent(context);
      const styles = await this.renderStyles(context);
      const scripts = await this.renderScripts(context);

      return {
        html,
        styles: styles ? [styles] : [],
        scripts: scripts ? [scripts] : [],
        meta: this.getMeta(context)
      };
    } catch (error) {
      console.error('SSR component render error:', error);
      throw error;
    }
  }

  /**
   * Component HTML'ini render et
   */
  protected abstract renderComponent(context: SSRContext): Promise<string>;

  /**
   * Styles'ı render et
   */
  protected async renderStyles(context: SSRContext): Promise<string | null> {
    return null;
  }

  /**
   * Scripts'ı render et
   */
  protected async renderScripts(context: SSRContext): Promise<string | null> {
    return null;
  }

  /**
   * Meta bilgilerini al
   */
  protected getMeta(context: SSRContext): Record<string, any> {
    return {
      title: 'ACK Application',
      description: 'Server-side rendered ACK application'
    };
  }
}

// ============================================================================
// SSR UTILITIES
// ============================================================================

/**
 * SSR context oluştur
 */
export function createSSRContext(
  url: string,
  options: Partial<SSRContext> = {}
): SSRContext {
  return {
    url,
    userAgent: options.userAgent,
    cookies: options.cookies || {},
    headers: options.headers || {},
    state: options.state,
    meta: options.meta || {}
  };
}

/**
 * SSR manager oluştur
 */
export function createSSRManager(config?: SSRConfig): SSRManager {
  return new SSRManager(config);
}

/**
 * SSR streaming helper
 */
export class SSRStreamingHelper {
  private encoder = new TextEncoder();

  /**
   * HTML'i stream olarak yaz
   */
  async *streamHTML(html: string): AsyncIterable<Uint8Array> {
    const chunks = this.splitHTML(html);

    for (const chunk of chunks) {
      yield this.encoder.encode(chunk);
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * HTML'i chunk'lara böl
   */
  private splitHTML(html: string): string[] {
    // Simple chunking - in real implementation would be more sophisticated
    const chunks: string[] = [];
    const lines = html.split('\n');

    for (let i = 0; i < lines.length; i += 5) {
      chunks.push(lines.slice(i, i + 5).join('\n') + '\n');
    }

    return chunks;
  }
}

/**
 * SSR performance monitoring
 */
export class SSRPerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  /**
   * SSR render time'ı ölç
   */
  async measureSSR<T>(
    name: string,
    ssrFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await ssrFn();
    const end = performance.now();

    const duration = end - start;

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    this.measurements.get(name)!.push(duration);

    return result;
  }

  /**
   * Ortalama süre al
   */
  getAverageTime(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;

    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  /**
   * Tüm measurement'ları al
   */
  getAllMeasurements(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    this.measurements.forEach((measurements, name) => {
      result[name] = [...measurements];
    });
    return result;
  }

  /**
   * Performance report oluştur
   */
  generateReport(): string {
    const report: string[] = [];
    report.push('🚀 SSR Performance Report');
    report.push('========================');

    this.measurements.forEach((measurements, name) => {
      const avg = this.getAverageTime(name);
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);

      report.push(`\n📊 ${name}:`);
      report.push(`  Average: ${avg.toFixed(2)}ms`);
      report.push(`  Min: ${min.toFixed(2)}ms`);
      report.push(`  Max: ${max.toFixed(2)}ms`);
      report.push(`  Calls: ${measurements.length}`);
    });

    return report.join('\n');
  }
}

/**
 * SSR security utilities
 */
export class SSRSecurityUtils {
  /**
   * XSS prevention için HTML escape
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Content Security Policy header oluştur
   */
  static generateCSPHeader(options: {
    allowInlineStyles?: boolean;
    allowInlineScripts?: boolean;
    allowEval?: boolean;
  } = {}): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ];

    if (!options.allowInlineStyles) {
      directives[2] = "style-src 'self'";
    }

    if (!options.allowInlineScripts) {
      directives[1] = "script-src 'self'";
    }

    if (!options.allowEval) {
      directives[1] = directives[1].replace("'unsafe-eval'", '');
    }

    return directives.join('; ');
  }

  /**
   * Security headers oluştur
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.generateCSPHeader(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
}

// ============================================================================
// SSR MIDDLEWARE
// ============================================================================

/**
 * Express middleware for SSR
 */
export function createSSRMiddleware(ssrManager: SSRManager) {
  return async (req: any, res: any, next: () => void) => {
    try {
      const context: SSRContext = {
        url: req.url,
        userAgent: req.headers['user-agent'],
        cookies: req.cookies || {},
        headers: req.headers,
        state: req.state || {}
      };

      const result = await ssrManager.render(context);

      // Security headers ekle
      const securityHeaders = SSRSecurityUtils.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(result.html);
    } catch (error) {
      console.error('SSR middleware error:', error);
      next();
    }
  };
}

/**
 * Koa middleware for SSR
 */
export function createSSRKoaMiddleware(ssrManager: SSRManager) {
  return async (ctx: any, next: () => Promise<void>) => {
    try {
      const context: SSRContext = {
        url: ctx.url,
        userAgent: ctx.headers['user-agent'],
        cookies: ctx.cookies || {},
        headers: ctx.headers,
        state: ctx.state || {}
      };

      const result = await ssrManager.render(context);

      // Security headers ekle
      const securityHeaders = SSRSecurityUtils.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        ctx.set(key, value);
      });

      ctx.type = 'text/html; charset=utf-8';
      ctx.body = result.html;
    } catch (error) {
      console.error('SSR Koa middleware error:', error);
      ctx.throw(500, 'SSR rendering failed');
    }
  };
}
