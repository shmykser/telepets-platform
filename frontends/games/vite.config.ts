import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/telepets-platform/games/' : '/games/';

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@config': resolve(__dirname, 'src/config'),
        '@phaser': resolve(__dirname, 'src/phaser'),
        '@integration': resolve(__dirname, 'src/integration'),
        '@lib': resolve(__dirname, 'src/lib'),
        '@data': resolve(__dirname, 'src/data'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@components': resolve(__dirname, 'src/components'),
        '@styles': resolve(__dirname, 'src/styles'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@utils': resolve(__dirname, 'src/utils')
      }
    },
    server: {
      port: 5174,
      host: true,
      historyApiFallback: {
        index: '/games/index.html'
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        '/static': {
          target: 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true
    }
  };
});

