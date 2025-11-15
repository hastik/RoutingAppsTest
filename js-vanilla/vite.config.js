import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const rootDir = resolve(__dirname);

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared/client')
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      allow: [resolve(__dirname, '..')]
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
