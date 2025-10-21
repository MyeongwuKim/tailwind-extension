import fs from "fs";
import { execSync } from "child_process";
import path from "path";

console.log("🚀 [1/2] ex-tw-tester-hover → hover:ex-tw-tester 변환 중...");

// ✅ 항상 루트 기준으로 경로 고정
const rootDir = process.cwd();
const htmlPath = path.resolve(rootDir, "src/tw-meta.tokens.html");
const entryPath = path.resolve(rootDir, "src/tw-meta.entry.css");
const outputPath = path.resolve(rootDir, "src/tw-meta.built.css");
const configPath = path.resolve(rootDir, "scripts/tailwind.meta.config.js");

// ✅ 파일 존재 확인
if (!fs.existsSync(htmlPath)) {
   console.error(`❌ ${htmlPath} 파일이 없음!`);
   process.exit(1);
}

// ✅ HTML 읽기 및 변환
let html = fs.readFileSync(htmlPath, "utf-8");

// ① ex-tw-hover:bg-red-500 → hover:ex-tw-bg-red-500
html = html.replace(/\bex-tw-tester-(hover|focus|active|disabled|dark):/g, "$1:ex-tw-tester-");

// ② 순서 뒤섞인 경우 정렬 (hover variant를 앞으로)
html = html.replace(/\b(ex-tw-tester-[^ ]+)\s+(hover:ex-tw-tester-[^ ]+)/g, "$2 $1");

// ✅ 결과 저장
fs.writeFileSync(htmlPath, html, "utf-8");
console.log("✅ [1/2] variant 순서 수정 완료 → tw-meta.tokens.html 덮어쓰기 완료");

// ✅ Tailwind 빌드 실행
console.log("⚙️ [2/2] Tailwind CSS 빌드 중...");

try {
   // npx 명령어에 절대경로를 안전하게 삽입
   const cmd = [
      "npx tailwindcss",
      `-i "${entryPath}"`,
      `-o "${outputPath}"`,
      `--content "${htmlPath}"`,
      `--config "${configPath}"`,
      "--minify",
   ].join(" ");

   execSync(cmd, { stdio: "inherit" });

   console.log("🎉 모든 작업 완료! → src/tw-meta.built.css 생성됨 ✅");
} catch (e) {
   console.error("❌ Tailwind 빌드 실패:", e.message);
   process.exit(1);
}
