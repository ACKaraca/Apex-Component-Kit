# ACK Framework Hata Referansı

Bu döküman, ACK Framework kullanırken karşılaşabileceğiniz hataları, nedenlerini ve çözüm önerilerini içerir.

## 🚨 Hata Kodları ve Anlamları

### Compilation Errors (1000-1999)

#### ACK-1000: Template Syntax Error
**Açıklama:** Template syntax hatası
**Nedenler:**
- Geçersiz template syntax
- Kapatılmamış tag'ler
- Yanlış attribute kullanımı

**Çözüm:**
```ack
<!-- Hatalı -->
<button @click={count++}>Increment</button>

<!-- Doğru -->
<button @click={() => count++}>Increment</button>
```

#### ACK-1001: Missing Component
**Açıklama:** Component bulunamadı
**Nedenler:**
- Component dosyası mevcut değil
- Yanlış import path
- Component ismi yanlış

**Çözüm:**
```typescript
// Hatalı
import MyComponent from './components/MyComponent';

// Doğru
import MyComponent from './components/MyComponent.ack';
```

#### ACK-1002: Type Error
**Açıklama:** TypeScript tip hatası
**Nedenler:**
- Yanlış prop tipleri
- Missing type definitions
- Type mismatch

**Çözüm:**
```typescript
// Hatalı
<Counter initialValue="123" />

// Doğru
<Counter initialValue={123} />
```

### Runtime Errors (2000-2999)

#### ACK-2000: Reactivity Error
**Açıklama:** Reactivity sistemi hatası
**Nedenler:**
- Circular dependencies
- Memory leaks
- Improper state mutations

**Çözüm:**
```typescript
// Hatalı - direct mutation
state.todos.push(newTodo);

// Doğru - immutable update
state.todos = [...state.todos, newTodo];
```

#### ACK-2001: Component Lifecycle Error
**Açıklama:** Component lifecycle hatası
**Nedenler:**
- Improper cleanup
- Memory leaks
- Async operation handling

**Çözüm:**
```typescript
// Hatalı - no cleanup
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  // Timer cleanup eksik
});

// Doğru - proper cleanup
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
```

#### ACK-2002: SSR Hydration Mismatch
**Açıklama:** Server-side ve client-side render mismatch
**Nedenler:**
- Random values
- Browser-specific APIs
- Timing differences

**Çözüm:**
```typescript
// Hatalı - browser API
const isClient = typeof window !== 'undefined';

// Doğru - SSR-safe
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);
```

### API Errors (3000-3999)

#### ACK-3000: Network Error
**Açıklama:** API request hatası
**Nedenler:**
- Network connectivity
- Invalid endpoints
- CORS issues

**Çözüm:**
```typescript
// Hatalı - no error handling
const data = await api.get('/users');

// Doğru - error handling
try {
  const data = await api.get('/users');
} catch (error) {
  if (error.status === 404) {
    // Handle not found
  } else {
    // Handle other errors
  }
}
```

#### ACK-3001: Authentication Error
**Açıklama:** Kimlik doğrulama hatası
**Nedenler:**
- Expired tokens
- Invalid credentials
- Missing permissions

**Çözüm:**
```typescript
// Hatalı - no auth handling
const response = await api.get('/protected');

// Doğru - auth middleware
const authInterceptor = createBearerTokenInterceptor(token);
api.useRequestInterceptor(authInterceptor);
```

### Build Errors (4000-4999)

#### ACK-4000: Build Configuration Error
**Açıklama:** Build konfigürasyon hatası
**Nedenler:**
- Invalid config
- Missing dependencies
- Path resolution issues

**Çözüm:**
```typescript
// Hatalı vite.config.ts
export default {
  plugins: [ackPlugin()]
};

// Doğru vite.config.ts
export default defineConfig({
  plugins: [ackPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
```

#### ACK-4001: Asset Loading Error
**Açıklama:** Asset yükleme hatası
**Nedenler:**
- Missing files
- Incorrect paths
- Unsupported formats

**Çözüm:**
```ack
<!-- Hatalı -->
<img src="/images/photo.jpg" />

<!-- Doğru -->
<img src="/src/assets/images/photo.jpg" />
```

## 🔧 Debug Teknikleri

### Development Tools

#### Browser DevTools
```javascript
// Console logging
console.log('State:', state);

// Component debugging
console.log('Component props:', props);
console.log('Component state:', componentState);
```

#### ACK DevTools
```typescript
// Enable dev mode
process.env.NODE_ENV = 'development';

// Enable debug logging
localStorage.setItem('ACK_DEBUG', 'true');
```

### Error Boundaries

```typescript
// Global error boundary
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

### Network Debugging

```typescript
// Request/Response logging
const loggingInterceptor = createLoggingInterceptor();
api.useRequestInterceptor(loggingInterceptor.request);
api.useResponseInterceptor(loggingInterceptor.response);
```

## 📊 Hata İzleme ve Raporlama

### Error Reporting

```typescript
// Error reporting service
import { ErrorReporter } from '@ack/error-reporter';

const reporter = new ErrorReporter({
  dsn: 'https://your-error-service.com',
  environment: 'production'
});

// Automatic error reporting
window.addEventListener('error', (event) => {
  reporter.captureException(event.error);
});
```

### Performance Monitoring

```typescript
// Performance monitoring
import { PerformanceMonitor } from '@ack/performance';

const monitor = new PerformanceMonitor();

monitor.recordMetric('page-load', performance.now());
monitor.recordMetric('api-response', responseTime);
```

## 🚦 Common Pitfalls

### 1. Reactivity Issues
```typescript
// ❌ Yanlış - array mutation
state.items.push(newItem);

// ✅ Doğru - immutable update
state.items = [...state.items, newItem];
```

### 2. Async Operations
```typescript
// ❌ Yanlış - no loading state
const handleClick = async () => {
  const data = await api.get('/data');
  setData(data);
};

// ✅ Doğru - loading state
const handleClick = async () => {
  setLoading(true);
  try {
    const data = await api.get('/data');
    setData(data);
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
};
```

### 3. Memory Leaks
```typescript
// ❌ Yanlış - no cleanup
useEffect(() => {
  const subscription = observable.subscribe();
  // Cleanup eksik
});

// ✅ Doğru - cleanup
useEffect(() => {
  const subscription = observable.subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 4. Bundle Size
```typescript
// ❌ Yanlış - large imports
import { allFunctions } from 'large-library';

// ✅ Doğru - tree shaking
import { onlyNeededFunction } from 'large-library';
```

## 📝 Logging Best Practices

### Structured Logging
```typescript
// ❌ Yanlış - string concatenation
console.log('User ' + userId + ' clicked ' + buttonName);

// ✅ Doğru - structured logging
console.log('User interaction', {
  userId,
  action: 'click',
  element: buttonName,
  timestamp: Date.now()
});
```

### Error Context
```typescript
// ❌ Yanlış - generic error
throw new Error('Something failed');

// ✅ Doğru - contextual error
throw new Error('Failed to load user data', {
  cause: originalError,
  userId,
  endpoint: '/api/users'
});
```

## 🔍 Troubleshooting Checklist

### 1. Compilation Issues
- [ ] TypeScript konfigürasyonunu kontrol et
- [ ] Import path'lerini doğrula
- [ ] Template syntax'ını gözden geçir
- [ ] Package dependencies'ini kontrol et

### 2. Runtime Issues
- [ ] Browser console'u incele
- [ ] Network tab'ını kontrol et
- [ ] Component state'ini debug et
- [ ] Error boundaries'i test et

### 3. Performance Issues
- [ ] Bundle analyzer kullan
- [ ] Lazy loading'i optimize et
- [ ] Caching stratejilerini gözden geçir
- [ ] Memory usage'ını monitor et

### 4. Deployment Issues
- [ ] Environment variables'ını doğrula
- [ ] Build output'unu kontrol et
- [ ] Server konfigürasyonunu incele
- [ ] CDN ayarlarını gözden geçir

## 📚 Daha Fazla Yardım

### Topluluk Destek
- [GitHub Issues](https://github.com/ack-framework/ack/issues)
- [Discord Community](https://discord.gg/ack-framework)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ack-framework)

### Professional Support
- [ACK Framework Professional](https://pro.ackframework.io)
- [Enterprise Support](mailto:enterprise@ackframework.io)

---

**Son Güncelleme:** 2025-10-23
**Versiyon:** 0.6.0

Bu döküman, ACK Framework'ü kullanırken karşılaşılan yaygın hataları ve çözümlerini içermektedir. Daha fazla bilgi için [resmi dökümantasyon](https://docs.ackframework.io)'u ziyaret edin.
