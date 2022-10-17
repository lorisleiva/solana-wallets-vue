import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ["vue"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env": {},
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "solana-wallets-vue",
    },
    rollupOptions: {
      external: ["@solana/wallet-adapter-base", "@vueuse/core"],
      output: {
        exports: "named",
        globals: {
          "@solana/wallet-adapter-base": "SolanaWalletAdapterBase",
          "@vueuse/core": "VueUseCore",
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
