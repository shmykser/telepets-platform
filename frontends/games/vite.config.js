import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export default defineConfig({
    server: {
        host: true,
        port: 3002
    },
    preview: {
        host: true,
        port: 3002
    },
    resolve: {
        alias: (() => {
            const root = fileURLToPath(new URL('.', import.meta.url));
            return {
                '@': path.resolve(root, 'src'),
                '@config': path.resolve(root, 'config')
            };
        })()
    },
    build: {
        target: 'es2020',
        sourcemap: false, // Отключаем для production
        rollupOptions: {
            input: {
                main: 'index.html',
                petthief: 'src/petthief-direct.js'
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    return chunkInfo.name === 'petthief' ? 'petthief-direct.js' : 'assets/[name]-[hash].js';
                }
            }
        }
    },
    base: '/games/' // Относительный путь для GitHub Pages
});
