import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            'sonner',
          ],
          // Charts (heavy — split away)
          'vendor-charts': ['recharts'],
          // Form validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Utilities
          'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns', 'lucide-react'],
        },
      },
    },
  },
});
