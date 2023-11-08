import dotenv from "dotenv";
import { resolve } from "path";
import { defineConfig } from "vite";
import inject from '@rollup/plugin-inject'

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  return {
    root: '.',
    plugins: [
      inject({
         htmx: 'htmx.org'
      }),
    ],
    build: {
      cssCodeSplit: false,
      outDir: "./build",
      rollupOptions: {
        context: 'globalThis',
        input: {
          app: './index.html',
        },
        output: {
          // 2️⃣
          entryFileNames: 'assets/js/[name].js',
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
      }
    },
    define: {
      global: "globalThis",
    },
    server: {
      host: "0.0.0.0",
      port: !!process.env.PORT ? process.env.PORT : 3000,
      strictPort: true,
      hmr: {
        clientPort: 443
      },
      changeOrigin: { origin: "naoto-status.glitch.me" },
      proxy: {
        '/api': {
          target: `http://localhost:${ !!process.env.BACKEND_PORT ? process.env.BACKEND_PORT : 40000 }`,
          secure: false,
        },
        '/ws': {
          target: `ws://localhost:${ !!process.env.BACKEND_PORT ? process.env.BACKEND_PORT : 40000 }`,
          secure: false,
          ws: true,
        },
      }
    },
  };
});
