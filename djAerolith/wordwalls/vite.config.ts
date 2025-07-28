import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    {
      name: 'provide-jquery',
      config(config, { command }) {
        if (command === 'serve') {
          config.define = config.define || {};
          config.define['$'] = 'window.$';
          config.define['jQuery'] = 'window.jQuery';
        }
      },
      configureServer(server) {
        server.middlewares.use('/jquery.js', (req, res, next) => {
          if (req.url === '/jquery.js') {
            res.setHeader('Content-Type', 'application/javascript');
            res.end(`
              import $ from 'jquery';
              window.$ = window.jQuery = $;
              export default $;
            `);
          } else {
            next();
          }
        });
      }
    },
  ],
  root: path.resolve(__dirname, "./static/js/wordwalls"),
  base: "/static/js/wordwalls/",
  build: {
    outDir: path.resolve(__dirname, "../static/dist"),
    emptyOutDir: false, // Don't clear dist since other apps may use it
    rollupOptions: {
      input: path.resolve(__dirname, "./static/js/wordwalls/index.js"),
      output: {
        entryFileNames: "wordwallsapp.js",
        chunkFileNames: "vendor.js",
        assetFileNames: "[name].[ext]",
      }
    }
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      wordvaultapp: path.resolve(__dirname, "../../frontend/src/"),
      wordwallsapp: path.resolve(__dirname, "./static/js/wordwalls/"),
      // Ensure React consistency across apps
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
      // Add bootstrap alias
      bootstrap: path.resolve(__dirname, "../../node_modules/bootstrap"),
    },
  },
  define: {
    global: "globalThis",
  },
  server: {
    port: 7000,
    host: "0.0.0.0",
    cors: {
      origin: ["http://aerolith.localhost", "http://localhost", "http://127.0.0.1"],
      credentials: true,
    },
    hmr: {
      host: "localhost",
      port: 7000,
    },
  },
  // Hot reload configuration
  optimizeDeps: {
    include: ["react", "react-dom", "jquery", "bootstrap"],
  },
});