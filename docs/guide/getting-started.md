# Getting Started with ACK Framework

**Welcome to the ACK Framework!** This guide will walk you through the essential steps to get your first ACK application up and running. We'll cover installation, creating a basic app, and where to go for more information.

---

## 1. What is ACK Framework?

The ACK Framework is a next-generation web framework designed for building high-performance, scalable, and modern web applications. It focuses on:

- **Blazing Fast Performance:** Leveraging advanced techniques like lazy loading, code splitting, and intelligent prefetching out of the box.
- **Developer Experience:** Providing a simple, intuitive, and powerful API that makes development a joy.
- **Robust Tooling:** A comprehensive ecosystem of tools for routing, API integration, and state management.

---

## 2. Installation

Getting started is as simple as installing the core package from the npm registry using `pnpm`.

```bash
# Create a new project directory
mkdir my-ack-app
cd my-ack-app

# Initialize a new project
pnpm init

# Install the ACK Framework kit
pnpm add @ack/kit
```

This will install the necessary dependencies to build your application.

---

## 3. Your First Application

Let's create a simple "Hello, World!" application to see how easy it is to get started.

### Step A: Create Your Main Component

First, create a directory for your source code and a file for your main component.

```bash
mkdir src
touch src/App.ack
```

Now, open `src/App.ack` and add the following code. ACK components use a familiar template-script-style structure.

```html
<!-- src/App.ack -->
<template>
  <div class="container">
    <h1>{ message }</h1>
    <button onclick="{ toggleMessage }">Change Message</button>
  </div>
</template>

<script>
  export let message = 'Hello, ACK Framework!';

  export function toggleMessage() {
    message = message === 'Hello, ACK Framework!' ? 'You clicked the button!' : 'Hello, ACK Framework!';
  }
</script>

<style>
  .container {
    font-family: sans-serif;
    text-align: center;
    margin-top: 5rem;
  }
  h1 {
    color: #333;
  }
</style>
```

### Step B: Set Up the Router

ACK Framework comes with a powerful file-based router. Create an entry file for your application.

```bash
touch src/main.js
```

In `src/main.js`, initialize the router and tell it where to find your pages.

```javascript
// src/main.js
import { createAdvancedRouter } from '@ack/kit';

// Initialize the router and point it to your source directory
const router = createAdvancedRouter('./src');

// Mount the main application component
async function startApp() {
  // The router automatically discovers `App.ack` as the root component
  await router.navigate('/');
  console.log('Application started and navigated to root.');
}

startApp();
```

---

## 4. Running the Application

To run your application, you'll need a development server. While the ACK Framework is platform-agnostic, you can use a simple server like `vite` for local development.

First, install `vite`:

```bash
pnpm add -D vite
```

Next, create a `vite.config.js` file in your project root:

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Vite configuration options go here
});
```

Finally, create an `index.html` file to serve as the entry point for your application.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My ACK App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

Now, you can start the development server:

```bash
pnpm vite
```

Open your browser to the URL provided by Vite (usually `http://localhost:5173`), and you should see your first ACK application running!

---

## 5. Next Steps

Congratulations on building your first ACK application! You've only scratched the surface. Here are some resources to continue your journey:

- **Dive into the Tutorial:** For step-by-step, in-depth examples, check out our [Tutorial Series](./../tutorial/overview.md).
- **Explore the API:** Get a detailed look at all the available functions and classes in the [API Reference](./../api/overview.md).
- **Learn Best Practices:** Write better, more maintainable code with our [Best Practices Guide](./best-practices.md).
- **Optimize Your App:** Squeeze every bit of performance out of your application with our [Performance Guide](./performance.md).

Happy coding!