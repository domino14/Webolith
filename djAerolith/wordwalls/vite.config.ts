import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  root: path.resolve(__dirname, './static/js/wordwalls'),
  base: '/static/js/wordwalls/',
  build: {
    outDir: path.resolve(__dirname, '../static/dist'),
    emptyOutDir: false, // Don't clear dist since other apps may use it
    manifest: true, // Generate manifest.json for cache busting
    rollupOptions: {
      input: path.resolve(__dirname, './static/js/wordwalls/index.ts'),
      output: {
        entryFileNames: 'wordwallsapp.[hash].js',
        chunkFileNames: 'vendor.[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'wordwallsapp.[hash].css';
          }
          return '[name].[hash].[ext]';
        },
      },
    },
  },
  experimental: {
    renderBuiltUrl(filename: string) {
      // Fix font URLs to point to the correct location
      if (filename.endsWith('.woff') || filename.endsWith('.woff2')) {
        return `/static/dist/${filename}`;
      }
      // Let Vite handle other assets normally
      return { relative: true };
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      wordvaultapp: path.resolve(__dirname, '../../frontend/src/'),
      wordwallsapp: path.resolve(__dirname, './static/js/wordwalls/'),
      // Ensure React consistency across apps
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 8097,
    host: '0.0.0.0',
    cors: {
      origin: [
        'http://aerolith.localhost',
        'http://localhost',
        'http://127.0.0.1',
      ],
      credentials: true,
    },
    hmr: {
      port: 8097,
      host: '0.0.0.0',
    },
    watch: {
      usePolling: true, // Helps with Docker file watching
    },
  },
  // Hot reload configuration
  optimizeDeps: {
    include: ['react', 'react-dom', 'immutable'],
  },
});
