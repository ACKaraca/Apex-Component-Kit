# ACK Framework - Test Belgesi

**Versiyon**: 0.0.1  
**Durum**: Test Suite Tamamlandı ✅

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Test Çalıştırma](#test-çalıştırma)
3. [Test Yapısı](#test-yapısı)
4. [Test Detayları](#test-detayları)
5. [Hata Ayıklama](#hata-ayıklama)
6. [Best Practices](#best-practices)

---

## 🔍 Genel Bakış

ACK Framework'ün tüm bileşenleri kapsamlı unit ve integration testleriyle korunmaktadır.

### Test Özeti

```
Toplam Testler: 55+
├── Analyzer Tests:     12 ✓
├── Parser Tests:       26 ✓
└── Integration Tests:  17+ ✓
```

### Test Stack

- **Framework**: Vitest (Lightning-fast unit test framework)
- **Dil**: TypeScript
- **Mock**: Vitest built-in mocking
- **Coverage**: Compiler core functionality

---

## 🚀 Test Çalıştırma

### Tüm Testleri Çalıştır

```bash
# Root dizininden
pnpm --filter @ack/compiler test

# Ya da compiler dizininden
cd packages/compiler
pnpm test
```

### Watch Modunda Çalıştır

İçeriği değiştirdikçe testleri otomatik çalıştır:

```bash
pnpm test:watch
```

### Belirli Test Dosyasını Çalıştır

```bash
pnpm test analyzer.test.ts
pnpm test parser.test.ts
pnpm test integration.test.ts
```

### Belirli Test Grubunu Çalıştır

```bash
pnpm test -- -t "ReactivityAnalyzer"
pnpm test -- -t "DependencyGraph"
```

---

## 📁 Test Yapısı

```
packages/compiler/
├── tests/
│   ├── analyzer.test.ts           # Analyzer testleri (12 test)
│   ├── parser.test.ts             # Parser testleri (26 test)
│   └── integration.test.ts        # Integration testleri (17+ test)
├── src/
│   ├── analyzer/
│   ├── parser/
│   ├── codegen/
│   └── types/
└── vitest.config.ts (isteğe bağlı)
```

---

## 🧪 Test Detayları

### 1. Analyzer Tests (12 test)

#### ReactivityAnalyzer

- **should identify let declarations** - Let deklarasyonlarını tanımlama
  ```typescript
  Girdi: let x = 10; let y = 20;
  Çıktı: 2 reactive variable
  ```

- **should track variable references** - Değişken referanslarını izleme
  ```typescript
  Girdi: let count = 0; const doubled = count * 2;
  Çıktı: count trackle
  ```

- **should detect circular dependencies** - Döngüsel bağımlılıkları algılama
  ```typescript
  Girdi: let a = b; let b = a;
  Çıktı: Circular dependency tespit
  ```

- **should handle function calls** - Fonksiyon çağrılarını işleme
- **should identify computed properties** - Computed properties'i tanımlama

#### DependencyGraph

- **should create empty graph** - Boş graph oluşturma
- **should build graph from variables** - Değişkenlerden graph oluşturma
- **should provide topological sort** - Topological sıralama
- **should find affected variables** - Etkilenen değişkenleri bulma
- **should detect cycles** - Döngüleri algılama
- **should get node by name** - İsme göre node bulma
- **should return valid topological order** - Valid topological order'ı döndürme

### 2. Parser Tests (26 test)

#### TokenLexer (5 test)
- HTML tokenizasyonu
- Text content tokenizasyonu
- Attribute tokenizasyonu
- Interpolation braces
- Çoklu tag'lar

#### BlockParser (5 test)
- Script block parsing
- Template block parsing
- Style block parsing
- Eksik optional blocks
- Tüm blocks beraber

#### TemplateParser (6 test)
- Basit element parsing
- Variable extraction
- Event bindings
- Nested elements
- Çoklu variables
- Çoklu event bindings

#### StyleParser (5 test)
- CSS rules parsing
- Scoped CSS
- CSS properties
- Çoklu selectors
- CSS values

#### ComponentParser (5 test)
- Complete component parsing
- Reactive variables extraction
- Imports handling
- Component name extraction
- Components without style

### 3. Integration Tests (17+ test)

- Simple counter component compilation
- Todo component with loops
- Missing required blocks
- Empty script block
- Farklı formatlar (ESM, CJS)
- Source maps
- Karmaşık reactive dependencies
- Circular dependency detection
- SSR compilation
- Multiple event bindings
- Imports handling
- Scoped styles
- Empty template
- All used variables extraction
- Nested components
- Minification option
- Invalid syntax error messages

---

## 🔧 Hata Ayıklama

### Tek Bir Testi Çalıştır

```bash
pnpm test -- --reporter=verbose analyzer.test.ts
```

### Debug Modunda Çalıştır

```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs --run
```

Sonra Chrome DevTools'u aç:
```
chrome://inspect
```

### Verbose Çıktı

```bash
pnpm test -- --reporter=verbose
```

### Test Başarısızlıkları

Test başarısız olursa:

1. **Hata mesajını oku** - Vitest tam olarak neyin yanlış olduğunu gösteriyor
2. **Test kodunu kontrol et** - Expectations'ı doğru mu?
3. **Kaynak kodunu kontrol et** - Implementation'da sorun mu?
4. **Dependencies'i güncelle** - `pnpm install`
5. **Build'i temizle** - `rm -rf dist && pnpm build`

---

## 🎯 Best Practices

### Yeni Test Yazarken

1. **Açıklayıcı adlar kullan**
   ```typescript
   // ✓ İyi
   it('should detect circular dependencies in reactive variables', () => {})
   
   // ✗ Kötü
   it('test circular', () => {})
   ```

2. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should do something', () => {
     // Arrange - Test verisi hazırla
     const input = new MyClass();
     
     // Act - Testi çalıştır
     const result = input.doSomething();
     
     // Assert - Sonucu kontrol et
     expect(result).toBe(expected);
   });
   ```

3. **Gerçekçi test verileri kullan**
   ```typescript
   // ✓ İyi - Gerçek component gibi
   const source = `
     <script>let count = 0;</script>
     <template>{count}</template>
   `;
   
   // ✗ Kötü - Çok minimal
   const source = 'test';
   ```

4. **Edge case'leri test et**
   ```typescript
   // Boş input
   it('should handle empty input', () => {})
   
   // Büyük input
   it('should handle large datasets', () => {})
   
   // Özel karakterler
   it('should handle special characters', () => {})
   ```

5. **Error handling'i test et**
   ```typescript
   it('should throw error for invalid input', () => {
     expect(() => parser.parse(invalid)).toThrow();
   });
   ```

### Test Yazarken Kaçınılacaklar

- ❌ Global state'e güvenmek
- ❌ Timing'e bağlı testler
- ❌ Randomness
- ❌ Test'ler arasında bağımlılık
- ❌ File system işlemleri (mock kullan)
- ❌ Network işlemleri (mock kullan)

---

## 📊 Test Coverage Hedefleri

### Geçerli Coverage

- **Analyzer**: 100% coverage
- **Parser**: 90%+ coverage
- **Codegen**: 85%+ coverage

### Future Goals

- **Tüm packages**: 90%+ coverage
- **Integration tests**: Critical path coverage
- **E2E tests**: Real-world scenarios (Phase 2+)

---

## 🔄 CI/CD Integration

### GitHub Actions Örneği

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter @ack/compiler test
```

---

## 📚 Kaynaklar

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/)
- [ACK Compiler API](./packages/compiler/README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📝 Notlar

- Testler **5+ dakika** içinde tamamlanmalıdır
- Her test **bağımsız** olmalıdır
- Mock'lar **cleanup** edilmeli
- Flaky testler **immediately fix** edilmeli

---

**Son Güncelleme**: Ekim 2025  
**Durum**: ✅ Tamamlandı  
**Next Phase**: E2E Tests (Phase 2+)
