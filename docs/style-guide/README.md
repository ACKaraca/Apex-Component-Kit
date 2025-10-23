# ACK Framework Style Guide

Bu döküman, ACK Framework projelerinde kod yazma, dosya organizasyonu ve best practice'leri içerir.

## 🎯 Genel Prensipler

### 1. Kod Kalitesi
- **Readability**: Kod okunabilir ve anlaşılır olsun
- **Maintainability**: Kod bakımı kolay olsun
- **Consistency**: Tutarlı kodlama stilleri kullanın
- **Performance**: Performans optimizasyonlarını göz önünde bulundurun

### 2. Naming Conventions
- **PascalCase**: Component, class ve type isimleri
- **camelCase**: Function, variable ve method isimleri
- **kebab-case**: File ve folder isimleri
- **SCREAMING_SNAKE_CASE**: Constant değerler

## 📁 Dosya Organizasyonu

### Proje Yapısı
```
src/
├── components/           # Yeniden kullanılabilir component'ler
│   ├── ui/              # UI component'leri
│   ├── forms/           # Form component'leri
│   └── layout/          # Layout component'leri
├── pages/               # Sayfa component'leri
├── stores/              # Global state management
├── services/            # API ve external services
├── utils/               # Yardımcı fonksiyonlar
├── types/               # TypeScript type definitions
└── styles/              # Global styles ve theme
```

### Component Yapısı
```ack
<!-- MyComponent.ack -->
<script>
  // Props
  export let title = '';
  export let items = [];

  // State
  let isLoading = false;
  let error = null;

  // Methods
  function handleClick() {
    // Implementation
  }

  // Lifecycle
  $: console.log('Items changed:', items);
</script>

<template>
  <div class="my-component">
    <h2>{title}</h2>
    {#if isLoading}
      <LoadingSpinner />
    {:else if error}
      <ErrorMessage message={error} />
    {:else}
      <ItemList items={items} on:click={handleClick} />
    {/if}
  </div>
</template>

<style>
  .my-component {
    /* Styles */
  }
</style>
```

## 💻 Kodlama Standartları

### JavaScript/TypeScript

#### Variable Declarations
```typescript
// ✅ İyi
const userName = 'John';
let isActive = true;
const items: string[] = [];

// ❌ Kötü
var oldStyle = 'deprecated';
let name: any = 'loose typing';
```

#### Function Definitions
```typescript
// ✅ İyi
function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

const handleSubmit = (event: Event): void => {
  event.preventDefault();
  // Implementation
};

// ❌ Kötü
function badFunction(item) {  // Missing types
  return item.price + item.tax;  // No null check
}
```

#### Async/Await
```typescript
// ✅ İyi
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error}`);
  }
}

// ❌ Kötü
async function badFetch() {
  const data = await api.get('/data').data;  // No error handling
  return data;
}
```

### ACK Templates

#### Template Structure
```ack
<script>
  // Logic first
  export let propName = defaultValue;

  let state = initialValue;
  let isLoading = false;

  function handler() {
    // Implementation
  }
</script>

<template>
  <!-- Markup with proper indentation -->
  <div class="container">
    <h1>Title</h1>
    {#if condition}
      <p>Content</p>
    {/if}
  </div>
</template>

<style>
  /* Styles last */
  .container {
    max-width: 1200px;
  }
</style>
```

#### Event Handlers
```ack
<!-- ✅ İyi -->
<button @click={handleClick}>Click me</button>
<input @input={handleInput} bind:value={searchTerm} />
<form @submit|preventDefault={handleSubmit}>

<!-- ❌ Kötü -->
<button onclick="handleClick()">Inline handler</button>
<button @click="handleClick()">String handler</button>
```

#### Conditional Rendering
```ack
<!-- ✅ İyi -->
{#if isLoading}
  <LoadingSpinner />
{:else if error}
  <ErrorMessage message={error} />
{:else}
  <DataList items={data} />
{/if}

<!-- ❌ Kötü -->
{#if isLoading}
  <div>Loading...</div>
{#else}
  {#if error}
    <div>Error: {error}</div>
  {#else}
    <div>Data: {data}</div>
  {/if}
{/if}
```

## 🎨 Styling Guidelines

### CSS Architecture
```css
/* ✅ İyi - BEM methodology */
.user-profile {
  /* Block */
}

.user-profile__avatar {
  /* Element */
}

.user-profile__name {
  /* Element */
}

.user-profile--large {
  /* Modifier */
}

/* ❌ Kötü - No structure */
.userProfile {
  /* No clear structure */
}

.userProfile .avatar {
  /* Nested selectors */
}
```

### Responsive Design
```css
/* ✅ İyi - Mobile first */
.component {
  width: 100%;
  padding: 16px;
}

@media (min-width: 768px) {
  .component {
    width: 50%;
    padding: 24px;
  }
}

/* ❌ Kötü - Desktop first */
.component {
  width: 50%;
  padding: 24px;
}

@media (max-width: 767px) {
  .component {
    width: 100%;
    padding: 16px;
  }
}
```

## 🧪 Testing Standards

### Test Structure
```typescript
// ✅ İyi
describe('UserService', () => {
  let service: UserService;
  let mockApi: MockApi;

  beforeEach(() => {
    mockApi = createMockApi();
    service = new UserService(mockApi);
  });

  describe('getUser', () => {
    it('should return user data', async () => {
      const mockUser = { id: 1, name: 'John' };
      mockApi.get.mockResolvedValue(mockUser);

      const result = await service.getUser(1);

      expect(result).toEqual(mockUser);
      expect(mockApi.get).toHaveBeenCalledWith('/users/1');
    });

    it('should handle API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getUser(1)).rejects.toThrow('API Error');
    });
  });
});
```

### Test Coverage
```typescript
// ✅ İyi - High coverage
describe('Component', () => {
  it('should render correctly', () => {
    // Test rendering
  });

  it('should handle user interactions', () => {
    // Test user interactions
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should handle errors', () => {
    // Test error handling
  });
});
```

## 📝 Documentation

### Component Documentation
```ack
<!--
  @component Card - Display content in a card layout

  @param {string} title - Card title
  @param {string} [variant=primary] - Card variant
  @param {boolean} [loading=false] - Loading state

  @example
  ```ack
  <Card title="User Profile" variant="secondary">
    <p>User information</p>
  </Card>
  ```
-->
```

### Function Documentation
```typescript
/**
 * Calculate user permissions based on roles
 *
 * @param user - User object with roles
 * @param resource - Resource to check permissions for
 * @returns Array of permissions
 *
 * @example
 * ```typescript
 * const permissions = calculatePermissions(user, 'admin');
 * console.log(permissions); // ['read', 'write', 'delete']
 * ```
 */
function calculatePermissions(user: User, resource: string): string[] {
  // Implementation
}
```

## 🚀 Performance Guidelines

### Bundle Optimization
```typescript
// ✅ İyi - Tree shaking friendly
export function calculateTotal(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

// ❌ Kötü - Side effects
export function initGlobalState() {
  window.globalState = createStore();
}
```

### Lazy Loading
```typescript
// ✅ İyi - Lazy loading
const HeavyComponent = lazyLoadComponent(() =>
  import('./components/HeavyComponent.ack')
);

// ❌ Kötü - Synchronous loading
import HeavyComponent from './components/HeavyComponent.ack';
```

## 🔒 Security Guidelines

### Input Validation
```typescript
// ✅ İyi - Input validation
function createUser(data: UserInput): User {
  if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Invalid email');
  }

  if (!data.password || data.password.length < 8) {
    throw new Error('Password too short');
  }

  return {
    id: generateId(),
    email: data.email,
    password: hashPassword(data.password)
  };
}
```

### XSS Prevention
```ack
<!-- ✅ İyi - Safe rendering -->
<p>{user.name}</p>

<!-- ❌ Kötü - Unsafe HTML -->
<div>{@html user.bio}</div>
```

## 🌐 Internationalization

### Message Structure
```typescript
// ✅ İyi - Structured messages
const messages = {
  greeting: 'Hello {name}!',
  itemCount: '{count} item{count !== 1 ? "s" : ""} found',
  error: {
    network: 'Network error occurred',
    validation: 'Please check your input'
  }
};

// ❌ Kötü - Hardcoded strings
const greeting = 'Hello!';
```

## 📱 Accessibility

### ARIA Attributes
```ack
<!-- ✅ İyi - Accessible -->
<button
  @click={handleSubmit}
  aria-label="Submit form"
  aria-disabled={isSubmitting}
>
  Submit
</button>

<!-- ❌ Kötü - No accessibility -->
<button @click={handleSubmit}>Submit</button>
```

### Keyboard Navigation
```ack
<!-- ✅ İyi - Keyboard accessible -->
<div
  tabindex="0"
  @keydown.enter={handleEnter}
  @keydown.escape={handleEscape}
>
  Content
</div>
```

## 🔧 Development Workflow

### Git Conventions
```bash
# ✅ İyi - Clear commit messages
git commit -m "feat: add user authentication component"
git commit -m "fix: resolve memory leak in store"
git commit -m "docs: update API documentation"

# ❌ Kötü - Vague messages
git commit -m "update"
git commit -m "fix bug"
```

### Code Review Checklist
- [ ] Kod okunabilir mi?
- [ ] TypeScript tipleri doğru mu?
- [ ] Test coverage yeterli mi?
- [ ] Performance optimizasyonları yapıldı mı?
- [ ] Accessibility gereksinimleri karşılandı mı?
- [ ] Documentation güncellendi mi?

## 📚 Resources

### Tools
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting
- [TypeScript](https://www.typescriptlang.org/) - Type checking
- [Vitest](https://vitest.dev/) - Testing framework

### Best Practices
- [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/) - Kod kalitesi
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID) - Design principles
- [Web Performance](https://web.dev/performance/) - Performance optimization

---

## 🚦 Quick Reference

### Do ✅
- Component'leri küçük ve focused tutun
- Props'u immutable kullanın
- Event handler'ları stable tutun
- TypeScript kullanın
- Test yazın
- Documentation ekleyin

### Don't ❌
- Global state'i abuse etmeyin
- Deep nesting yapmayın
- Magic numbers kullanmayın
- Any type kullanmayın
- Inline styles kullanmayın
- Dead code bırakmayın

Bu style guide, ACK Framework projelerinde tutarlı ve kaliteli kod yazmak için rehberdir. Takım olarak bu kuralları takip etmek, projenin maintainability'sini artırır.
