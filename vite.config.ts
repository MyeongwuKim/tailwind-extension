import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],

   // ---------------------------------------------------------------------------
   // [핵심] 프로젝트의 루트를 'src' 디렉토리로 설정합니다.
   // 이렇게 하면 모든 경로 계산이 'src'를 기준으로 이루어져 경로 구조가 단순해지고
   // 빌드 결과물이 manifest.json에서 요구하는 경로와 정확히 일치하게 됩니다.
   // ---------------------------------------------------------------------------
   root: "src",
   publicDir: "../public", // ✅ 루트의 public 폴더 강제로 사용
   build: {
      // 빌드 결과물이 생성될 디렉토리입니다.
      // root가 'src'이므로, '../dist'로 설정하여 프로젝트 최상위 위치에 'dist' 폴더를 생성합니다.
      outDir: "../dist",
      // 빌드 시 outDir을 먼저 비웁니다. (이전 빌드 파일 제거)
      emptyOutDir: true,

      rollupOptions: {
         // 확장 프로그램의 진입점(entry points)을 설정합니다.
         // 경로는 위에서 설정한 'root' 디렉토리('src') 기준입니다.
         input: {
            popup: resolve(__dirname, "src/popup/index.html"),
            options: resolve(__dirname, "src/options/index.html"),
            // manifest.json에 명시된 서비스 워커와 컨텐츠 스크립트입니다.
            // 실제 파일 경로를 정확하게 입력해주세요.
            background: resolve(__dirname, "src/background.js"),
            content: resolve(__dirname, "src/content.js"),
         },

         output: {
            // 출력 파일의 이름을 설정합니다.
            entryFileNames: (chunkInfo) => {
               // background.js, content.js → dist 루트에 고정
               if (chunkInfo.name === "background") return "background.js";
               if (chunkInfo.name === "content") return "content.js";

               // popup.html → dist/popup/index.html
               if (chunkInfo.name === "popupHtml") return "popup/index.html";
               // options.html → dist/options/index.html
               if (chunkInfo.name === "optionsHtml") return "options/index.html";

               // popup.tsx, options.tsx 번들 JS → 각각 폴더 안으로
               if (chunkInfo.name === "popup") return "popup/popup.js";
               if (chunkInfo.name === "options") return "options/options.js";

               return "assets/[name].js";
            },
            // 코드 분할(code splitting)로 생성되는 청크 파일들의 이름입니다.
            chunkFileNames: "assets/[name]-[hash].js",
            // CSS, 이미지 등 기타 에셋 파일들의 이름입니다.
            assetFileNames: "assets/[name]-[hash].[ext]",
         },
      },
   },
});
