# ACK Framework Translations

Bu klasör, ACK Framework'ün internationalization (i18n) sistemi için çeviri dosyalarını ve konfigürasyonlarını içerir.

## 🌐 Desteklenen Diller

| Dil Kodu | Dil | Durum | Çeviri Yüzdesi |
|----------|-----|-------|----------------|
| `en` | English | ✅ Complete | 100% |
| `tr` | Türkçe | ✅ Complete | 100% |
| `es` | Español | 🔄 In Progress | 85% |
| `fr` | Français | 🔄 In Progress | 70% |
| `de` | Deutsch | 🔄 In Progress | 65% |
| `ja` | 日本語 | 🔄 In Progress | 50% |
| `zh` | 中文 | 🔄 In Progress | 40% |

## 📁 Dosya Yapısı

```
translations/
├── en/                    # English translations
│   ├── common.json       # Common UI strings
│   ├── validation.json   # Validation messages
│   └── components.json   # Component-specific strings
├── tr/                   # Turkish translations
│   ├── common.json
│   ├── validation.json
│   └── components.json
└── es/                   # Spanish translations
    ├── common.json
    └── ...
```

## 📝 Çeviri Dosyası Formatı

### JSON Structure
```json
{
  "namespace": {
    "key": "translation",
    "nested": {
      "key": "nested translation"
    },
    "plural": {
      "zero": "no items",
      "one": "one item",
      "other": "{{count}} items"
    }
  }
}
```

### Variables
```json
{
  "greeting": "Hello {{name}}!",
  "message": "You have {{count}} new messages"
}
```

### Pluralization
```json
{
  "itemCount": {
    "zero": "no items",
    "one": "one item",
    "other": "{{count}} items"
  }
}
```

## 🔧 Kullanım

### JavaScript/TypeScript
```typescript
import { t } from '@ack/i18n';

console.log(t('common.greeting', { name: 'John' }));
// Output: "Hello John!"

console.log(t('common.itemCount', { count: 5 }));
// Output: "5 items"
```

### ACK Components
```ack
<script>
  import { t } from '@ack/i18n';

  export let userName = 'Guest';
</script>

<template>
  <div>
    <h1>{t('common.welcome')}</h1>
    <p>{t('common.greeting', { name: userName })}</p>
  </div>
</template>
```

## 🌍 Dil Değiştirme

### Client-Side
```typescript
import { setLanguage } from '@ack/i18n';

// Programmatically change language
setLanguage('es');

// Or detect from browser
setLanguage(navigator.language.split('-')[0]);
```

### Configuration
```typescript
// i18n.config.ts
import { createI18nConfig } from '@ack/i18n';

export const i18nConfig = createI18nConfig({
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'tr', 'es', 'fr', 'de'],
  autoDetect: true,
  useBrowserLanguage: true,
  namespace: ['common', 'validation', 'components']
});
```

## 📊 Çeviri İstatistikleri

### Coverage Report
```bash
# Generate translation coverage report
pnpm run i18n:coverage

# Check missing translations
pnpm run i18n:missing
```

### Translation Progress
- **Total Keys**: 1,250+
- **Translated Keys**: 1,100+
- **Missing Translations**: 150
- **Completion Rate**: 88%

## 🤝 Katkıda Bulunma

### Yeni Dil Ekleme

1. **Dil Klasörü Oluşturun**
```bash
mkdir translations/[lang-code]
```

2. **Base Dosyaları Kopyalayın**
```bash
cp translations/en/*.json translations/[lang-code]/
```

3. **Çevirileri Ekleyin**
```json
// translations/tr/common.json
{
  "greeting": "Merhaba {{name}}!",
  "welcome": "Hoş Geldiniz",
  "save": "Kaydet",
  "cancel": "İptal"
}
```

4. **Konfigürasyonu Güncelleyin**
```typescript
// i18n.config.ts
supportedLanguages: ['en', 'tr', 'es', /* new language */]
```

### Çeviri Güncelleme

1. **Translation Key'i Güncelleyin**
```bash
# Extract new keys from code
pnpm run i18n:extract

# Update existing translations
pnpm run i18n:update
```

2. **Pull Request Oluşturun**
```bash
git checkout -b feature/translation-update
git add translations/
git commit -m "feat: add Turkish translations"
git push origin feature/translation-update
```

## 🛠️ Araçlar

### Translation Management

#### Crowdin
ACK Framework, Crowdin ile çeviri yönetimi yapar.

- **Project**: [ACK Framework Crowdin](https://ack-framework.crowdin.com)
- **Integration**: GitHub ile otomatik sync
- **Quality**: Professional translator review

#### Translation Tools
```bash
# Translation validation
pnpm run i18n:validate

# Missing key detection
pnpm run i18n:missing

# Translation consistency check
pnpm run i18n:consistency
```

### Development Tools

#### i18n Plugin for VSCode
ACK Framework için VSCode extension'ı.

**Özellikler:**
- Syntax highlighting for translation files
- Auto-completion for translation keys
- Missing translation detection
- Context-aware suggestions

#### Translation Linter
```typescript
// .eslintrc.js
module.exports = {
  plugins: ['@ack/i18n'],
  rules: {
    '@ack/i18n/no-missing-translation': 'error',
    '@ack/i18n/no-unused-translation': 'warn',
    '@ack/i18n/consistent-translation-key': 'error'
  }
};
```

## 📚 En İyi Practices

### Translation Keys

#### ✅ İyi Practices
```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "nav.contact": "Contact",
  "form.submit": "Submit",
  "form.cancel": "Cancel",
  "error.network": "Network error",
  "error.validation": "Validation failed"
}
```

#### ❌ Kötü Practices
```json
{
  "Home": "Ana Sayfa",                    // Top-level keys
  "submit": "Gönder",                    // Inconsistent casing
  "There was an error": "Bir hata oluştu" // Sentence keys
}
```

### Variables
```json
{
  "welcome": "Welcome {{name}}!",
  "count": "You have {{count}} items",
  "date": "Today is {{date, date}}"
}
```

### Context
```json
{
  "button.save": "Save",
  "menu.save": "Save",
  "tooltip.save": "Save changes (Ctrl+S)",
  "status.saved": "Saved successfully"
}
```

## 🔍 Problem Çözme

### Common Issues

#### Missing Translation
```typescript
// Hata: Missing translation key
console.log(t('nonexistent.key'));

// Çözüm: Fallback key kullanın
console.log(t('nonexistent.key', { defaultValue: 'Fallback text' }));
```

#### Pluralization Issues
```json
// Hatalı
{
  "itemCount": "{{count}} item{{count !== 1 ? 's' : ''}}"
}

// Doğru
{
  "itemCount": {
    "zero": "no items",
    "one": "one item",
    "other": "{{count}} items"
  }
}
```

### Performance

#### Lazy Loading
```typescript
// Büyük dil dosyaları için lazy loading
import { loadTranslations } from '@ack/i18n';

const loadSpanish = async () => {
  await loadTranslations('es');
  setLanguage('es');
};
```

#### Translation Caching
```typescript
// Translation caching
const cachedTranslation = useMemo(() => {
  return t('expensive.key', variables);
}, [variables]);
```

## 📋 Translation Checklist

### Yeni Özellik Eklendiğinde
- [ ] Translation key'leri kodda kullanın
- [ ] Extract komutunu çalıştırın
- [ ] Base language (EN) çevirisini ekleyin
- [ ] Test coverage'ı kontrol edin

### Release Öncesi
- [ ] Tüm çeviriler complete mi?
- [ ] Consistency check yapıldı mı?
- [ ] Missing keys var mı?
- [ ] Performance test edildi mi?

## 📞 Destek

### Translation Team
- **Project Manager**: translations@ackframework.io
- **Translator Coordinator**: coord@ackframework.io
- **Technical Support**: tech-translations@ackframework.io

### Community Translation
- [Crowdin Project](https://ack-framework.crowdin.com)
- [GitHub Translation Issues](https://github.com/ack-framework/ack/issues?q=label:translation)
- [Discord Translation Channel](https://discord.gg/ack-framework-translations)

---

## 🎯 Translation Goals

- **Quality**: Professional quality translations
- **Consistency**: Consistent terminology across all languages
- **Completeness**: 100% translation coverage
- **Performance**: Fast translation loading and switching
- **Accessibility**: Support for RTL languages and accessibility features

*ACK Framework'ü tüm dünya dillerinde erişilebilir kılmak için çalışıyoruz! 🌍*
