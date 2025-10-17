import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

export default defineConfig(({ command }) => {
   return {
      plugins: [
         react(),
         {
            name: "copy-tw-meta-css",
            closeBundle() {
               const src = "./src/tw-meta.built.css";
               const dest = "./dist/assets/tw-meta.built.css";
               const destDir = "./dist/assets";

               try {
                  if (!fs.existsSync(src)) {
                     console.warn(`⚠️ ${src} not found, skipping copy`);
                     return;
                  }
                  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                  fs.copyFileSync(src, dest);
                  console.log(`✅ Copied ${src} → ${dest}`);
               } catch (err) {
                  console.error("❌ Failed to copy tw-meta.built.css:", err);
               }
            },
         },
      ],

      root: "src",
      publicDir: "../public",
      build: {
         outDir: "../dist",
         emptyOutDir: true,
         rollupOptions: {
            input: {
               popup: resolve(__dirname, "src/popup/index.html"),
               options: resolve(__dirname, "src/options/index.html"),
               background: resolve(__dirname, "src/background.ts"),
            },
            output: {
               entryFileNames: (chunkInfo) => {
                  if (chunkInfo.name === "background") return "background.js";
                  if (chunkInfo.name === "popup") return "popup/popup.js";
                  if (chunkInfo.name === "options") return "options/options.js";
                  return "assets/[name]-[hash].js";
               },
               chunkFileNames: "assets/[name]-[hash].js",
               assetFileNames: "assets/[name]-[hash][extname]",
            },
         },
      },

      define: {
         "process.env.NODE_ENV": JSON.stringify(command === "build" ? "production" : "development"),
      },

      optimizeDeps: {
         exclude: ["src/content/index.tsx"],
      },
   };
});

// ⚡ content 전용 빌드 설정
export const contentConfig = defineConfig({
   plugins: [react()],
   build: {
      outDir: "dist",
      emptyOutDir: false,
      lib: {
         entry: resolve(__dirname, "src/content/index.tsx"),
         formats: ["iife"],
         name: "ContentScript",
         fileName: () => "content.js",
      },
      rollupOptions: {
         output: {
            manualChunks: undefined,
         },
      },
   },
});
