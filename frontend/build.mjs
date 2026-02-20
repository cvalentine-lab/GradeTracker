import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  configFile: false,
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
