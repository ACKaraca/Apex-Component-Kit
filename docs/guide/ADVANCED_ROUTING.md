# Advanced Routing & Middleware Sistemi

**Version**: 0.3.0  
**Phase**: Phase 3 - Advanced Features  
**Tarih**: Ekim 2025

---

## 📑 İçindekiler

1. [Giriş](#giriş)
2. [Temel Routing](#temel-routing)
3. [Middleware Sistemi](#middleware-sistemi)
4. [Route Guards](#route-guards)
5. [Navigation Hooks](#navigation-hooks)
6. [Nested Routes](#nested-routes)
7. [URL Parametreleri](#url-parametreleri)
8. [Örnekler](#örnekler)
9. [API Referansı](#api-referansı)

---

## Giriş

### Özellikleri

✅ **Middleware Pipeline** - İstek/yanıt döngüsünü kontrol et  
✅ **Route Guards** - Sayfaya erişimi sınırlandır  
✅ **Navigation Hooks** - Navigation öncesi/sonrası işlemler  
✅ **Nested Routes** - Alt sayfaları organize et  
✅ **URL Parametreleri** - Dinamik route'lar ve query string'ler  
✅ **Route Meta** - Rota bilgileri (başlık, roller, vb.)  
✅ **Authentication/Authorization** - Hazır middleware'lar  
✅ **Async Operations** - Asynchronous guard ve middleware'lar  

### Hızlı Başlangıç

```typescript
import { createAdvancedRouter, createAuthMiddleware } from '@ack/kit';

// Router oluştur
const router = createAdvancedRouter('./src');

// Middleware ekle
router.use(createAuthMiddleware(() => {
  return localStorage.getItem('token') !== null;
}));

// Navigation hooks
router.beforeEach((ctx) => {
  console.log(`Navigating to: ${ctx.path}`);
});

router.afterEach((ctx) => {
  console.log(`Navigated to: ${ctx.path}`);
});

// Route'a git
await router.navigate('/dashboard');
```

---

## Temel Routing

### Route Tanımı

```typescript
interface Route {
  path: string;                    // Route path'i (/user/:id)
  component: string;               // Component dosya yolu
  name?: string;                   // Route adı
  meta?: RouteMeta;               // Meta bilgileri
  children?: Route[];             // Alt route'lar
  beforeEnter?: GuardFn[];        // Giriş guards'ları
  beforeLeave?: GuardFn[];        // Çıkış guards'ları
}
```

### Route Meta

```typescript
interface RouteMeta {
  title?: string;                 // HTML başlığı
  description?: string;           // SEO açıklaması
  requiresAuth?: boolean;        // Kimlik doğrulama gerekli
  roles?: string[];              // İzin verilen roller
  layout?: string;               // Layout component'i
  preload?: boolean;             // Ön yükleme yap
  [key: string]: any;            // Özel properties
}
```

### Router Oluşturma

```typescript
import { createAdvancedRouter } from '@ack/kit';

// Otomatik discovery
const router = createAdvancedRouter('./src');

// Özel konfigürasyon
const router = createAdvancedRouter('./src', {
  basePath: '/app',
  middlewares: [authMiddleware],
  beforeEach: [(ctx) => console.log(`Gidiş: ${ctx.path}`)],
  afterEach: [(ctx) => console.log(`Geldi: ${ctx.path}`)]
});
```

### Navigation

```typescript
// Temel navigation
const success = await router.navigate('/dashboard');

// Replace (tarayıcı geçmişini değiştirme)
await router.navigate('/new-page', { replace: true });

// Geri/İleri
router.back();    // window.history.back()
router.forward();  // window.history.forward()
```

---

## Middleware Sistemi

### Middleware Nedir?

Middleware, her navigation sırasında çalışan fonksiyonlardır. **Express/Koa** modelinde işler.

### Middleware Oluşturma

```typescript
import { MiddlewareFn } from '@ack/kit';

const myMiddleware: MiddlewareFn = async (ctx, next) => {
  // İstek işleme öncesi
  console.log(`İstek: ${ctx.path}`);

  // Pipeline devam et
  await next();

  // İstek işleme sonrası
  console.log(`Tamamlandi: ${ctx.path}`);
};

router.use(myMiddleware);
```

### Middleware Örnek Senaryoları

#### 1. Logging

```typescript
const loggingMiddleware: MiddlewareFn = async (ctx, next) => {
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] ${ctx.path}`);
  
  await next();
  
  const duration = Date.now() - startTime;
  console.log(`[${duration}ms]`);
};

router.use(loggingMiddleware);
```

#### 2. Request Cancellation

```typescript
const conditionalMiddleware: MiddlewareFn = async (ctx, next) => {
  // İstek görmezden gel
  if (ctx.path.startsWith('/admin')) {
    // next() çağrılmadı = pipeline sonlanır
    return;
  }

  await next();
};

router.use(conditionalMiddleware);
```

#### 3. Data Loading

```typescript
const dataLoadingMiddleware: MiddlewareFn = async (ctx, next) => {
  // Veri yükle
  const data = await fetch(`/api${ctx.path}`);
  ctx.data = await data.json();

  await next();
};

router.use(dataLoadingMiddleware);
```

### Hazır Middleware'lar

#### Authentication

```typescript
import { createAuthMiddleware } from '@ack/kit';

const authMiddleware = createAuthMiddleware(() => {
  return !!localStorage.getItem('authToken');
});

router.use(authMiddleware);
```

#### RBAC (Role-Based Access Control)

```typescript
import { createRbacMiddleware } from '@ack/kit';

const rbacMiddleware = createRbacMiddleware(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles || [];
});

router.use(rbacMiddleware);
```

#### Analytics

```typescript
import { createAnalyticsMiddleware } from '@ack/kit';

const analyticsMiddleware = createAnalyticsMiddleware((path, title) => {
  // Google Analytics veya benzeri
  gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title
  });
});

router.use(analyticsMiddleware);
```

#### Page Title

```typescript
import { createPageTitleMiddleware } from '@ack/kit';

const titleMiddleware = createPageTitleMiddleware();
router.use(titleMiddleware);

// Route'a meta ekle
const routes: Route[] = [
  {
    path: '/products',
    component: 'pages/products.ack',
    meta: { title: 'Ürünler' }
  }
];
```

#### Loading State

```typescript
import { createLoadingMiddleware } from '@ack/kit';

let isLoading = false;

const loadingMiddleware = createLoadingMiddleware(
  () => { isLoading = true; },
  () => { isLoading = false; }
);

router.use(loadingMiddleware);
```

---

## Route Guards

### Guard Nedir?

Guard'lar, belirli route'lara erişimi kontrol eden fonksiyonlardır.

### Guard Oluşturma

```typescript
import { GuardFn } from '@ack/kit';

// Senkron guard
const simpleGuard: GuardFn = (ctx) => {
  return ctx.meta?.requiresAuth === false;
};

// Asenkron guard
const asyncGuard: GuardFn = async (ctx) => {
  const response = await fetch('/api/check-permission');
  return response.ok;
};
```

### Guard Kullanma

```typescript
const routes: Route[] = [
  {
    path: '/dashboard',
    component: 'pages/dashboard.ack',
    meta: { title: 'Kontrol Paneli', requiresAuth: true },
    beforeEnter: [asyncGuard]
  }
];
```

### Örnek: Authentication Guard

```typescript
const authGuard: GuardFn = async (ctx) => {
  if (!ctx.meta?.requiresAuth) {
    return true; // Erişim izni ver
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('Kimlik doğrulama gerekli');
    return false;
  }

  // Token'ı doğrula
  const response = await fetch('/api/verify-token', {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.ok;
};
```

### Örnek: Permission Guard

```typescript
const permissionGuard: GuardFn = async (ctx) => {
  const requiredRoles = ctx.meta?.roles;
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // İzin gerekli değil
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRoles = user.roles || [];

  const hasPermission = requiredRoles.some((role) =>
    userRoles.includes(role)
  );

  if (!hasPermission) {
    console.warn(`İzin yetersiz: ${requiredRoles.join(', ')}`);
  }

  return hasPermission;
};
```

### beforeLeave Guard

Route'dan ayrılmadan önce kontrol et (ör: unsaved changes):

```typescript
const unsavedChangesGuard: GuardFn = (ctx) => {
  if (hasUnsavedChanges) {
    return confirm('Kaydedilmemiş değişiklikler var. Çıkmak istiyor musunuz?');
  }
  return true;
};

const routes: Route[] = [
  {
    path: '/edit',
    component: 'pages/edit.ack',
    beforeLeave: [unsavedChangesGuard]
  }
];
```

---

## Navigation Hooks

### Hook'lar Nedir?

Hook'lar navigation yaşam döngüsünün belirli noktalarında çalışır.

### beforeEach Hook

Her navigasyondan **önce** çalışır:

```typescript
router.beforeEach(async (ctx) => {
  console.log(`Navigating to: ${ctx.path}`);
  
  // Analytics gönder
  analytics.track('navigation', { path: ctx.path });
  
  // Loading göster
  showLoadingSpinner();
});
```

### afterEach Hook

Her navigasyondan **sonra** çalışır:

```typescript
router.afterEach(async (ctx) => {
  console.log(`Navigated to: ${ctx.path}`);
  
  // Loading gizle
  hideLoadingSpinner();
  
  // Sayfanın başına kaydır
  window.scrollTo(0, 0);
});
```

### Hook Örnek Senaryoları

#### Progress Bar

```typescript
router.beforeEach((ctx) => {
  showProgressBar();
});

router.afterEach((ctx) => {
  completeProgressBar();
});
```

#### Scroll To Top

```typescript
router.afterEach((ctx) => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

#### Error Handling

```typescript
router.beforeEach(async (ctx) => {
  try {
    // Rota bilgisini yükle
    const data = await fetchRouteData(ctx.path);
    ctx.routeData = data;
  } catch (error) {
    console.error('Rota verileri yüklenemedi:', error);
    // Alternatif rota'ya yönlendir
    await router.navigate('/error');
  }
});
```

---

## Nested Routes

### Nested Route Yapısı

```typescript
const routes: Route[] = [
  {
    path: '/admin',
    component: 'pages/admin/layout.ack',
    meta: { title: 'Yönetim' },
    children: [
      {
        path: '/admin/users',
        component: 'pages/admin/users.ack',
        meta: { title: 'Kullanıcılar' }
      },
      {
        path: '/admin/settings',
        component: 'pages/admin/settings.ack',
        meta: { title: 'Ayarlar' }
      }
    ]
  }
];
```

### Parent Route Erişimi

```typescript
router.use(async (ctx, next) => {
  if (ctx.parent) {
    console.log(`Ana rota: ${ctx.parent.path}`);
    console.log(`Alt rota: ${ctx.path}`);
  }
  await next();
});
```

### Nested Layout Örneği

```typescript
// Admin Layout Component
<script>
  let currentPage = '';
  
  export function setCurrentPage(page) {
    currentPage = page;
  }
</script>

<template>
  <div class="admin-container">
    <aside class="sidebar">
      <nav>
        <a href="/admin/users">Kullanıcılar</a>
        <a href="/admin/settings">Ayarlar</a>
      </nav>
    </aside>
    
    <main class="content">
      <h1>{currentPage}</h1>
      <div id="child-route"></div>
    </main>
  </div>
</template>

<style>
  .admin-container {
    display: flex;
  }
  /* ... */
</style>
```

---

## URL Parametreleri

### Dinamik Parametreler

```typescript
// Tanım
const routes: Route[] = [
  {
    path: '/user/:id',
    component: 'pages/user/[id].ack'
  },
  {
    path: '/blog/:category/:slug',
    component: 'pages/blog/[category]/[slug].ack'
  }
];

// Erişim
router.use(async (ctx, next) => {
  console.log(ctx.params); // { id: '123' }
  console.log(ctx.params.id);
  await next();
});
```

### Query String

```typescript
// URL: /search?q=javascript&page=2

router.use(async (ctx, next) => {
  console.log(ctx.query);  // { q: 'javascript', page: '2' }
  console.log(ctx.query.q); // 'javascript'
  await next();
});
```

### Catch-All Routes

```typescript
const routes: Route[] = [
  {
    path: '/:slug',
    component: 'pages/[slug].ack'
  }
];
```

---

## Örnekler

### 1. Basit Authentication

```typescript
import { createAdvancedRouter, createAuthMiddleware } from '@ack/kit';

const router = createAdvancedRouter('./src');

// Auth kontrol
let authToken = null;

const authMiddleware = createAuthMiddleware(() => !!authToken);
router.use(authMiddleware);

// Hook'lar
router.beforeEach((ctx) => {
  console.log(`Gidiş: ${ctx.path}`);
});

router.afterEach((ctx) => {
  console.log(`Geldi: ${ctx.path}`);
});

// Routes
const routes: Route[] = [
  {
    path: '/login',
    component: 'pages/login.ack'
  },
  {
    path: '/dashboard',
    component: 'pages/dashboard.ack',
    meta: { requiresAuth: true, title: 'Dashboard' }
  }
];

// Login
async function handleLogin(email: string, password: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    const { token } = await response.json();
    authToken = token;
    localStorage.setItem('token', token);
    await router.navigate('/dashboard');
  }
}
```

### 2. Admin Paneli

```typescript
const adminRoutes: Route[] = [
  {
    path: '/admin',
    component: 'pages/admin/layout.ack',
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Yönetim Paneli'
    },
    children: [
      {
        path: '/admin/dashboard',
        component: 'pages/admin/dashboard.ack',
        meta: { title: 'Ana Sayfa' }
      },
      {
        path: '/admin/users',
        component: 'pages/admin/users/index.ack',
        meta: { title: 'Kullanıcılar' }
      },
      {
        path: '/admin/users/:id',
        component: 'pages/admin/users/[id].ack',
        meta: { title: 'Kullanıcı Profili' }
      }
    ]
  }
];

// RBAC middleware
const rbacMiddleware = createRbacMiddleware(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles || [];
});

router.use(rbacMiddleware);
```

### 3. Form Koruma

```typescript
let hasUnsavedChanges = false;

const formGuard: GuardFn = () => {
  if (hasUnsavedChanges) {
    return confirm('Kaydedilmemiş değişiklikler var. Çıkmak istiyor musunuz?');
  }
  return true;
};

const editRoutes: Route[] = [
  {
    path: '/products/:id/edit',
    component: 'pages/products/edit.ack',
    beforeLeave: [formGuard]
  }
];

// Form değişiklik takibi
document.addEventListener('change', () => {
  hasUnsavedChanges = true;
});
```

---

## API Referansı

### AdvancedRouter

```typescript
class AdvancedRouter {
  // Constructor
  constructor(config: RouterConfig);

  // Middleware
  use(middleware: MiddlewareFn): void;

  // Hooks
  beforeEach(hook: HookFn): void;
  afterEach(hook: HookFn): void;

  // Navigation
  navigate(pathname: string, options?: { replace?: boolean }): Promise<boolean>;
  back(): void;
  forward(): void;

  // State
  getState(): RouterState;
  getCurrentRoute(): RouteContext | null;
  getAllRoutes(): Route[];
}
```

### Types

```typescript
// Context
interface RouteContext {
  path: string;
  name: string;
  component: string;
  params: RouteParams;
  query: Record<string, string>;
  meta?: RouteMeta;
  matched: Route[];
  parent?: Route;
}

// Functions
type MiddlewareFn = (ctx: RouteContext, next: () => Promise<void>) => Promise<void>;
type GuardFn = (ctx: RouteContext) => boolean | Promise<boolean>;
type HookFn = (ctx: RouteContext) => void | Promise<void>;

// State
interface RouterState {
  current: RouteContext | null;
  previous: RouteContext | null;
  isNavigating: boolean;
  history: RouteContext[];
}
```

---

## En İyi Uygulamalar

✅ **Async Guards Kullan** - Sunucu kontrolü için  
✅ **Middleware Order** - Bağımlılığa göre sıra önemli  
✅ **Error Handling** - try/catch kullan  
✅ **Type Safety** - TypeScript ile yazı  
✅ **Route Meta** - SEO ve erişim kontrolü için  

---

## Sorun Giderme

### Navigation Çalışmıyor

```typescript
// beforeEach/afterEach'i kontrol et
router.beforeEach((ctx) => {
  console.log('beforeEach:', ctx.path);
});

// Guards'ı kontrol et
const testGuard: GuardFn = () => {
  console.log('Guard çağrıldı');
  return true;
};
```

### Middleware Sırasında Sorun

```typescript
// Pipeline sırasını kontrol et
router.use(async (ctx, next) => {
  console.log('MW1 başladı');
  await next();
  console.log('MW1 bitti');
});
```

---

**Son Güncelleme**: Ekim 2025  
**Yazar**: ACK Framework Team  
**Lisans**: MIT
