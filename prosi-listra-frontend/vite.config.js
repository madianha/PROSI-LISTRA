import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
  // devtools hanya untuk browser, dimatikan saat menjalankan test
  plugins: [!process.env.VITEST && devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: 3000,
    // backend Express (folder backend/) berjalan di port 3001
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    target: 'esnext',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
