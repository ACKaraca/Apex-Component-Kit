#!/usr/bin/env node

/**
 * create-ack-app - Yeni ACK projesi oluştur
 * Türkçe: Bu dosya, interaktif olarak yeni ACK projeleri oluşturmayı sağlar.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Proje template'ları
 */
const TEMPLATES = {
  'counter': {
    name: 'Counter App',
    description: 'Basit counter uygulaması',
    files: {
      'src/pages/index.ack': COUNTER_TEMPLATE,
      'src/main.ts': MAIN_TS,
      'index.html': INDEX_HTML,
      'package.json': COUNTER_PACKAGE_JSON,
      'vite.config.ts': VITE_CONFIG,
      'README.md': COUNTER_README
    }
  },
  'todo': {
    name: 'Todo App',
    description: 'Todo list uygulaması',
    files: {
      'src/pages/index.ack': TODO_TEMPLATE,
      'src/main.ts': MAIN_TS,
      'index.html': INDEX_HTML,
      'package.json': TODO_PACKAGE_JSON,
      'vite.config.ts': VITE_CONFIG,
      'README.md': TODO_README
    }
  },
  'blank': {
    name: 'Blank Project',
    description: 'Boş proje',
    files: {
      'src/pages/index.ack': BLANK_TEMPLATE,
      'src/main.ts': MAIN_TS,
      'index.html': INDEX_HTML,
      'package.json': BLANK_PACKAGE_JSON,
      'vite.config.ts': VITE_CONFIG,
      'README.md': BLANK_README
    }
  }
};

/**
 * Proje oluştur
 */
export async function createProject(projectName: string, template: keyof typeof TEMPLATES = 'blank'): Promise<void> {
  const projectPath = path.join(process.cwd(), projectName);

  // Dizinin zaten var olup olmadığını kontrol et
  if (fs.existsSync(projectPath)) {
    console.error(`❌ Hata: '${projectName}' dizini zaten var!`);
    process.exit(1);
  }

  console.log(`
╔══════════════════════════════════════╗
║  🚀 ACK Proje Oluşturucu            ║
║  Creating: ${projectName.padEnd(24)} ║
╚══════════════════════════════════════╝
  `);

  try {
    // Dizini oluştur
    fs.mkdirSync(projectPath, { recursive: true });

    // Gerekli alt dizinleri oluştur
    fs.mkdirSync(path.join(projectPath, 'src', 'pages'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'src', 'components'), { recursive: true });

    // Template dosyalarını oluştur
    const selectedTemplate = TEMPLATES[template];
    for (const [filePath, content] of Object.entries(selectedTemplate.files)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);

      // Dizini oluştur
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Dosyayı yaz
      fs.writeFileSync(fullPath, content);
      console.log(`  ✓ ${filePath}`);
    }

    // Git repo initialize et
    if (fs.existsSync(path.join(projectPath, '.git')) === false) {
      try {
        require('child_process').execSync('git init', { cwd: projectPath });
        fs.writeFileSync(path.join(projectPath, '.gitignore'), GIT_IGNORE);
        console.log(`  ✓ .gitignore`);
      } catch (err) {
        // Git yüklü değilse, sadece devam et
      }
    }

    console.log(`
✅ Proje başarıyla oluşturuldu!
   📁 Dizin: ${projectPath}
   
   Sonraki adımlar:
   1. cd ${projectName}
   2. pnpm install
   3. pnpm dev
   
   Daha fazla bilgi: https://ackframework.io
    `);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectName = process.argv[2] || 'my-ack-app';
  const template = (process.argv[3] || 'blank') as keyof typeof TEMPLATES;

  if (!TEMPLATES[template]) {
    console.error(`❌ Bilinmeyen template: ${template}`);
    console.log(`Mevcut templates: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  await createProject(projectName, template);
}

// ============ TEMPLATE CONTENTS ============

const COUNTER_TEMPLATE = `<script>
  let count = 0;
  
  function increment() {
    count++;
  }
  
  function decrement() {
    count--;
  }
</script>

<template>
  <div class="counter">
    <h1>Counter</h1>
    <div class="display">{count}</div>
    <div class="buttons">
      <button @click={decrement}>−</button>
      <button @click={increment}>+</button>
    </div>
  </div>
</template>

<style scoped>
  .counter {
    max-width: 400px;
    margin: 50px auto;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
    color: white;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  
  h1 { margin: 0 0 20px 0; }
  
  .display {
    font-size: 48px;
    font-weight: bold;
    margin: 30px 0;
  }
  
  .buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  
  button {
    padding: 10px 20px;
    font-size: 18px;
    border: none;
    border-radius: 5px;
    background: white;
    color: #667eea;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
  }
  
  button:hover {
    transform: scale(1.05);
  }
  
  button:active {
    transform: scale(0.95);
  }
</style>`;

const TODO_TEMPLATE = `<script>
  let todos = [];
  let input = '';
  
  function addTodo() {
    if (input.trim()) {
      todos.push({ id: Date.now(), text: input, done: false });
      input = '';
    }
  }
  
  function removeTodo(id) {
    todos = todos.filter(t => t.id !== id);
  }
  
  function toggleTodo(id) {
    todos = todos.map(t => t.id === id ? {...t, done: !t.done} : t);
  }
</script>

<template>
  <div class="container">
    <h1>📝 My Todos</h1>
    <div class="input-group">
      <input 
        type="text" 
        placeholder="Add a new todo..." 
        @input={e => input = e.target.value}
      />
      <button @click={addTodo}>Add</button>
    </div>
    <ul class="todos">
      {todos.map(todo => (
        <li key={todo.id} class={{done: todo.done}}>
          <input 
            type="checkbox" 
            checked={todo.done}
            @change={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button @click={() => removeTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  </div>
</template>

<style scoped>
  .container { max-width: 500px; margin: 0 auto; padding: 2rem; }
  h1 { text-align: center; color: #333; }
  .input-group { display: flex; gap: 10px; margin-bottom: 2rem; }
  input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
  button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
  .todos { list-style: none; padding: 0; }
  li { display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid #eee; align-items: center; }
  li.done span { text-decoration: line-through; color: #ccc; }
</style>`;

const BLANK_TEMPLATE = `<script>
  let name = 'ACK';
</script>

<template>
  <div class="app">
    <h1>Welcome to {name} Framework!</h1>
    <p>Başlamak için bu dosyayı düzenle: src/pages/index.ack</p>
  </div>
</template>

<style scoped>
  .app {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  h1 { color: #333; }
  p { color: #666; margin-top: 10px; }
</style>`;

const MAIN_TS = `import { mount } from '@ack/runtime';
import Page from './pages/index.ack';

const app = new Page();
mount(app, '#app');
`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACK App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`;

const VITE_CONFIG = `import { defineConfig } from 'vite';
import ackPlugin from '@ack/vite-plugin';

export default defineConfig({
  plugins: [ackPlugin()],
  server: {
    port: 5173,
    open: true,
  },
});`;

const GIT_IGNORE = `node_modules/
dist/
build/
.DS_Store
*.local
.env
.env.local
.pnpm-debug.log`;

const COUNTER_PACKAGE_JSON = JSON.stringify({
  "name": "my-counter-app",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ack/kit": "^0.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}, null, 2);

const TODO_PACKAGE_JSON = JSON.stringify({
  "name": "my-todo-app",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ack/kit": "^0.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}, null, 2);

const BLANK_PACKAGE_JSON = JSON.stringify({
  "name": "my-ack-app",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ack/kit": "^0.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}, null, 2);

const COUNTER_README = `# Counter App

Basit bir counter uygulaması.

\`\`\`bash
pnpm dev      # Dev server başlat
pnpm build    # Production build
\`\`\``;

const TODO_README = `# Todo App

Basit bir todo list uygulaması.

\`\`\`bash
pnpm dev      # Dev server başlat
pnpm build    # Production build
\`\`\``;

const BLANK_README = `# My ACK App

Bu bir ACK Framework uygulamasıdır.

\`\`\`bash
pnpm dev      # Dev server başlat
pnpm build    # Production build
\`\`\``;

export { TEMPLATES, createProject };
