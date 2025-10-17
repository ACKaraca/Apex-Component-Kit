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
 * Template Constants - moved before TEMPLATES object
 */

// Counter template
const COUNTER_TEMPLATE = `<script>
  let count = 0;
</script>

<template>
  <div>
    <h1>Counter: {count}</h1>
    <button @click={() => count++}>Increment</button>
    <button @click={() => count--}>Decrement</button>
  </div>
</template>

<style>
  h1 {
    font-size: 24px;
  }
  button {
    margin: 5px;
    padding: 10px;
  }
</style>`;

// Todo template
const TODO_TEMPLATE = `<script>
  let todos = [];
  let input = '';
</script>

<template>
  <div>
    <h1>Todo App</h1>
    <input bind:value={input} placeholder="Add a todo" />
    <button @click={() => { todos.push(input); input = ''; }}>Add</button>
    <ul>
      {#each todos as todo}
        <li>{todo}</li>
      {/each}
    </ul>
  </div>
</template>

<style>
  input { padding: 5px; }
  button { padding: 5px 10px; }
  li { margin: 5px 0; }
</style>`;

// Blank template
const BLANK_TEMPLATE = `<script>
  // Your code here
</script>

<template>
  <div>
    <h1>Hello ACK!</h1>
  </div>
</template>

<style>
  h1 { text-align: center; }
</style>`;

// Main.ts
const MAIN_TS = `import App from './pages/index.ack';
import { mount } from '@ack/runtime';

const app = App();
mount(app, document.body);`;

// Index.html
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
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

// Counter package.json
const COUNTER_PACKAGE_JSON = `{
  "name": "ack-counter-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ack/compiler": "^0.0.1",
    "@ack/runtime": "^0.0.1",
    "@ack/vite-plugin": "^0.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  }
}`;

// Todo package.json
const TODO_PACKAGE_JSON = `{
  "name": "ack-todo-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ack/compiler": "^0.0.1",
    "@ack/runtime": "^0.0.1",
    "@ack/vite-plugin": "^0.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  }
}`;

// Blank package.json
const BLANK_PACKAGE_JSON = `{
  "name": "ack-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ack/compiler": "^0.0.1",
    "@ack/runtime": "^0.0.1",
    "@ack/vite-plugin": "^0.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  }
}`;

// Vite config
const VITE_CONFIG = `import { defineConfig } from 'vite';
import ackPlugin from '@ack/vite-plugin';

export default defineConfig({
  plugins: [ackPlugin()],
  server: {
    port: 5173
  }
});`;

// Counter README
const COUNTER_README = `# ACK Counter App

A simple counter application built with ACK Framework.

\`\`\`bash
pnpm dev      # Start dev server
pnpm build    # Build for production
\`\`\``;

// Todo README
const TODO_README = `# ACK Todo App

A todo list application built with ACK Framework.

\`\`\`bash
pnpm dev      # Start dev server
pnpm build    # Build for production
\`\`\``;

// Blank README
const BLANK_README = `# ACK App

This is an ACK Framework application.

\`\`\`bash
pnpm dev      # Start dev server
pnpm build    # Build for production
\`\`\``;

// Git ignore
const GIT_IGNORE = `node_modules/
dist/
build/
.DS_Store
*.local
.env
.env.local
.pnpm-debug.log
*.log`;

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
async function createProject(projectName: string, template: keyof typeof TEMPLATES = 'blank'): Promise<void> {
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

export { TEMPLATES, createProject };
