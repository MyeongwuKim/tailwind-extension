import fs from "fs";
import { execSync } from "child_process";

console.log("🚀 [1/2] ex-tw-hover → hover:ex-tw 변환 중...");

const htmlPath = "../src/tw-meta.tokens.html";

if (!fs.existsSync(htmlPath)) {
   console.error("❌ src/tw-meta.tokens.html 파일이 없음!");
   process.exit(1);
}

// ① ex-tw-hover:bg-red-500 → hover:ex-tw-bg-red-500
// ② 혹시 순서가 섞여 있는 경우( ex-tw-bg-red-500 hover:ex-tw-bg-red-500 )도 재정렬
let html = fs.readFileSync(htmlPath, "utf-8");

// 순서 교체
html = html.replace(/\bex-tw-(hover|focus|active|disabled|dark):/g, "$1:ex-tw-");

// 중복 정렬 (hover variant를 앞으로)
html = html.replace(/\b(ex-tw-[^ ]+)\s+(hover:ex-tw-[^ ]+)/g, "$2 $1");

// 덮어쓰기
fs.writeFileSync(htmlPath, html, "utf-8");
console.log("✅ [1/2] variant 순서 수정 완료 → tw-meta.tokens.html 덮어쓰기 완료");

// ② Tailwind 빌드 자동 실행
console.log("⚙️ [2/2] Tailwind CSS 빌드 중...");
try {
   execSync(
      `npx tailwindcss -i ../../src/tw-meta.entry.css -o ../../src/tw-meta.built.css --content ../../src/tw-meta.tokens.html --config ../tailwind.meta.config.js --minify`,
      { stdio: "inherit" }
   );
   console.log("🎉 모든 작업 완료! → src/tw-meta.built.css 생성됨 ✅");
} catch (e) {
   console.error("❌ Tailwind 빌드 실패:", e.message);
   process.exit(1);
}
