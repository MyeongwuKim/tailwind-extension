import fs from "fs";
import resolveConfig from "tailwindcss/resolveConfig";

const tailwindConfig = (await import("../tailwind.config.js")).default;
const full = resolveConfig(tailwindConfig);
const prefix = full.prefix ? full.prefix + "tester-" : ""; // ex: "ex-tw-"

const meta = JSON.parse(fs.readFileSync("./src/tw-meta.full.json", "utf-8")) as { name: string }[];

// meta의 name 앞에 prefix 붙여 실제 클래스 토큰으로 변환
const tokens = meta.map((i) => `${prefix}${i.name}`).join(" ");

// 최소 HTML—여기 안의 class 토큰만 Tailwind가 스캔해서 정확한 유틸 CSS를 생성
const html = `<!doctype html><meta charset="utf-8" />
<div class="${tokens}"></div>
`;

fs.writeFileSync("./src/tw-meta.tokens.html", html, "utf-8");
console.log("✅ Wrote ./src/tw-meta.tokens.html with", meta.length, "classes");
