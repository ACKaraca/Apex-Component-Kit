/**
 * @ack/vite-plugin - ACK Framework için Vite Plugin'i
 * Türkçe: Bu plugin .ack dosyalarını Vite dev server'da işleyen ve HMR desteği sağlayan plugin'dir.
 */

import type { Plugin, ViteDevServer, HMRPayload } from 'vite';
import { compile } from '@ack/compiler';
import fs from 'fs';
import path from 'path';

interface AckPluginOptions {
  include?: string[];
  exclude?: string[];
  srcDir?: string;
}

/**
 * ACK Vite Plugin'i oluştur
 */
export default function ackPlugin(options: AckPluginOptions = {}): Plugin {
  const {
    include = [/\.ack$/],
    exclude = [/node_modules/],
    srcDir = 'src'
  } = options;

  let server: ViteDevServer | undefined;
  const fileModuleCache = new Map<string, string>();

  return {
    name: 'ack-plugin',
    enforce: 'pre',

    /**
     * Dev server hazırlanırsa, referansı sakla
     */
    configureServer(devServer) {
      server = devServer;
    },

    /**
     * .ack dosyalarını resolve et
     */
    resolveId(id: string) {
      if (id.endsWith('.ack')) {
        return id;
      }
      return null;
    },

    /**
     * .ack dosyalarını yükle ve derle
     */
    load(id: string) {
      if (!id.endsWith('.ack')) {
        return null;
      }

      try {
        // Dosyayı oku
        const source = fs.readFileSync(id, 'utf-8');

        // Derle
        const result = compile(source, {
          filePath: id,
          format: 'esm',
          ssr: false
        });

        if (result.errors.length > 0) {
          const errors = result.errors
            .map((e) => `Line ${e.line}: ${e.message}`)
            .join('\n');
          throw new Error(`Compilation error in ${id}:\n${errors}`);
        }

        // Cache'e kaydet (HMR için)
        fileModuleCache.set(id, result.code);

        // Modülü dön
        return {
          code: result.code,
          map: result.map
        };
      } catch (error) {
        console.error(`Error loading ${id}:`, error);
        throw error;
      }
    },

    /**
     * HMR desteği
     */
    handleHotUpdate({ file, server, modules }) {
      if (file.endsWith('.ack')) {
        console.log(`[ack] ${path.relative(process.cwd(), file)} updated`);

        // Dosyayı yeniden yükle
        try {
          const source = fs.readFileSync(file, 'utf-8');
          const result = compile(source, {
            filePath: file,
            format: 'esm',
            ssr: false
          });

          if (result.errors.length > 0) {
            console.error(`Compilation error in ${file}:`, result.errors);
            return [];
          }

          // Cache'i güncelle
          fileModuleCache.set(file, result.code);

          // Perform full reload using HMR
          const payload: HMRPayload = {
            type: 'full-reload'
          };
          server.ws.send(payload);

          return [];
        } catch (error) {
          console.error(`Error updating ${file}:`, error);
          return [];
        }
      }

      return modules;
    }
  };
}

/**
 * Export types
 */
export type { AckPluginOptions };
