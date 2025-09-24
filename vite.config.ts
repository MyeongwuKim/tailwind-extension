import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ command }) => {
   return {
      plugins: [react()],
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

               // content는 따로 lib 모드에서 처리
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

      // ⚡ content 전용 빌드
      define: {
         "process.env.NODE_ENV": JSON.stringify(command === "build" ? "production" : "development"),
      },

      // content 전용 설정
      // 👉 별도 명령어로 실행: vite build --config vite.config.ts --ssr false
      optimizeDeps: {
         exclude: ["src/content/index.tsx"],
      },
   };
});

// content 전용 설정
export const contentConfig = defineConfig({
   plugins: [react()],
   build: {
      outDir: "dist",
      emptyOutDir: false, // ✅ 다른 결과물 지우지 않음
      lib: {
         entry: resolve(__dirname, "src/content/index.tsx"),
         formats: ["iife"], // ✅ 즉시 실행 번들
         name: "ContentScript",
         fileName: () => "content.js", // ✅ 최종 content.js
      },
      rollupOptions: {
         output: {
            manualChunks: undefined, // ✅ 청크 분리 방지
         },
      },
   },
});
