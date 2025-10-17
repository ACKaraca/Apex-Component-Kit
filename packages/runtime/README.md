# @ack/runtime

**ACK Runtime** - Derlenmiş bileşenlerin DOM'a bağlanması ve reaktif sistem yönetimi için minimal runtime.

## 📦 Kurulum

```bash
npm install @ack/runtime
# or
pnpm add @ack/runtime
```

## 🚀 Hızlı Kullanım

```javascript
import { mount, createReactive } from '@ack/runtime';

// Bileşen oluştur
const component = {
  element: document.createElement('div'),
  mount(target) {
    const el = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    el?.appendChild(this.element);
  }
};

// DOM'a bağla
mount(component, '#app');

// Reaktif state
const state = createReactive({ count: 0 });
state.count = 1; // Otomatik watchers tetiklenir
```

## 📝 API

### Reactivity

#### createReactive(obj)

Bir JavaScript objesini reaktif hale getir.

```typescript
const reactive = createReactive({
  count: 0,
  name: 'ACK'
});

// Değişiklikleri izle
const unwatch = watch(reactive, 'count', (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`);
});

reactive.count++;  // Logs: "count: 0 → 1"
unwatch();         // Watcher'ı kaldır
```

#### watch(obj, prop, callback)

Reaktif objenin bir özelliğini izle.

```typescript
watch(reactive, 'count', (newValue, oldValue) => {
  console.log(`Updated: ${oldValue} → ${newValue}`);
});

// Tüm değişiklikleri izle
watch(reactive, '*', (newValue, oldValue) => {
  console.log('Something changed');
});
```

**Dönüş**: Watcher'ı kaldırmak için fonksiyon

#### isReactive(obj)

Bir objenin reaktif olup olmadığını kontrol et.

```typescript
const reactive = createReactive({ x: 1 });
const plain = { x: 1 };

console.log(isReactive(reactive)); // true
console.log(isReactive(plain));    // false
```

#### clearWatchers(obj)

Tüm watchers'ı temizle.

```typescript
clearWatchers(reactive);
```

### DOM Mounting

#### mount(component, target)

Bileşeni DOM'a bağla.

```typescript
mount(component, '#app');           // Selector string
mount(component, domElement);       // DOM element
```

**Parametreler:**
- `component` - ACK component objesi
- `target` - Hedef selector veya DOM elemanı

**Dönüş**: Mounted element

#### unmount(component)

Bileşeni DOM'dan çıkar ve temizle.

```typescript
unmount(component);

// Component'in destroy hook'u otomatik çağrılır
```

#### hydrate(constructor, selector, props)

Server-rendered HTML'i client tarafında hydrate et.

```typescript
const component = hydrate(
  CounterComponent,
  '#app',
  { initialValue: 10 }
);

mount(component, '#app');
```

#### ComponentManager

Birden fazla bileşeni merkezi olarak yönet.

```typescript
const manager = new ComponentManager();

// Bileşen ekle
manager.add('counter', counterComponent);
manager.add('todos', todosComponent);

// Mount et
manager.mount('counter', '#counter-section');
manager.mount('todos', '#todos-section');

// Unmount et
manager.unmount('counter');

// Hepsi
manager.clear();

// Tüm bileşenleri al
const all = manager.getAll();
```

### Effects

#### createEffect(callback, options)

Side effects'ları yönet.

```typescript
createEffect(() => {
  console.log('Component mounted');
  
  // Cleanup function
  return () => {
    console.log('Component destroyed');
  };
}, { immediate: true });
```

**Options:**
- `immediate?: boolean` - Hemen çalıştır (default: true)
- `flush?: 'pre' | 'post' | 'sync'` - Çalışma zamanı

**Dönüş**: Effect'i kaldırmak için fonksiyon

```typescript
const cleanup = createEffect(() => {
  // ...
});

cleanup(); // Effect'i kaldır
```

#### Computed<T>

Memoized computed properties.

```typescript
const computed = new Computed(() => {
  return state.count * 2;
});

computed.get();           // Değeri al (lazy eval)
computed.markDirty();     // Dirty mark et, recalculate et
computed.watch(callback); // Watcher ekle
```

#### computed(getter)

Computed getter oluştur.

```typescript
const doubleCount = computed(() => state.count * 2);

console.log(doubleCount()); // Otomatik calculate
```

#### memo(getter, compareFn)

Memoized fonksiyon oluştur.

```typescript
const memoized = memo(
  () => expensiveCalculation(),
  (a, b) => a === b  // Custom comparison
);

memoized(); // Hesaplanmış değer
```

#### batch(callback)

Birden fazla state update'ini batch et.

```typescript
batch(() => {
  state.count++;
  state.name = 'new';
  // Tek bir rerender tetiklenir
});
```

#### EffectManager

Multiple effects'leri yönet.

```typescript
const manager = new EffectManager();

manager.add('effect1', () => {
  console.log('Effect 1');
});

manager.add('effect2', () => {
  console.log('Effect 2');
});

manager.remove('effect1');
manager.clear(); // Hepsi
```

## 📚 Örnekler

### Basit Counter

```javascript
import { mount, createReactive, watch } from '@ack/runtime';

// Component
const Counter = {
  element: document.createElement('div'),
  
  init() {
    this.state = createReactive({ count: 0 });
    
    // Watchers
    watch(this.state, 'count', (newVal) => {
      this.render(newVal);
    });
    
    this.render(0);
  },
  
  render(count) {
    this.element.innerHTML = `
      <div>
        <p>Count: ${count}</p>
        <button id="btn">Increment</button>
      </div>
    `;
    
    this.element.querySelector('#btn').addEventListener('click', () => {
      this.state.count++;
    });
  },
  
  mount(target) {
    this.init();
    const el = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    el?.appendChild(this.element);
  }
};

Counter.mount('#app');
```

### Mit Effects

```javascript
import { createReactive, createEffect, watch } from '@ack/runtime';

const state = createReactive({
  apiUrl: '/api/data',
  data: null,
  loading: false
});

// Fetch effect
createEffect(() => {
  if (!state.apiUrl) return;
  
  state.loading = true;
  
  fetch(state.apiUrl)
    .then(r => r.json())
    .then(data => {
      state.data = data;
      state.loading = false;
    });
  
  return () => {
    // Cleanup
    state.loading = false;
  };
});

// Watch changes
watch(state, 'data', (newData) => {
  console.log('Data updated:', newData);
});
```

### Component Manager

```javascript
import { ComponentManager } from '@ack/runtime';

const manager = new ComponentManager();

// Register components
manager.add('header', createHeaderComponent());
manager.add('sidebar', createSidebarComponent());
manager.add('main', createMainComponent());

// Mount all
manager.mount('header', '#header');
manager.mount('sidebar', '#sidebar');
manager.mount('main', '#main');

// Later...
manager.unmount('sidebar');
```

## 🔄 Veri Akışı

```
User Action (e.g., button click)
    ↓
Variable Update (e.g., count++)
    ↓
Proxy Setter Triggered
    ↓
Watcher Callbacks Executed
    ↓
DOM Update Handler Called
    ↓
Element's Content Updated
    ↓
Browser Renders
```

## ✅ Özellikler

- ✅ ES6 Proxy tabanlı reaktivite
- ✅ Watchers ve effects
- ✅ Computed properties
- ✅ Component mounting/unmounting
- ✅ SSR hydration
- ✅ Zero runtime dependencies
- ✅ Full TypeScript support

## 📊 Performance

- **Reactivity**: O(1) proxy operations
- **DOM updates**: O(k) where k = affected elements
- **Memory**: Minimal - no virtual DOM

## 🔐 Security

- Safe property access via Proxy
- No eval or dynamic code execution
- Type-safe operations

## 🎯 Best Practices

1. **Always cleanup effects**
   ```javascript
   const cleanup = createEffect(() => {
     // ...
     return () => { /* cleanup */ };
   });
   ```

2. **Use ComponentManager for multiple components**
   ```javascript
   const manager = new ComponentManager();
   manager.add('comp1', comp1);
   manager.add('comp2', comp2);
   ```

3. **Batch multiple updates**
   ```javascript
   batch(() => {
     state.a = 1;
     state.b = 2;
   });
   ```

4. **Watch nested properties carefully**
   ```javascript
   // Watch only works on direct properties
   // For nested, create new reactive object
   ```

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi: [../../ARCHITECTURE.md](../../ARCHITECTURE.md)

---

**Version**: 0.0.1  
**License**: MIT
