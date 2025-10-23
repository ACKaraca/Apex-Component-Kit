/**
 * @ack/i18n - Internationalization System
 * Türkçe: Multi-language support, RTL, translation management
 */

// ============================================================================
// TYPES
// ============================================================================

export interface I18nConfig {
  defaultLocale: string;
  fallbackLocale?: string;
  supportedLocales: string[];
  rtlLocales?: string[];
  messages?: Record<string, Record<string, string>>;
  interpolation?: {
    prefix?: string;
    suffix?: string;
  };
  pluralization?: {
    rules?: Record<string, (count: number) => string>;
  };
  dateTimeFormat?: {
    locale?: string;
    options?: Intl.DateTimeFormatOptions;
  };
  numberFormat?: {
    locale?: string;
    options?: Intl.NumberFormatOptions;
  };
}

export interface TranslationContext {
  locale: string;
  count?: number;
  [key: string]: any;
}

export interface I18nInstance {
  locale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  rtlLocales: string[];
  messages: Record<string, Record<string, string>>;
}

export interface I18nManager {
  t(key: string, context?: TranslationContext): string;
  t(key: string, count?: number): string;
  setLocale(locale: string): void;
  getLocale(): string;
  isRTL(locale?: string): boolean;
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatCurrency(value: number, currency?: string, locale?: string): string;
  addMessages(locale: string, messages: Record<string, string>): void;
  loadMessages(locale: string, messages: Record<string, string>): Promise<void>;
  getAvailableLocales(): string[];
  getMissingKeys(locale: string): string[];
}

// ============================================================================
// I18N MANAGER
// ============================================================================

export class I18nManagerImpl implements I18nManager {
  private config: Required<I18nConfig>;
  private instance: I18nInstance;
  private missingKeys: Set<string> = new Set();

  constructor(config: I18nConfig) {
    this.config = {
      defaultLocale: 'en',
      fallbackLocale: 'en',
      supportedLocales: ['en'],
      rtlLocales: ['ar', 'he', 'fa', 'ur'],
      messages: {},
      interpolation: {
        prefix: '{',
        suffix: '}'
      },
      pluralization: {
        rules: {
          en: (count: number) => count === 1 ? 'one' : 'other',
          tr: (count: number) => count === 1 ? 'one' : 'other',
          ru: (count: number) => {
            if (count % 10 === 1 && count % 100 !== 11) return 'one';
            if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'few';
            return 'other';
          }
        }
      },
      dateTimeFormat: {
        locale: 'en-US',
        options: {}
      },
      numberFormat: {
        locale: 'en-US',
        options: {}
      }
    };

    // Override with provided config
    if (config.defaultLocale) this.config.defaultLocale = config.defaultLocale;
    if (config.fallbackLocale) this.config.fallbackLocale = config.fallbackLocale;
    if (config.supportedLocales) this.config.supportedLocales = config.supportedLocales;
    if (config.rtlLocales) this.config.rtlLocales = config.rtlLocales;
    if (config.messages) this.config.messages = config.messages;
    if (config.interpolation) this.config.interpolation = { ...this.config.interpolation, ...config.interpolation };
    if (config.pluralization) this.config.pluralization = { ...this.config.pluralization, ...config.pluralization };
    if (config.dateTimeFormat) this.config.dateTimeFormat = { ...this.config.dateTimeFormat, ...config.dateTimeFormat };
    if (config.numberFormat) this.config.numberFormat = { ...this.config.numberFormat, ...config.numberFormat };

    this.instance = {
      locale: this.config.defaultLocale,
      fallbackLocale: this.config.fallbackLocale,
      supportedLocales: this.config.supportedLocales,
      rtlLocales: this.config.rtlLocales,
      messages: this.config.messages || {}
    };
  }

  /**
   * Translation al
   */
  t(key: string, context?: TranslationContext): string;
  t(key: string, count?: number): string;
  t(key: string, context?: TranslationContext | number): string {
    const count = typeof context === 'number' ? context : context?.count;
    const interpolationContext: TranslationContext = typeof context === 'object' ? context : { locale: this.instance.locale };

    // Get translation message
    let message = this.getMessage(key, this.instance.locale);

    // Fallback to fallback locale
    if (!message && this.instance.fallbackLocale !== this.instance.locale) {
      message = this.getMessage(key, this.instance.fallbackLocale);
    }

    // Track missing keys
    if (!message) {
      this.missingKeys.add(key);
      return key; // Return key as fallback
    }

    // Handle pluralization
    if (count !== undefined) {
      message = this.handlePluralization(message, count);
    }

    // Handle interpolation
    message = this.handleInterpolation(message, interpolationContext);

    return message;
  }

  /**
   * Message'ı locale'den al
   */
  private getMessage(key: string, locale: string): string | null {
    const keys = key.split('.');
    let current: any = this.instance.messages[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Pluralization işle
   */
  private handlePluralization(message: string, count: number): string {
    const pluralRegex = /\{(\w+)}\s*\{(\w+)}\s*\{(\w+)}\}/;
    const match = message.match(pluralRegex);

    if (match) {
      const [, singular, plural, zero] = match;
      const rule = this.config.pluralization.rules?.[this.instance.locale] || ((n: number) => n === 1 ? 'one' : 'other');

      switch (rule(count)) {
        case 'zero':
          return message.replace(pluralRegex, zero || plural);
        case 'one':
          return message.replace(pluralRegex, singular);
        case 'other':
        default:
          return message.replace(pluralRegex, plural);
      }
    }

    return message;
  }

  /**
   * Interpolation işle
   */
  private handleInterpolation(message: string, context: TranslationContext): string {
    const { prefix, suffix } = this.config.interpolation;

    return message.replace(
      new RegExp(`${prefix}(\\w+)${suffix}`, 'g'),
      (match, key) => {
        return context[key] !== undefined ? String(context[key]) : match;
      }
    );
  }

  /**
   * Locale ayarla
   */
  setLocale(locale: string): void {
    if (this.instance.supportedLocales.includes(locale)) {
      this.instance.locale = locale;
      this.updateDocumentDirection();
    } else {
      console.warn(`Unsupported locale: ${locale}. Supported locales: ${this.instance.supportedLocales.join(', ')}`);
    }
  }

  /**
   * Mevcut locale'ı al
   */
  getLocale(): string {
    return this.instance.locale;
  }

  /**
   * RTL kontrolü
   */
  isRTL(locale: string = this.instance.locale): boolean {
    return this.instance.rtlLocales.includes(locale);
  }

  /**
   * Document direction'ı güncelle
   */
  private updateDocumentDirection(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', this.isRTL() ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', this.instance.locale);
    }
  }

  /**
   * Date formatla
   */
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formatOptions = { ...this.config.dateTimeFormat.options, ...options };
    const locale = this.config.dateTimeFormat.locale || this.instance.locale;

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  }

  /**
   * Number formatla
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const formatOptions = { ...this.config.numberFormat.options, ...options };
    const locale = this.config.numberFormat.locale || this.instance.locale;

    return new Intl.NumberFormat(locale, formatOptions).format(value);
  }

  /**
   * Currency formatla
   */
  formatCurrency(value: number, currency: string = 'USD', locale?: string): string {
    const targetLocale = locale || this.config.numberFormat.locale || this.instance.locale;

    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency,
      ...this.config.numberFormat.options
    }).format(value);
  }

  /**
   * Messages ekle
   */
  addMessages(locale: string, messages: Record<string, string>): void {
    if (!this.instance.messages[locale]) {
      this.instance.messages[locale] = {};
    }

    Object.assign(this.instance.messages[locale], messages);
  }

  /**
   * Messages'ı async yükle
   */
  async loadMessages(locale: string, messages: Record<string, string>): Promise<void> {
    this.addMessages(locale, messages);
  }

  /**
   * Desteklenen locale'ları al
   */
  getAvailableLocales(): string[] {
    return [...this.instance.supportedLocales];
  }

  /**
   * Eksik key'leri al
   */
  getMissingKeys(locale: string = this.instance.locale): string[] {
    return Array.from(this.missingKeys);
  }

  /**
   * Instance'ı al
   */
  getInstance(): I18nInstance {
    return { ...this.instance };
  }

  /**
   * Config'i al
   */
  getConfig(): Required<I18nConfig> {
    return { ...this.config };
  }
}

// ============================================================================
// REACT-STYLE HOOKS
// ============================================================================

/**
 * useI18n hook
 */
export function useI18n(i18nManager: I18nManager): {
  t: (key: string, context?: TranslationContext) => string;
  locale: string;
  setLocale: (locale: string) => void;
  isRTL: boolean;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
} {
  return {
    t: i18nManager.t.bind(i18nManager),
    locale: i18nManager.getLocale(),
    setLocale: i18nManager.setLocale.bind(i18nManager),
    isRTL: i18nManager.isRTL(),
    formatDate: i18nManager.formatDate.bind(i18nManager),
    formatNumber: i18nManager.formatNumber.bind(i18nManager),
    formatCurrency: i18nManager.formatCurrency.bind(i18nManager)
  };
}

// ============================================================================
// TRANSLATION EXTRACTOR
// ============================================================================

export class TranslationExtractor {
  private messages: Map<string, Set<string>> = new Map();

  /**
   * Translation key'leri çıkar
   */
  extractFromCode(code: string): Map<string, Set<string>> {
    // Regex patterns for different translation function calls
    const patterns = [
      /t\(['"`]([^'"`]+)['"`]/g, // t('key')
      /t\(['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*\}\)/g, // t('key', { context })
      /\$t\(['"`]([^'"`]+)['"`]/g, // $t('key')
      /i18n\.t\(['"`]([^'"`]+)['"`]/g, // i18n.t('key')
      /useI18n\(\)\.t\(['"`]([^'"`]+)['"`]/g // useI18n().t('key')
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const key = match[1];
        const file = 'extracted'; // Would be actual file path

        if (!this.messages.has(file)) {
          this.messages.set(file, new Set());
        }
        this.messages.get(file)!.add(key);
      }
    });

    return this.messages;
  }

  /**
   * Translation dosyası oluştur
   */
  generateTranslationFile(locale: string): Record<string, string> {
    const result: Record<string, string> = {};

    this.messages.forEach((keys, file) => {
      keys.forEach(key => {
        result[key] = key; // Placeholder - would be actual translation
      });
    });

    return result;
  }

  /**
   * Eksik translation'ları bul
   */
  findMissingTranslations(
    baseLocale: string,
    targetLocale: string,
    baseMessages: Record<string, string>,
    targetMessages: Record<string, string>
  ): string[] {
    const missing: string[] = [];

    Object.keys(baseMessages).forEach(key => {
      if (!(key in targetMessages)) {
        missing.push(key);
      }
    });

    return missing;
  }
}

// ============================================================================
// BUILT-IN TRANSLATIONS
// ============================================================================

export const defaultTranslations: Record<string, Record<string, string>> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',

    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.settings': 'Settings',

    // Forms
    'form.required': 'This field is required',
    'form.invalid_email': 'Please enter a valid email address',
    'form.password_too_short': 'Password must be at least 8 characters',
    'form.passwords_dont_match': 'Passwords do not match',

    // Validation
    'validation.required': 'Required',
    'validation.email': 'Invalid email',
    'validation.min_length': 'Must be at least {min} characters',
    'validation.max_length': 'Must be no more than {max} characters',
    'validation.numeric': 'Must be a number',

    // Messages
    'message.success': 'Operation completed successfully',
    'message.error': 'An error occurred',
    'message.warning': 'Warning',
    'message.info': 'Information',

    // Buttons
    'button.submit': 'Submit',
    'button.reset': 'Reset',
    'button.back': 'Back',
    'button.next': 'Next',
    'button.previous': 'Previous',
    'button.finish': 'Finish',

    // Pagination
    'pagination.showing': 'Showing {start} to {end} of {total} results',
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.first': 'First',
    'pagination.last': 'Last',

    // Time
    'time.just_now': 'Just now',
    'time.minutes_ago': '{count} minutes ago',
    'time.hours_ago': '{count} hours ago',
    'time.days_ago': '{count} days ago',
    'time.weeks_ago': '{count} weeks ago',
    'time.months_ago': '{count} months ago',

    // Numbers
    'number.thousand': '{count}K',
    'number.million': '{count}M',
    'number.billion': '{count}B'
  },

  tr: {
    // Common
    'common.loading': 'Yükleniyor...',
    'common.error': 'Bir hata oluştu',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.create': 'Oluştur',
    'common.update': 'Güncelle',
    'common.search': 'Ara',
    'common.filter': 'Filtrele',
    'common.sort': 'Sırala',
    'common.export': 'Dışa Aktar',
    'common.import': 'İçe Aktar',

    // Navigation
    'nav.home': 'Ana Sayfa',
    'nav.about': 'Hakkında',
    'nav.contact': 'İletişim',
    'nav.settings': 'Ayarlar',

    // Forms
    'form.required': 'Bu alan zorunludur',
    'form.invalid_email': 'Geçerli bir e-posta adresi girin',
    'form.password_too_short': 'Şifre en az 8 karakter olmalıdır',
    'form.passwords_dont_match': 'Şifreler eşleşmiyor',

    // Validation
    'validation.required': 'Zorunlu',
    'validation.email': 'Geçersiz e-posta',
    'validation.min_length': 'En az {min} karakter olmalıdır',
    'validation.max_length': 'En fazla {max} karakter olmalıdır',
    'validation.numeric': 'Sayı olmalıdır',

    // Messages
    'message.success': 'İşlem başarıyla tamamlandı',
    'message.error': 'Bir hata oluştu',
    'message.warning': 'Uyarı',
    'message.info': 'Bilgi',

    // Buttons
    'button.submit': 'Gönder',
    'button.reset': 'Sıfırla',
    'button.back': 'Geri',
    'button.next': 'İleri',
    'button.previous': 'Önceki',
    'button.finish': 'Bitir',

    // Pagination
    'pagination.showing': '{total} sonuçtan {start}-{end} arası gösteriliyor',
    'pagination.previous': 'Önceki',
    'pagination.next': 'İleri',
    'pagination.first': 'İlk',
    'pagination.last': 'Son',

    // Time
    'time.just_now': 'Şimdi',
    'time.minutes_ago': '{count} dakika önce',
    'time.hours_ago': '{count} saat önce',
    'time.days_ago': '{count} gün önce',
    'time.weeks_ago': '{count} hafta önce',
    'time.months_ago': '{count} ay önce',

    // Numbers
    'number.thousand': '{count}K',
    'number.million': '{count}M',
    'number.billion': '{count}B'
  },

  ar: {
    // Common
    'common.loading': 'جار التحميل...',
    'common.error': 'حدث خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.update': 'تحديث',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.export': 'تصدير',
    'common.import': 'استيراد',

    // Navigation
    'nav.home': 'الرئيسية',
    'nav.about': 'حول',
    'nav.contact': 'اتصال',
    'nav.settings': 'إعدادات',

    // Forms
    'form.required': 'هذا الحقل مطلوب',
    'form.invalid_email': 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    'form.password_too_short': 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
    'form.passwords_dont_match': 'كلمات المرور غير متطابقة',

    // Validation
    'validation.required': 'مطلوب',
    'validation.email': 'بريد إلكتروني غير صحيح',
    'validation.min_length': 'يجب أن يكون {min} حرف على الأقل',
    'validation.max_length': 'يجب ألا يزيد عن {max} حرف',
    'validation.numeric': 'يجب أن يكون رقماً',

    // Messages
    'message.success': 'تم إكمال العملية بنجاح',
    'message.error': 'حدث خطأ',
    'message.warning': 'تحذير',
    'message.info': 'معلومات',

    // Buttons
    'button.submit': 'إرسال',
    'button.reset': 'إعادة تعيين',
    'button.back': 'رجوع',
    'button.next': 'التالي',
    'button.previous': 'السابق',
    'button.finish': 'إنهاء',

    // Pagination
    'pagination.showing': 'عرض {start} إلى {end} من {total} نتيجة',
    'pagination.previous': 'السابق',
    'pagination.next': 'التالي',
    'pagination.first': 'الأول',
    'pagination.last': 'الأخير',

    // Time
    'time.just_now': 'الآن',
    'time.minutes_ago': 'منذ {count} دقيقة',
    'time.hours_ago': 'منذ {count} ساعة',
    'time.days_ago': 'منذ {count} يوم',
    'time.weeks_ago': 'منذ {count} أسبوع',
    'time.months_ago': 'منذ {count} شهر',

    // Numbers
    'number.thousand': '{count}ألف',
    'number.million': '{count}مليون',
    'number.billion': '{count}مليار'
  }
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * I18n manager oluştur
 */
export function createI18nManager(config: I18nConfig): I18nManager {
  return new I18nManagerImpl(config);
}

/**
 * Translation extractor oluştur
 */
export function createTranslationExtractor(): TranslationExtractor {
  return new TranslationExtractor();
}

/**
 * Default i18n manager oluştur
 */
export function createDefaultI18nManager(): I18nManager {
  return createI18nManager({
    defaultLocale: 'en',
    supportedLocales: ['en', 'tr', 'ar'],
    rtlLocales: ['ar'],
    messages: defaultTranslations
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Locale detection utilities
 */
export const LocaleUtils = {
  /**
   * Browser locale'ını al
   */
  getBrowserLocale(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.language || 'en';
    }
    return 'en';
  },

  /**
   * Locale'i normalize et
   */
  normalizeLocale(locale: string): string {
    // Convert to lowercase and handle common variations
    const normalized = locale.toLowerCase().replace('_', '-');

    // Handle special cases
    if (normalized === 'en-us') return 'en';
    if (normalized === 'tr-tr') return 'tr';
    if (normalized === 'ar-sa') return 'ar';

    return normalized.split('-')[0];
  },

  /**
   * Locale compatibility kontrolü
   */
  isLocaleSupported(locale: string, supportedLocales: string[]): boolean {
    const normalized = this.normalizeLocale(locale);
    return supportedLocales.includes(normalized) ||
           supportedLocales.some(supported => supported.startsWith(normalized.split('-')[0]));
  },

  /**
   * Best matching locale bul
   */
  findBestLocale(preferredLocale: string, supportedLocales: string[]): string {
    const normalized = this.normalizeLocale(preferredLocale);
    const language = normalized.split('-')[0];

    // Exact match
    if (supportedLocales.includes(normalized)) {
      return normalized;
    }

    // Language match
    const languageMatch = supportedLocales.find(locale => locale.startsWith(language + '-'));
    if (languageMatch) {
      return languageMatch;
    }

    // Default to first supported locale
    return supportedLocales[0] || 'en';
  }
};

/**
 * RTL utilities
 */
export const RTLUtils = {
  /**
   * Element direction'ı ayarla
   */
  setElementDirection(element: HTMLElement, isRTL: boolean): void {
    element.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  },

  /**
   * CSS flip utilities for RTL
   */
  getRTLStyles(): Record<string, string> {
    return {
      marginLeft: 'marginRight',
      marginRight: 'marginLeft',
      paddingLeft: 'paddingRight',
      paddingRight: 'paddingLeft',
      left: 'right',
      right: 'left',
      textAlign: 'left', // Keep left-to-right text alignment
      float: 'left', // Keep left-to-right float
    };
  },

  /**
   * RTL-aware positioning
   */
  getPosition(isRTL: boolean, position: 'left' | 'right'): string {
    return isRTL ? (position === 'left' ? 'right' : 'left') : position;
  }
};

/**
 * Number and date formatting utilities
 */
export const FormatUtils = {
  /**
   * Relative time formatla
   */
  formatRelativeTime(date: Date, locale: string = 'en'): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;

    return date.toLocaleDateString(locale);
  },

  /**
   * Compact number formatla
   */
  formatCompactNumber(value: number, locale: string = 'en'): string {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  },

  /**
   * Duration formatla
   */
  formatDuration(milliseconds: number, locale: string = 'en'): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
};
