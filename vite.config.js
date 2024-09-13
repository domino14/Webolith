import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteCommonjs()],
  root: 'djAerolith/wordwalls/static/js/wordwalls/',
  base: '/static/',
  build: {
    manifest: 'manifest.json',
    rollupOptions: {
      input: 'djAerolith/wordwalls/static/js/wordwalls/main.js',
    },
    outDir: 'djAerolith/static/dist',
    assetsDir: '', // You might want assets in the root folder of 'dist'
    emptyOutDir: true, // Clear old files when building
  },
  resolve: {
    alias: {
      bootstrap: 'abc/node_modules/bootstrap/dist/js/bootstrap.min.js',
      './rpc/wordsearcher/searcher_pb.js': './gen/rpc/wordsearcher/searcher_pb.js',
    },
  },
});
