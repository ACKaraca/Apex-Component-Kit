# ACK Framework Terimler Sözlüğü

Bu döküman, ACK Framework ile ilgili terimleri ve kavramları açıklamaktadır.

## 📖 Terimler

### A

#### ACK (Apex Component Kit)
ACK Framework'ün tam adı. Modern web uygulamaları geliştirmek için tasarlanmış JavaScript framework'ü.

#### ACK Component
`.ack` uzantılı dosyalarda tanımlanan, HTML, CSS ve JavaScript'i birleştiren component yapısı.

```ack
<!-- Örnek ACK Component -->
<script>
  let count = 0;
</script>

<template>
  <div>
    <h1>Counter: {count}</h1>
    <button @click={() => count++}>Increment</button>
  </div>
</template>

<style>
  h1 { color: blue; }
  button { padding: 10px; }
</style>
```

#### AST (Abstract Syntax Tree)
Compiler tarafından oluşturulan, kodun yapısal temsili. Template ve script parsing için kullanılır.

#### Async Component
Asenkron olarak yüklenen component. Code splitting ve lazy loading için kullanılır.

```typescript
const AsyncComponent = lazyLoadComponent(() =>
  import('./components/HeavyComponent.ack')
);
```

### B

#### Bundle
Browser'da çalıştırılmak üzere paketlenmiş JavaScript, CSS ve diğer asset'ler.

#### Build Pipeline
Kaynak kodundan production-ready bundle'lar oluşturan süreç.

### C

#### Code Splitting
Uygulamayı daha küçük parçalara bölerek, sadece gerekli kodu yükleme tekniği.

#### Component Lifecycle
Component'in oluşturulmasından yok edilmesine kadar olan süreç.

1. **Mount**: Component DOM'a eklenir
2. **Update**: Props veya state değişir
3. **Unmount**: Component DOM'dan çıkarılır

#### Compiler
ACK component'lerini vanilla JavaScript'e çeviren araç.

#### CSR (Client-Side Rendering)
Sunucuda değil, tarayıcıda render işlemi.

### D

#### Data Binding
UI element'leri ile data arasındaki senkronizasyon.

#### Declarative Programming
Ne yapılacağını değil, nasıl yapılacağını tanımlama yaklaşımı.

```ack
<!-- Declarative -->
<template>
  {#if isVisible}
    <div>Content</div>
  {/if}
</template>
```

#### Dependency Injection
Component'lere bağımlılıklarını dışarıdan sağlama pattern'i.

### E

#### Edge Computing
Kullanıcıya yakın sunucularda işlem yapma yaklaşımı.

#### Effect
State değişikliklerine yanıt olarak çalışan yan etki fonksiyonları.

```typescript
createEffect(() => {
  console.log('Count changed:', count);
});
```

#### ESM (ECMAScript Modules)
Modern JavaScript module sistemi.

### F

#### Framework
Geliştirme sürecini kolaylaştıran araçlar ve kütüphaneler bütünü.

### G

#### GraphQL
API query language'i ve runtime'ı.

#### Guard
Route'lara erişimi kontrol eden fonksiyon.

```typescript
const authGuard: GuardFn = (ctx) => {
  if (!isAuthenticated()) {
    redirect('/login');
    return false;
  }
  return true;
};
```

### H

#### Hot Module Replacement (HMR)
Development sırasında kod değişikliklerini tarayıcıya anlık yansıtma.

#### Hydration
Server-side render edilmiş HTML'i interactive hale getirme işlemi.

### I

#### Imperative Programming
Nasıl yapılacağını adım adım tanımlama yaklaşımı.

#### Interceptor
API request/response'larını yakalayıp değiştiren middleware.

```typescript
const authInterceptor = createBearerTokenInterceptor(token);
api.useRequestInterceptor(authInterceptor);
```

#### Island Architecture
SSR ile CSR'nin karışımı. Sayfa statik olarak render edilir, interactive kısımlar ayrı ayrı hydrate edilir.

### J

#### JSX
JavaScript XML. HTML benzeri syntax'ı JavaScript içinde kullanma.

### L

#### Lazy Loading
Component veya modülleri ihtiyaç duyulduğunda yükleme.

```typescript
const LazyComponent = lazyLoadComponent(() =>
  import('./HeavyComponent.ack')
);
```

#### Lifecycle Hook
Component lifecycle'inde belirli noktalarda çalışan fonksiyonlar.

### M

#### Middleware
Request/response pipeline'ında çalışan fonksiyonlar.

```typescript
const loggerMiddleware: MiddlewareFn = (ctx, next) => {
  console.log('Request:', ctx.path);
  return next();
};
```

#### Module Federation
Mikro front-end'lerde farklı uygulamalar arasında modül paylaşımı.

### N

#### Node.js
Sunucu tarafında JavaScript çalıştırma ortamı.

### O

#### OpenAPI
API specification standard'ı. Swagger da bu standard'ı kullanır.

#### Observable
Zaman içinde değer üreten nesne.

### P

#### Plugin
Framework'ü genişleten modül.

#### Progressive Enhancement
Temel fonksiyonaliteyi sağladıktan sonra, gelişmiş özellikler ekleme yaklaşımı.

#### Props
Component'e dışarıdan geçirilen parametreler.

```ack
<!-- Parent component -->
<UserCard user={currentUser} onEdit={handleEdit} />

<!-- Child component -->
<script>
  export let user;
  export let onEdit;
</script>

<template>
  <div>
    <h3>{user.name}</h3>
    <button @click={onEdit}>Edit</button>
  </div>
</template>
```

#### PWA (Progressive Web App)
Web uygulamalarını native app gibi davranacak şekilde geliştirme.

### R

#### Reactive Programming
Data değişikliklerine otomatik olarak yanıt veren programlama paradigm'ı.

#### Router
Uygulama içinde sayfa navigasyonunu yöneten sistem.

#### Runtime
Uygulamanın çalışması sırasında görev yapan sistem.

### S

#### Server-Side Rendering (SSR)
Sunucu tarafında HTML oluşturma.

#### Single Page Application (SPA)
Tek sayfa üzerinden çalışan web uygulaması.

#### State Management
Uygulama durumunu merkezi olarak yönetme.

#### Store
State management için kullanılan merkezi depo.

```typescript
const store = createStore({
  state: { count: 0 },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});
```

#### Syntax Tree
Kaynak kodun hiyerarşik yapısı.

### T

#### Template
ACK component'lerinde HTML yapısını tanımlayan kısım.

#### Tree Shaking
Kullanılmayan kodu bundle'dan çıkarma optimizasyonu.

#### TypeScript
JavaScript'e statik tip desteği ekleyen superset.

### U

#### Universal Application
Hem client hem server'da çalışabilen uygulama.

### V

#### Vite
Modern, hızlı build tool'u.

#### Virtual DOM
Gerçek DOM'un hafızadaki temsili.

### W

#### Web Component
Modern web platformu API'si ile oluşturulan yeniden kullanılabilir component'ler.

#### Webpack
JavaScript module bundler'ı.

#### Web Vitals
Web sayfalarının performans metrikleri.

### Y

#### YAML (YAML Ain't Markup Language)
İnsan tarafından okunabilir data serialization format'ı.

---

## 🔗 İlgili Kavramlar

### Framework vs Library
- **Framework**: Kontrol akışı framework'te
- **Library**: Kontrol akışı geliştiricide

### Declarative vs Imperative
- **Declarative**: "Ne" yapılacağını belirtir
- **Imperative**: "Nasıl" yapılacağını belirtir

### Compilation vs Interpretation
- **Compilation**: Kod önce makine diline çevrilir
- **Interpretation**: Kod çalışırken çevrilir

## 📚 Daha Fazla Bilgi

Bu terimler hakkında daha detaylı bilgi için:

- [ACK Framework Dökümantasyonu](https://docs.ackframework.io)
- [Web Development Terimleri](https://developer.mozilla.org/en-US/docs/Glossary)
- [JavaScript Kavramları](https://javascript.info)

---

**Son Güncelleme:** 2025-10-23
**Versiyon:** 0.6.0
