# ACK Framework - Phase 2: Application Kit

**Phase 2: Complete Application Framework (@ack/kit)**

In this phase, we built a complete web application framework on top of Phase 1's compiler.

## 📦 Phase 2 Packages

### 1. @ack/vite-plugin
**Vite.js Integration**

- Process `.ack` files in Vite
- Hot Module Replacement (HMR) support
- Real-time recompilation
- Error reporting

**Usage:**
```typescript
// vite.config.ts
import ackPlugin from '@ack/vite-plugin';

export default {
  plugins: [ackPlugin({
    srcDir: 'src',
    include: [/\.ack$/],
    exclude: [/node_modules/]
  })]
};
```

### 2. @ack/kit
**Complete Application Framework**

**Dev Server:**
```typescript
import { startDevServer } from '@ack/kit';

const server = await startDevServer({
  root: process.cwd(),
  port: 5173,
  host: 'localhost',
  open: true
});
```

**File-based Routing:**
```typescript
import { createRouter, discoverRoutes } from '@ack/kit';

const router = createRouter('./src');
// Automatically discovers routes from src/pages directory

// src/pages/index.ack → /
// src/pages/about.ack → /about
// src/pages/user/[id].ack → /user/:id
```

**Production Build:**
```typescript
import { buildApp } from '@ack/kit';

await buildApp({
  root: process.cwd(),
  outDir: 'dist',
  minify: true,
  sourceMap: false
});
```

### 3. @ack/cli
**Project Creation and Management**

**Commands:**
```bash
# Create new project
create-ack-app my-app blank
create-ack-app my-counter counter
create-ack-app my-todos todo

# Alternative
npx @ack/cli create my-app
```

**Templates:**
- `blank` - Empty project
- `counter` - Counter application example
- `todo` - Todo list application example

## 🚀 Quick Start

### 1. Create Project
```bash
create-ack-app my-awesome-app counter
cd my-awesome-app
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

### 3. Production Build
```bash
pnpm build
```

### 4. Preview
```bash
pnpm preview
```

## 📁 Project Structure

```
my-ack-app/
├── src/
│   ├── pages/           # File-based routing
│   │   ├── index.ack    # / route
│   │   ├── about.ack    # /about
│   │   └── blog/
│   │       └── [id].ack # /blog/:id (dynamic)
│   ├── components/      # Reusable components
│   │   └── Header.ack
│   ├── main.ts          # App entry point
│   └── style.css        # Global styles
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── package.json         # Dependencies
└── README.md
```

## 🛣️ File-based Routing

Routes are automatically discovered from `src/pages`:

| File                    | Route              |
|-------------------------|-------------------|
| `index.ack`             | `/`                |
| `about.ack`             | `/about`           |
| `blog.ack`              | `/blog`            |
| `user/index.ack`        | `/user`            |
| `user/profile.ack`      | `/user/profile`    |
| `user/[id].ack`         | `/user/:id`        |
| `[...slug].ack`         | `/*` (catch-all)   |

## 🔥 Dev Server Features

- ⚡ **Instant Updates** - Changes reflected instantly via HMR
- 🔄 **Auto Refresh** - Automatic reload when errors are fixed
- 📝 **Error Display** - Show compiler errors in browser
- 🗺️ **Source Maps** - Debugging support
- 🔌 **Hot Module Replacement** - Preserve state with full reload

## 🏗️ Production Build

The build system provides:

- ✅ **Code Minification** - Optimized with esbuild
- ✅ **Asset Optimization** - Image and font optimization
- ✅ **Chunking** - Intelligent code splitting
- ✅ **Source Maps** - Production debugging
- ✅ **Gzip Compression** - Size reduction

**Build output:**
```
dist/
├── index.html
├── js/
│   ├── main.xxxxx.js
│   └── vendor.xxxxx.js
├── css/
│   └── style.xxxxx.css
├── images/
└── fonts/
```

## 📚 Example: Counter App Structure

```
counter-app/
├── src/
│   ├── pages/
│   │   └── index.ack
│   ├── main.ts
│   └── style.css
├── index.html
├── vite.config.ts
└── package.json
```

## 🔌 Vite Plugin API

```typescript
import ackPlugin from '@ack/vite-plugin';

ackPlugin({
  // Include .ack files
  include: [/\.ack$/],
  
  // Exclude these files
  exclude: [/node_modules/],
  
  // Source directory
  srcDir: 'src'
})
```

## 🎯 Phase 2 Features Added

✅ **Dev Server (Vite-based)**
- Hot Module Replacement
- Error overlay
- Source maps
- Instant reload

✅ **File-based Routing**
- Automatic route discovery
- Dynamic routes (`[param]`)
- Catch-all routes (`[...slug]`)
- Nested routes

✅ **Production Build**
- Code minification
- Asset optimization
- Source maps
- Performance optimizations

✅ **Project Scaffolding (@ack/cli)**
- `create-ack-app` command
- Ready-to-use templates
- Project initialization

## 🚫 Phase 2 Limitations

- Lazy loading (Phase 3)
- Server-side rendering (Phase 3)
- State management (Phase 3)
- Advanced routing guards (Phase 3)

## 🔮 Next Steps (Phase 3)

- **Advanced Routing:** Route guards, middleware
- **Server-side Rendering:** SSR support
- **State Management:** Built-in store
- **API Integration:** Data fetching utilities
- **Middleware System:** Plugin architecture

## 📚 Complete Examples

### Create Counter App
```bash
create-ack-app my-counter counter
cd my-counter
pnpm install
pnpm dev
```

### Create Todo App
```bash
create-ack-app my-todos todo
cd my-todos
pnpm install
pnpm dev
```

## 🎓 Best Practices

### 1. Component Organization
```
src/
├── pages/          # Page components (routing)
├── components/     # Reusable components
├── utils/          # Utilities
└── main.ts         # Entry point
```

### 2. Naming Conventions
- Pages: PascalCase (`index.ack`, `About.ack`)
- Components: PascalCase (`Header.ack`)
- Utils: camelCase (`helpers.ts`)

### 3. Performance
- Lazy load heavy components
- Use dynamic imports
- Optimize asset sizes

## 🐛 Troubleshooting

**Dev server not starting on port 5173:**
```bash
PORT=3000 pnpm dev
```

**HMR not working:**
Check `vite.config.ts`:
```typescript
export default {
  server: {
    hmr: {
      host: 'localhost',
      port: 5173
    }
  }
};
```

**Build fails:**
```bash
rm -rf dist node_modules
pnpm install
pnpm build
```

## 📖 Detailed Documentation

More info: `ARCHITECTURE.md` and `packages/kit/README.md`

---

## Summary

**Phase 1 + Phase 2 = Complete Web App Framework**

```
.ack Source Code
    ↓
@ack/compiler (Phase 1)
    ↓
Optimized JavaScript
    ↓
@ack/vite-plugin (Phase 2)
    ↓
Dev Server + HMR
    ↓
Running application in browser
```

Now develop web applications with ACK Framework in a fun and fast way! 🚀

---

**Version**: 0.0.1  
**Last Updated**: October 2025  
**Status**: Phase 2 Complete ✅
