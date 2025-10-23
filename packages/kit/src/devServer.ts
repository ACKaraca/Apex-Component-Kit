/**
 * Dev Server - Vite tabanlı geliştirme sunucusu
 * Türkçe: Bu modül, ACK projelerinin Vite dev server'ında çalışmasını sağlar.
 */

import { createServer, type ViteDevServer } from 'vite';
import ackPlugin from '@ack/vite-plugin';
import path from 'path';

/**
 * Configuration options for the development server.
 * @interface DevServerOptions
 * @property {string} [root=process.cwd()] - The root directory of the project.
 * @property {number} [port=5173] - The port to run the server on.
 * @property {string} [host='localhost'] - The hostname to run the server on.
 * @property {boolean} [open=true] - Whether to automatically open the browser.
 * @property {boolean} [https=false] - Whether to use HTTPS.
 */
export interface DevServerOptions {
  root?: string;
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
}

/**
 * Starts the ACK development server, which is built on top of Vite.
 * @param {DevServerOptions} [options={}] - Configuration options for the server.
 * @returns {Promise<ViteDevServer>} A promise that resolves with the Vite dev server instance.
 */
export async function startDevServer(options: DevServerOptions = {}): Promise<ViteDevServer> {
  const {
    root = process.cwd(),
    port = 5173,
    host = 'localhost',
    open = true,
    https = false
  } = options;

  console.log(`
╔══════════════════════════════════════╗
║  🚀 ACK Development Server          ║
║  Starting...                         ║
╚══════════════════════════════════════╝
  `);

  const server = await createServer({
    root,
    plugins: [
      ackPlugin({
        srcDir: path.join(root, 'src')
      })
    ],
    server: {
      middlewareMode: false,
      port,
      host,
      open,
      // https: https
    },
    resolve: {
      alias: {
        '~': path.resolve(root, 'src')
      }
    }
  });

  // Server'ı başlat
  await server.listen();

  console.log(`
✅ Dev server çalışmaya başladı:
   🌐 URL: http://${host}:${port}
   📁 Root: ${root}
   
   Ctrl+C ile kapatabilirsiniz.
  `);

  return server;
}

/**
 * Dev server'ı kapat
 */
export async function closeDevServer(server: ViteDevServer): Promise<void> {
  await server.close();
  console.log('Dev server kapatıldı.');
}

/**
 * CLI entry point
 */
export async function runDevServer(): Promise<void> {
  const options: DevServerOptions = {
    root: process.cwd(),
    port: parseInt(process.env.PORT || '5173'),
    host: process.env.HOST || 'localhost',
    open: process.env.OPEN !== 'false',
    https: process.env.HTTPS === 'true'
  };

  const server = await startDevServer(options);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await closeDevServer(server);
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeDevServer(server);
    process.exit(0);
  });
}
