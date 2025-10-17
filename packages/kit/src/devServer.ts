/**
 * Dev Server - Vite tabanlı geliştirme sunucusu
 * Türkçe: Bu modül, ACK projelerinin Vite dev server'ında çalışmasını sağlar.
 */

import { createServer, type ViteDevServer } from 'vite';
import ackPlugin from '@ack/vite-plugin';
import path from 'path';

export interface DevServerOptions {
  root?: string;
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
}

/**
 * ACK Dev Server'ı başlat
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
      https
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
