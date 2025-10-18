# Advanced Routing - Pratik Örnekler

Bu dosya, ACK Framework'ün Advanced Routing sistemi için gerçek hayat örneklerini içerir.

---

## İçindekiler

1. [E-Commerce Uygulaması](#e-commerce-uygulaması)
2. [Admin Paneli](#admin-paneli)
3. [Blog Uygulaması](#blog-uygulaması)
4. [SPA Authentication](#spa-authentication)
5. [Middleware Kombinasyonları](#middleware-kombinasyonları)

---

## E-Commerce Uygulaması

### Proje Yapısı

```
src/
├── pages/
│   ├── index.ack                    # Ana sayfa
│   ├── products/
│   │   ├── index.ack                # Ürün listesi
│   │   └── [id].ack                 # Ürün detayı
│   ├── cart.ack                     # Sepet
│   ├── checkout.ack                 # Ödeme (korumalı)
│   └── order/
│       ├── [id].ack                 # Sipariş detayı
│       └── history.ack              # Sipariş geçmişi
├── components/
│   ├── Header.ack
│   ├── Navigation.ack
│   └── Footer.ack
└── main.ts
```

### Router Konfigürasyonu

```typescript
// main.ts
import { createAdvancedRouter, createAuthMiddleware, createLoadingMiddleware } from '@ack/kit';
import type { Route, GuardFn, MiddlewareFn } from '@ack/kit';

// ==========================================
// STATE VE HELPERS
// ==========================================

let user: { id: string; roles: string[] } | null = null;
let isLoading = false;
let cart: { count: number } = { count: 0 };

const checkAuth = () => !!user;

const checkCartEmpty: GuardFn = (ctx) => {
  if (cart.count === 0 && ctx.path === '/checkout') {
    alert('Sepet boş! Ürün ekleyin.');
    return false;
  }
  return true;
};

// ==========================================
// ROUTES TANIMLA
// ==========================================

const routes: Route[] = [
  {
    path: '/',
    component: 'pages/index.ack',
    name: 'Home',
    meta: {
      title: 'ACK Shop - Ev',
      description: 'Harika ürünleri keşfet',
      preload: true
    }
  },
  {
    path: '/products',
    component: 'pages/products/index.ack',
    name: 'Products',
    meta: {
      title: 'Ürünler',
      description: 'Tüm ürünlerimizin listesi'
    }
  },
  {
    path: '/products/:id',
    component: 'pages/products/[id].ack',
    name: 'ProductDetail',
    meta: {
      title: 'Ürün Detayı'
    }
  },
  {
    path: '/cart',
    component: 'pages/cart.ack',
    name: 'Cart',
    meta: {
      title: 'Sepetim'
    }
  },
  {
    path: '/checkout',
    component: 'pages/checkout.ack',
    name: 'Checkout',
    meta: {
      title: 'Ödeme',
      requiresAuth: true
    },
    beforeEnter: [checkCartEmpty]
  },
  {
    path: '/order/:id',
    component: 'pages/order/[id].ack',
    name: 'OrderDetail',
    meta: {
      title: 'Sipariş Detayı',
      requiresAuth: true
    }
  },
  {
    path: '/orders',
    component: 'pages/order/history.ack',
    name: 'OrderHistory',
    meta: {
      title: 'Sipariş Geçmişi',
      requiresAuth: true
    }
  }
];

// ==========================================
// ROUTER OLUŞTUR VE AYARLA
// ==========================================

const router = new AdvancedRouter({
  routes,
  basePath: '/'
});

// Middleware'lar
const authMiddleware = createAuthMiddleware(checkAuth);
router.use(authMiddleware);

const loadingMiddleware = createLoadingMiddleware(
  () => { isLoading = true; },
  () => { isLoading = false; }
);
router.use(loadingMiddleware);

// Analytics middleware
router.use(async (ctx, next) => {
  console.log(`📍 Sayfa: ${ctx.meta?.title || ctx.name}`);
  await next();
});

// Hooks
router.beforeEach((ctx) => {
  console.log(`⏳ Yükleniyor: ${ctx.path}`);
});

router.afterEach((ctx) => {
  console.log(`✅ Tamamlandı: ${ctx.path}`);
  window.scrollTo(0, 0);
});

// ==========================================
// NAVIGATION EXAMPLES
// ==========================================

// Ürün sayfasına git
async function goToProduct(productId: string) {
  await router.navigate(`/products/${productId}`);
}

// Checkout'a git (auth gerekli)
async function goToCheckout() {
  if (!user) {
    alert('Lütfen giriş yapın');
    return;
  }
  await router.navigate('/checkout');
}

// Siparişe git
async function goToOrder(orderId: string) {
  if (!user) {
    alert('Lütfen giriş yapın');
    return;
  }
  await router.navigate(`/order/${orderId}`);
}

// ==========================================
// EXPORT
// ==========================================

export { router, goToProduct, goToCheckout, goToOrder };
```

### Sayfa Örnekleri

#### Product Detail Page

```typescript
// pages/products/[id].ack

<script>
  let product = null;
  let loading = true;
  let error = null;

  export async function load(params) {
    try {
      loading = true;
      const response = await fetch(`/api/products/${params.id}`);
      product = await response.json();
    } catch (e) {
      error = 'Ürün yüklenemedi';
    } finally {
      loading = false;
    }
  }

  export function addToCart() {
    // Sepete ekle
    cart.count++;
    alert('Ürün sepete eklendi!');
  }
</script>

<template>
  {#if loading}
    <div class="loading">Ürün yükleniyor...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="product-detail">
      <h1>{product.name}</h1>
      <p class="price">${product.price}</p>
      <p class="description">{product.description}</p>
      <button @click={addToCart}>Sepete Ekle</button>
    </div>
  {/if}
</template>

<style>
  .product-detail {
    max-width: 800px;
    margin: 2em auto;
  }
  .price {
    font-size: 2em;
    color: #f00;
  }
</style>
```

---

## Admin Paneli

### Proje Yapısı

```
src/pages/admin/
├── index.ack                        # Dashboard
├── layout.ack                       # Admin layout
├── users/
│   ├── index.ack                    # Kullanıcı listesi
│   ├── [id].ack                     # Kullanıcı detayı
│   └── create.ack                   # Yeni kullanıcı
├── posts/
│   ├── index.ack                    # Post listesi
│   └── [id].ack                     # Post detayı
└── settings.ack                     # Ayarlar
```

### Router Setup

```typescript
// admin-router.ts

import { createAdvancedRouter, createRbacMiddleware, createPageTitleMiddleware } from '@ack/kit';
import type { Route, GuardFn } from '@ack/kit';

// ==========================================
// GUARDS VE MIDDLEWARE
// ==========================================

const adminGuard: GuardFn = (ctx) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.roles?.includes('admin')) {
    alert('Yönetici erişimi gerekli');
    return false;
  }
  
  return true;
};

const getUserRoles = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles || [];
};

// ==========================================
// ROUTES
// ==========================================

const adminRoutes: Route[] = [
  {
    path: '/admin',
    component: 'pages/admin/layout.ack',
    name: 'AdminLayout',
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Yönetim Paneli'
    },
    beforeEnter: [adminGuard],
    children: [
      {
        path: '/admin',
        component: 'pages/admin/index.ack',
        name: 'AdminDashboard',
        meta: { title: 'Dashboard' }
      },
      {
        path: '/admin/users',
        component: 'pages/admin/users/index.ack',
        name: 'UserList',
        meta: { title: 'Kullanıcılar' }
      },
      {
        path: '/admin/users/:id',
        component: 'pages/admin/users/[id].ack',
        name: 'UserDetail',
        meta: { title: 'Kullanıcı Detayı' }
      },
      {
        path: '/admin/users/create',
        component: 'pages/admin/users/create.ack',
        name: 'UserCreate',
        meta: { title: 'Yeni Kullanıcı' }
      },
      {
        path: '/admin/posts',
        component: 'pages/admin/posts/index.ack',
        name: 'PostList',
        meta: { title: 'Yazılar' }
      },
      {
        path: '/admin/posts/:id',
        component: 'pages/admin/posts/[id].ack',
        name: 'PostDetail',
        meta: { title: 'Yazı Detayı' }
      },
      {
        path: '/admin/settings',
        component: 'pages/admin/settings.ack',
        name: 'AdminSettings',
        meta: { title: 'Ayarlar' }
      }
    ]
  }
];

// ==========================================
// ROUTER
// ==========================================

export const adminRouter = createAdvancedRouter('./src', {
  basePath: '/admin'
});

adminRouter.use(createRbacMiddleware(getUserRoles));
adminRouter.use(createPageTitleMiddleware());

export default adminRouter;
```

### Admin Layout Component

```typescript
// pages/admin/layout.ack

<script>
  let currentUser = null;
  let sidebarOpen = true;

  export function initialize() {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  }

  export function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  export function logout() {
    localStorage.clear();
    // Navigate to login
    window.location.href = '/login';
  }
</script>

<template>
  <div class="admin-layout">
    <header class="admin-header">
      <h1>ACK Admin Panel</h1>
      <div class="user-info">
        <span>Hoş geldin, {currentUser.name}!</span>
        <button @click={logout}>Çıkış</button>
      </div>
    </header>

    <div class="admin-container">
      <aside class="admin-sidebar" class:collapsed={!sidebarOpen}>
        <nav>
          <a href="/admin">📊 Dashboard</a>
          <a href="/admin/users">👥 Kullanıcılar</a>
          <a href="/admin/posts">📝 Yazılar</a>
          <a href="/admin/settings">⚙️ Ayarlar</a>
        </nav>
      </aside>

      <main class="admin-content">
        <div id="admin-route-outlet"></div>
      </main>
    </div>
  </div>
</template>

<style>
  .admin-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .admin-header {
    background: #333;
    color: white;
    padding: 1em 2em;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .admin-container {
    display: flex;
    flex: 1;
  }

  .admin-sidebar {
    width: 250px;
    background: #f5f5f5;
    padding: 1em;
    transition: width 0.3s;
  }

  .admin-sidebar.collapsed {
    width: 60px;
  }

  .admin-sidebar nav a {
    display: block;
    padding: 0.8em;
    color: #333;
    text-decoration: none;
    border-radius: 4px;
    margin-bottom: 0.5em;
  }

  .admin-sidebar nav a:hover {
    background: #ddd;
  }

  .admin-content {
    flex: 1;
    padding: 2em;
  }
</style>
```

---

## Blog Uygulaması

### Routes Konfigürasyonu

```typescript
const blogRoutes: Route[] = [
  // Ana sayfa
  {
    path: '/',
    component: 'pages/index.ack',
    name: 'BlogHome',
    meta: {
      title: 'ACK Blog',
      description: 'Harika yazılar ve öneriler'
    }
  },

  // Blog postları
  {
    path: '/blog',
    component: 'pages/blog/index.ack',
    name: 'BlogList',
    meta: { title: 'Blog' }
  },

  // Kategori bazlı
  {
    path: '/blog/category/:slug',
    component: 'pages/blog/category/[slug].ack',
    name: 'BlogCategory',
    meta: { title: 'Kategori' }
  },

  // Post detayı
  {
    path: '/blog/:slug',
    component: 'pages/blog/[slug].ack',
    name: 'BlogPost',
    meta: { title: 'Blog Yazısı' }
  },

  // Yazı oluştur (korumalı)
  {
    path: '/blog/new',
    component: 'pages/blog/create.ack',
    name: 'CreatePost',
    meta: {
      title: 'Yeni Yazı',
      requiresAuth: true,
      roles: ['author', 'admin']
    }
  },

  // Arama
  {
    path: '/search',
    component: 'pages/search.ack',
    name: 'Search',
    meta: { title: 'Arama' }
  }
];
```

### Search Implementation

```typescript
// Middleware: Search parametrelerini işle
router.use(async (ctx, next) => {
  if (ctx.path === '/search' && ctx.query.q) {
    // Arama sonuçlarını yükle
    const results = await fetchSearchResults(ctx.query.q);
    ctx.searchResults = results;
  }
  await next();
});

// Search sonuçlarını göster
async function search(query: string) {
  await router.navigate(`/search?q=${encodeURIComponent(query)}`);
}
```

---

## SPA Authentication

### Full Auth Flow

```typescript
import { 
  createAdvancedRouter, 
  createAuthMiddleware,
  createLoadingMiddleware,
  type GuardFn,
  type MiddlewareFn
} from '@ack/kit';

// ==========================================
// AUTH STATE
// ==========================================

interface AuthState {
  user: { id: string; email: string; roles: string[] } | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

let authState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null
};

// ==========================================
// AUTH HELPERS
// ==========================================

async function login(email: string, password: string): Promise<boolean> {
  authState.isLoading = true;
  authState.error = null;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      authState.error = 'Giriş başarısız';
      return false;
    }

    const { user, token } = await response.json();
    authState.user = user;
    authState.token = token;

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);

    return true;
  } catch (error) {
    authState.error = 'Bir hata oluştu';
    return false;
  } finally {
    authState.isLoading = false;
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authState.token}` }
    });
  } finally {
    authState.user = null;
    authState.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    await router.navigate('/login', { replace: true });
  }
}

// ==========================================
// GUARDS
// ==========================================

const requireAuth: GuardFn = (ctx) => {
  if (!authState.user) {
    router.navigate('/login', { replace: true });
    return false;
  }
  return true;
};

const requireGuest: GuardFn = (ctx) => {
  if (authState.user) {
    router.navigate('/dashboard', { replace: true });
    return false;
  }
  return true;
};

const requireRole = (roles: string[]): GuardFn => {
  return (ctx) => {
    if (!authState.user?.roles.some(role => roles.includes(role))) {
      router.navigate('/forbidden', { replace: true });
      return false;
    }
    return true;
  };
};

// ==========================================
// ROUTES
// ==========================================

const authRoutes = [
  {
    path: '/login',
    component: 'pages/auth/login.ack',
    beforeEnter: [requireGuest],
    meta: { title: 'Giriş' }
  },
  {
    path: '/register',
    component: 'pages/auth/register.ack',
    beforeEnter: [requireGuest],
    meta: { title: 'Kayıt' }
  },
  {
    path: '/dashboard',
    component: 'pages/dashboard.ack',
    beforeEnter: [requireAuth],
    meta: { requiresAuth: true, title: 'Dashboard' }
  },
  {
    path: '/admin',
    component: 'pages/admin/index.ack',
    beforeEnter: [requireAuth, requireRole(['admin'])],
    meta: { requiresAuth: true, roles: ['admin'], title: 'Admin' }
  }
];

// ==========================================
// ROUTER SETUP
// ==========================================

const router = createAdvancedRouter('./src');

// Auth middleware
router.use(createAuthMiddleware(() => !!authState.user));

// Token refresh middleware
router.use(async (ctx, next) => {
  if (authState.token) {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      if (!response.ok) {
        await logout();
        return;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }
  await next();
});

// Error handling
router.beforeEach((ctx) => {
  authState.error = null;
});

export { router, login, logout, authState };
```

---

## Middleware Kombinasyonları

### Logging + Analytics + Loading

```typescript
// Comprehensive middleware setup
const setupRouterMiddlewares = () => {
  const router = createAdvancedRouter('./src');

  // 1. Request Logger
  router.use(async (ctx, next) => {
    const startTime = Date.now();
    const logEntry = {
      timestamp: new Date().toISOString(),
      path: ctx.path,
      name: ctx.name
    };

    console.log(`[${logEntry.timestamp}] → ${ctx.path}`);

    await next();

    const duration = Date.now() - startTime;
    console.log(`[${duration}ms] ← ${ctx.path}`);
  });

  // 2. Loading State
  router.use(async (ctx, next) => {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      await next();
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  });

  // 3. Error Handling
  router.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Navigation error:', error);
      await router.navigate('/error', { replace: true });
    }
  });

  // 4. Page Title
  router.beforeEach((ctx) => {
    if (ctx.meta?.title) {
      document.title = `${ctx.meta.title} | ACK`;
    }
  });

  // 5. Scroll Reset
  router.afterEach((ctx) => {
    window.scrollTo(0, 0);
  });

  return router;
};
```

---

**Son Güncelleme**: Ekim 2025  
**Versiyon**: 0.3.0
