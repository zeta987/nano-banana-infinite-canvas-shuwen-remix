import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: true,
    restoreMocks: true,
    clearMocks: true,
    include: ['test/**/*.spec.ts', 'test/**/*.spec.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
