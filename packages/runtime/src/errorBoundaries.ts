/**
 * @ack/runtime - Error Boundaries System
 * Türkçe: Component hatalarını yakalama ve gösterme sistemi
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorBoundaryConfig {
  fallback?: (error: Error, errorInfo: ErrorInfo) => any;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export class ErrorBoundary {
  private config: ErrorBoundaryConfig;
  private state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };
  private resetTimeoutId: number | null = null;

  constructor(config: ErrorBoundaryConfig = {}) {
    this.config = config;
  }

  /**
   * Error'ı yakala ve işle
   */
  catch(error: Error, errorInfo: ErrorInfo): any {
    this.state = {
      hasError: true,
      error,
      errorInfo
    };

    // Error callback çağır
    this.config.onError?.(error, errorInfo);

    // Fallback render
    if (this.config.fallback) {
      try {
        return this.config.fallback(error, errorInfo);
      } catch (fallbackError) {
        console.error('Error boundary fallback failed:', fallbackError);
        return this.renderDefaultFallback(error, errorInfo);
      }
    }

    return this.renderDefaultFallback(error, errorInfo);
  }

  /**
   * Error state'ini resetle
   */
  reset(): void {
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Belirli key'lerde reset yap
   */
  resetOnKeys(keys: Array<string | number>): void {
    const shouldReset = this.config.resetKeys?.some(key =>
      keys.includes(key)
    );

    if (shouldReset) {
      this.reset();
    }
  }

  /**
   * Props değiştiğinde reset yap
   */
  resetOnPropsChange(prevProps: any, nextProps: any): void {
    if (this.config.resetOnPropsChange) {
      const hasPropsChanged = Object.keys(nextProps).some(key =>
        prevProps[key] !== nextProps[key]
      );

      if (hasPropsChanged) {
        this.reset();
      }
    }
  }

  /**
   * Geçikmeli reset
   */
  resetAfterDelay(delay: number = 3000): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.reset();
    }, delay);
  }

  /**
   * Error state kontrolü
   */
  hasError(): boolean {
    return this.state.hasError;
  }

  /**
   * Error bilgilerini al
   */
  getError(): Error | null {
    return this.state.error;
  }

  /**
   * Error info'yu al
   */
  getErrorInfo(): ErrorInfo | null {
    return this.state.errorInfo;
  }

  /**
   * Tüm state'i al
   */
  getState(): ErrorBoundaryState {
    return { ...this.state };
  }

  /**
   * Varsayılan fallback render
   */
  private renderDefaultFallback(error: Error, errorInfo: ErrorInfo): any {
    return {
      element: (() => {
        const div = document.createElement('div');
        div.className = 'ack-error-boundary';
        div.innerHTML = `
          <div style="
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #ff6b6b;
            border-radius: 4px;
            background-color: #fff5f5;
            color: #c92a2a;
          ">
            <h3 style="margin: 0 0 10px 0; color: #c92a2a;">
              🚨 Bir Hata Oluştu
            </h3>
            <p style="margin: 0 0 10px 0;">
              <strong>Hata:</strong> ${error.message}
            </p>
            ${process.env.NODE_ENV === 'development' ? `
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: bold;">
                  Teknik Detaylar
                </summary>
                <pre style="
                  margin-top: 10px;
                  padding: 10px;
                  background: #f8f9fa;
                  border-radius: 4px;
                  font-size: 12px;
                  overflow: auto;
                ">${error.stack}</pre>
              </details>
            ` : ''}
            <button onclick="location.reload()" style="
              margin-top: 10px;
              padding: 8px 16px;
              background: #c92a2a;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">
              Sayfayı Yenile
            </button>
          </div>
        `;
        return div;
      })()
    };
  }
}

// ============================================================================
// REACT-STYLE ERROR BOUNDARY
// ============================================================================

export interface ErrorBoundaryProps {
  children: any;
  fallback?: (error: Error, errorInfo: ErrorInfo) => any;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export interface ErrorBoundaryComponent {
  new (props: ErrorBoundaryProps): {
    props: ErrorBoundaryProps;
    state: ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: any): void;
    resetErrorBoundary(): void;
    render(): any;
  };
}

/**
 * React-style Error Boundary component oluşturucu
 */
export function createErrorBoundaryComponent(
  baseComponent: any = class {}
): new (props: ErrorBoundaryProps) => {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState;
  componentDidCatch(error: Error, errorInfo: any): void;
  resetErrorBoundary(): void;
  render(): any;
} {
  return class extends baseComponent {
    private errorBoundary: ErrorBoundary;
    private resetKeys: Array<string | number> = [];

    constructor(props: ErrorBoundaryProps) {
      super(props);

      this.errorBoundary = new ErrorBoundary({
        fallback: props.fallback,
        onError: props.onError,
        resetKeys: props.resetKeys,
        resetOnPropsChange: props.resetOnPropsChange
      });

      this.state = {
        hasError: false,
        error: null,
        errorInfo: null
      };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      const processedErrorInfo: ErrorInfo = {
        componentStack: errorInfo.componentStack || '',
        errorBoundary: 'ACKErrorBoundary',
        errorBoundaryStack: new Error().stack || ''
      };

      this.setState({
        hasError: true,
        error,
        errorInfo: processedErrorInfo
      });

      this.errorBoundary.catch(error, processedErrorInfo);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
      const { resetKeys } = this.props;

      if (resetKeys && prevProps.resetKeys !== resetKeys) {
        this.errorBoundary.resetOnKeys(resetKeys);
      }

      this.errorBoundary.resetOnPropsChange(prevProps, this.props);
    }

    resetErrorBoundary = () => {
      this.errorBoundary.reset();
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    };

    render() {
      if (this.state.hasError) {
        return this.errorBoundary.getError();
      }

      return this.props.children;
    }
  } as any;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Error Boundary oluştur
 */
export function createErrorBoundary(config: ErrorBoundaryConfig = {}): ErrorBoundary {
  return new ErrorBoundary(config);
}

/**
 * Error Boundary component oluştur (factory function)
 */
export function createErrorBoundaryComponentWithProps(
  props: ErrorBoundaryProps
): any {
  const ComponentClass = createErrorBoundaryComponent(class {});
  return new ComponentClass(props);
}

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

/**
 * Global error handler
 */
export function setupGlobalErrorHandler(
  onError?: (error: Error, errorInfo: ErrorInfo) => void
): void {
  const originalErrorHandler = window.onerror;
  const originalUnhandledRejectionHandler = window.onunhandledrejection;

  window.onerror = (message, source, lineno, colno, error) => {
    const processedError = error || new Error(message as string);
    const errorInfo: ErrorInfo = {
      componentStack: `at ${source}:${lineno}:${colno}`,
      errorBoundary: 'GlobalErrorHandler'
    };

    onError?.(processedError, errorInfo);

    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }

    return false;
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    const errorInfo: ErrorInfo = {
      componentStack: 'Unhandled Promise Rejection',
      errorBoundary: 'GlobalErrorHandler'
    };

    onError?.(error, errorInfo);

    if (originalUnhandledRejectionHandler) {
      originalUnhandledRejectionHandler.call(window, event);
    }
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Error'ı logla ve report et
 */
export function logError(error: Error, errorInfo: ErrorInfo): void {
  console.group('🚨 Error Boundary Caught Error');
  console.error('Error:', error);
  console.error('Error Info:', errorInfo);
  console.groupEnd();

  // Production'da error reporting service'ine gönderilebilir
  if (process.env.NODE_ENV === 'production') {
    // errorReportingService.report(error, errorInfo);
  }
}

/**
 * Error stack trace'i parse et
 */
export function parseErrorStack(stack: string): Array<{
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}> {
  const lines = stack.split('\n').slice(1); // İlk satırı atla (error message)
  return lines.map(line => {
    const match = line.match(/at\s+(.+?)\s*\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        functionName: match[1],
        fileName: match[2],
        lineNumber: parseInt(match[3]),
        columnNumber: parseInt(match[4])
      };
    }
    return {
      functionName: line.trim(),
      fileName: 'unknown',
      lineNumber: 0,
      columnNumber: 0
    };
  });
}
