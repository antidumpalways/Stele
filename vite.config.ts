import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
    hmr: { overlay: false },
    fs: { strict: false },
  },
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    include: [
      "qrcode",
      "@worldcoin/minikit-js",
      "eventemitter3",
      "buffer",
      "use-sync-external-store",
      "use-sync-external-store/shim/with-selector",
      "zustand",
    ],
    exclude: ["@worldcoin/idkit-core"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  worker: {
    plugins: () => [wasm(), topLevelAwait()],
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    {
      name: "wasm-mime",
      configureServer(server) {
        const wasmMime = (req: any, res: any, next: () => void) => {
          const url = (req.url ?? req.originalUrl ?? "") as string;
          if (url.includes(".wasm")) {
            res.setHeader("Content-Type", "application/wasm");
            const orig = res.setHeader.bind(res);
            res.setHeader = (name: string, value: string | number | string[]) => {
              if (String(name).toLowerCase() === "content-type") {
                return orig("Content-Type", "application/wasm");
              }
              return orig(name, value);
            };
          }
          next();
        };
        server.middlewares.stack.unshift({ route: "", handle: wasmMime });
      },
    },
  ].filter(Boolean),
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
}));
