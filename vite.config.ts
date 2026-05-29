import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    // Split the single ~1.1 MB bundle into cacheable vendor chunks so the
    // initial download is smaller and the 500 kB chunk warning goes away.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@dnd-kit')) return 'dnd';
          if (
            id.includes('recharts') ||
            id.includes('victory-vendor') ||
            id.includes('d3-') ||
            id.includes('/d3/') ||
            id.includes('internmap') ||
            id.includes('delaunator') ||
            id.includes('robust-predicates') ||
            id.includes('decimal.js-light')
          ) {
            return 'charts';
          }
          return 'vendor';
        },
      },
    },
  },
});
