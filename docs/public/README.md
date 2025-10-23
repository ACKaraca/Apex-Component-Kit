# ACK Framework

[![npm version](https://badge.fury.io/js/ack-framework.svg)](https://badge.fury.io/js/ack-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.com/ack-framework/ack.svg?branch=main)](https://travis-ci.com/ack-framework/ack)

ACK Framework, modern web uygulamaları geliştirmek için tasarlanmış yeni nesil JavaScript framework'üdür.

## ✨ Özellikler

- 🚀 **High Performance**: Server-side rendering ve code splitting
- 🧩 **Component-Based**: Yeniden kullanılabilir component'ler
- 🔧 **Developer-Friendly**: TypeScript desteği ve excellent DX
- 📱 **Mobile-First**: Responsive design ve PWA desteği
- 🌐 **SSR Ready**: SEO dostu server-side rendering
- 🔌 **Plugin System**: Zengin ekosistem ve plugin'ler

## 🚀 Quick Start

### Yeni Proje Oluşturma

```bash
# CLI ile proje oluşturma
npx create-ack-app my-app

# Manuel kurulum
mkdir my-app && cd my-app
pnpm init
pnpm add @ack/kit @ack/runtime @ack/compiler
```

### İlk Component

```ack
<script>
  let count = 0;

  function increment() {
    count++;
  }
</script>

<template>
  <div>
    <h1>Counter: {count}</h1>
    <button @click={increment}>Increment</button>
  </div>
</template>

<style>
  h1 { color: blue; }
  button { padding: 10px; }
</style>
```

### Development Server

```bash
pnpm dev
```

Projeniz http://localhost:3000 adresinde çalışacak!

## 📦 Paketler

| Paket | Version | Açıklama |
|-------|---------|----------|
| @ack/runtime | 0.0.1 | Core runtime with reactivity |
| @ack/compiler | 0.0.1 | Template compiler |
| @ack/kit | 0.3.0 | Application framework |
| @ack/api | 0.5.0 | API integration tools |
| @ack/store | 0.4.0 | State management |
| @ack/loader | 0.6.0 | Lazy loading & code splitting |

## 🌟 Örnekler

### Todo App
```ack
<script>
  let todos = [];
  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, { id: Date.now(), text: newTodo, done: false }];
      newTodo = '';
    }
  }
</script>

<template>
  <div>
    <h1>My Todos</h1>
    <input bind:value={newTodo} @keydown.enter={addTodo} />
    <button @click={addTodo}>Add</button>

    <ul>
      {#each todos as todo}
        <li>
          <input type="checkbox" bind:checked={todo.done} />
          <span class:done={todo.done}>{todo.text}</span>
        </li>
      {/each}
    </ul>
  </div>
</template>

<style>
  .done { text-decoration: line-through; }
</style>
```

## 🤝 Katkıda Bulunma

ACK Framework'e katkıda bulunmak için:

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📚 Dökümantasyon

- [📖 Resmi Dökümantasyon](https://docs.ackframework.io)
- [🎯 Tutorial](https://docs.ackframework.io/tutorial)
- [🔧 API Reference](https://docs.ackframework.io/api)
- [💬 Community](https://discord.gg/ack-framework)

## 🆘 Destek

- [🐛 Bug Reports](https://github.com/ack-framework/ack/issues)
- [💡 Feature Requests](https://github.com/ack-framework/ack/issues)
- [💬 Discord Community](https://discord.gg/ack-framework)
- [📧 Email Support](mailto:support@ackframework.io)

## 📄 Lisans

MIT License - detaylar için [LICENSE](../LICENSE) dosyasına bakınız.

## 🙏 Teşekkürler

ACK Framework'ü destekleyen tüm contributor'lara teşekkürler!

---

**Made with ❤️ by the ACK Framework team**
