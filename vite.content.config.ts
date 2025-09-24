// vite.content.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
   plugins: [react()],
   define: {
      "process.env": {},
      "process.env.NODE_ENV": JSON.stringify("production"),
   },
   build: {
      outDir: "dist",
      emptyOutDir: false, // ✅ 다른 결과물 유지
      lib: {
         entry: resolve(__dirname, "src/content/index.tsx"),
         formats: ["iife"],
         name: "ContentScript",
         fileName: () => "content.js",
      },
      rollupOptions: {
         output: {
            manualChunks: undefined,
            assetFileNames: (assetInfo) => {
               if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                  return "content.css"; // ✅ Tailwind CSS를 content.css로 출력
               }
               return "assets/[name]-[hash][extname]";
            },
         },
      },
   },
});
