/**
 * Builder - Production build sistemi
 * Türkçe: Bu modül, ACK projelerinin production için optimize edilmiş build'ini yapar.
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import ackPlugin from '@ack/vite-plugin';
import path from 'path';
import fs from 'fs';

export interface BuildOptions {
  root?: string;
  outDir?: string;
  minify?: boolean;
  sourceMap?: boolean;
  analyze?: boolean;
}

/**
 * Production build yap
 */
export async function buildApp(options: BuildOptions = {}): Promise<void> {
  const {
    root = process.cwd(),
    outDir = 'dist',
    minify = true,
    sourceMap = false,
    analyze = false
  } = options;

  console.log(`
╔══════════════════════════════════════╗
║  🔨 ACK Production Build            ║
║  Building...                         ║
╚══════════════════════════════════════╝
  `);

  const viteConfig: InlineConfig = {
    root,
    build: {
      outDir,
      minify: minify ? 'esbuild' : false,
      sourcemap: sourceMap,
      rollupOptions: {
        output: {
          entryFileNames: 'js/[name].[hash].js',
          chunkFileNames: 'js/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|gif|svg/.test(ext)) {
              return `images/[name].[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
              return `fonts/[name].[hash][extname]`;
            } else if (ext === 'css') {
              return `css/[name].[hash][extname]`;
            }
            return `assets/[name].[hash][extname]`;
          }
        }
      }
    },
    plugins: [
      ackPlugin({
        srcDir: path.join(root, 'src')
      })
    ]
  };

  try {
    // Build yap
    const result = await viteBuild(viteConfig);

    // Output info
    if (Array.isArray(result)) {
      result.forEach((bundle) => {
        if (bundle && 'output' in bundle) {
          const output = bundle.output;
          if (Array.isArray(output)) {
            output.forEach((file) => {
              if (file && 'fileName' in file) {
                console.log(`  ✓ ${file.fileName}`);
              }
            });
          }
        }
      });
    }

    console.log(`
✅ Build başarılı!
   📁 Output: ${path.join(root, outDir)}
   
   Tavsiyeler:
   - Build dosyalarını sunucuya upload et
   - Gzip compression etkinleştir
   - CDN kullanmayı düşün
    `);

    // Dosya boyutlarını göster
    const distPath = path.join(root, outDir);
    if (fs.existsSync(distPath)) {
      const size = calculateDirSize(distPath);
      console.log(`   📊 Toplam boyut: ${formatBytes(size)}\n`);
    }
  } catch (error) {
    console.error('Build hatası:', error);
    process.exit(1);
  }
}

/**
 * Dizin boyutunu hesapla
 */
function calculateDirSize(dir: string): number {
  let size = 0;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      size += calculateDirSize(filePath);
    } else {
      size += stat.size;
    }
  }

  return size;
}

/**
 * Byte'ları insan tarafından okunabilir formata dönüştür
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * CLI entry point
 */
export async function runBuild(): Promise<void> {
  const options: BuildOptions = {
    root: process.cwd(),
    outDir: 'dist',
    minify: process.env.MINIFY !== 'false',
    sourceMap: process.env.SOURCEMAP === 'true',
    analyze: process.env.ANALYZE === 'true'
  };

  await buildApp(options);
}
