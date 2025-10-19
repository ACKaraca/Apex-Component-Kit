/**
 * @ack/runtime - Progressive Enhancement System
 * Türkçe: Progressive enhancement - temel işlevsellik olmadan çalışma
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressiveFeature {
  name: string;
  check: () => boolean;
  fallback?: () => void;
  enhance?: () => void;
}

export interface ProgressiveConfig {
  features: ProgressiveFeature[];
  gracefulDegradation?: boolean;
  autoEnhance?: boolean;
}

export interface EnhancementState {
  available: string[];
  unavailable: string[];
  degraded: string[];
}

// ============================================================================
// PROGRESSIVE ENHANCEMENT MANAGER
// ============================================================================

export class ProgressiveEnhancementManager {
  private features: Map<string, ProgressiveFeature> = new Map();
  private state: EnhancementState = {
    available: [],
    unavailable: [],
    degraded: []
  };
  private config: ProgressiveConfig;

  constructor(config: ProgressiveConfig) {
    this.config = config;
    this.initializeFeatures();
    this.detectFeatures();

    if (config.autoEnhance !== false) {
      this.autoEnhance();
    }
  }

  /**
   * Feature'ları kaydet
   */
  registerFeature(feature: ProgressiveFeature): void {
    this.features.set(feature.name, feature);
    this.detectFeature(feature);
  }

  /**
   * Tüm feature'ları başlat
   */
  private initializeFeatures(): void {
    this.config.features.forEach(feature => {
      this.registerFeature(feature);
    });
  }

  /**
   * Feature detection yap
   */
  private detectFeatures(): void {
    this.features.forEach(feature => {
      this.detectFeature(feature);
    });
  }

  /**
   * Tek bir feature'ı tespit et
   */
  private detectFeature(feature: ProgressiveFeature): void {
    try {
      if (feature.check()) {
        this.state.available.push(feature.name);
        feature.enhance?.();
      } else {
        this.state.unavailable.push(feature.name);
        if (this.config.gracefulDegradation !== false) {
          feature.fallback?.();
          this.state.degraded.push(feature.name);
        }
      }
    } catch (error) {
      console.warn(`Feature detection failed for ${feature.name}:`, error);
      this.state.unavailable.push(feature.name);
    }
  }

  /**
   * Auto enhancement çalıştır
   */
  private autoEnhance(): void {
    // Tüm available feature'ları enhance et
    this.state.available.forEach(featureName => {
      const feature = this.features.get(featureName);
      feature?.enhance?.();
    });
  }

  /**
   * Feature durumunu kontrol et
   */
  isFeatureAvailable(featureName: string): boolean {
    return this.state.available.includes(featureName);
  }

  /**
   * Tüm enhancement durumunu al
   */
  getEnhancementState(): EnhancementState {
    return { ...this.state };
  }

  /**
   * Manuel enhancement çalıştır
   */
  enhanceFeature(featureName: string): boolean {
    const feature = this.features.get(featureName);
    if (!feature) return false;

    if (this.isFeatureAvailable(featureName)) {
      feature.enhance?.();
      return true;
    }

    return false;
  }

  /**
   * Manuel fallback çalıştır
   */
  fallbackFeature(featureName: string): boolean {
    const feature = this.features.get(featureName);
    if (!feature) return false;

    feature.fallback?.();
    return true;
  }
}

// ============================================================================
// BUILT-IN FEATURE DETECTORS
// ============================================================================

/**
 * Web Workers desteği kontrolü
 */
export function hasWebWorkers(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * WebAssembly desteği kontrolü
 */
export function hasWebAssembly(): boolean {
  return typeof WebAssembly !== 'undefined';
}

/**
 * Service Worker desteği kontrolü
 */
export function hasServiceWorkers(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Intersection Observer desteği kontrolü
 */
export function hasIntersectionObserver(): boolean {
  return 'IntersectionObserver' in window;
}

/**
 * WebGL desteği kontrolü
 */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

/**
 * Local Storage desteği kontrolü
 */
export function hasLocalStorage(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Geolocation desteği kontrolü
 */
export function hasGeolocation(): boolean {
  return 'geolocation' in navigator;
}

/**
 * WebRTC desteği kontrolü
 */
export function hasWebRTC(): boolean {
  return 'RTCPeerConnection' in window;
}

/**
 * Modern JavaScript özellikleri kontrolü
 */
export function hasModernJS(): boolean {
  return (
    typeof Promise !== 'undefined' &&
    typeof Symbol !== 'undefined' &&
    typeof Map !== 'undefined' &&
    typeof Set !== 'undefined'
  );
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Progressive Enhancement Manager oluştur
 */
export function createProgressiveEnhancement(config: ProgressiveConfig): ProgressiveEnhancementManager {
  return new ProgressiveEnhancementManager(config);
}

/**
 * Varsayılan feature set ile Progressive Enhancement Manager oluştur
 */
export function createDefaultProgressiveEnhancement(autoEnhance: boolean = true): ProgressiveEnhancementManager {
  const defaultFeatures: ProgressiveFeature[] = [
    {
      name: 'web-workers',
      check: hasWebWorkers,
      enhance: () => console.log('Web Workers enabled'),
      fallback: () => console.log('Web Workers not available - using main thread')
    },
    {
      name: 'web-assembly',
      check: hasWebAssembly,
      enhance: () => console.log('WebAssembly enabled'),
      fallback: () => console.log('WebAssembly not available - using JavaScript')
    },
    {
      name: 'service-workers',
      check: hasServiceWorkers,
      enhance: () => console.log('Service Workers enabled'),
      fallback: () => console.log('Service Workers not available')
    },
    {
      name: 'intersection-observer',
      check: hasIntersectionObserver,
      enhance: () => console.log('Intersection Observer enabled'),
      fallback: () => console.log('Intersection Observer not available')
    },
    {
      name: 'webgl',
      check: hasWebGL,
      enhance: () => console.log('WebGL enabled'),
      fallback: () => console.log('WebGL not available - using Canvas 2D')
    },
    {
      name: 'local-storage',
      check: hasLocalStorage,
      enhance: () => console.log('Local Storage enabled'),
      fallback: () => console.log('Local Storage not available - using memory storage')
    },
    {
      name: 'modern-js',
      check: hasModernJS,
      enhance: () => console.log('Modern JavaScript features enabled'),
      fallback: () => console.log('Limited JavaScript features - using polyfills')
    }
  ];

  return createProgressiveEnhancement({
    features: defaultFeatures,
    gracefulDegradation: true,
    autoEnhance
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Browser capability detection utility
 */
export const BrowserCapabilities = {
  hasWebWorkers,
  hasWebAssembly,
  hasServiceWorkers,
  hasIntersectionObserver,
  hasWebGL,
  hasLocalStorage,
  hasGeolocation,
  hasWebRTC,
  hasModernJS
};

/**
 * Progressive enhancement durumu logla
 */
export function logEnhancementState(state: EnhancementState): void {
  console.group('🚀 Progressive Enhancement State');
  console.log('✅ Available:', state.available);
  console.log('❌ Unavailable:', state.unavailable);
  console.log('⚠️ Degraded:', state.degraded);
  console.groupEnd();
}
