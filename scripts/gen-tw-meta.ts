// scripts/gen-tw-meta.ts
import fs from "fs";
import resolveConfig from "tailwindcss/resolveConfig";

// ✅ tailwind.config.js 동적 import
const tailwindConfig = (await import("../tailwind.config.js")).default;
const full = resolveConfig(tailwindConfig);
const theme = full.theme;

// ===============================
// ✅ 색상 유틸리티 (색상값 포함)
// ===============================
const genColorUtilities = (prefix: string) => {
   const res: { name: string; color?: string }[] = [];
   const colors = theme.colors || {};
   for (const [name, val] of Object.entries(colors)) {
      if (typeof val === "string") res.push({ name: `${prefix}-${name}`, color: val });
      else if (typeof val === "object") {
         for (const [shade, hex] of Object.entries(val)) {
            res.push({ name: `${prefix}-${name}-${shade}`, color: hex as string });
         }
      }
   }
   return res;
};

// ===============================
// ✅ 범용 scale 기반 유틸리티
// ===============================
const genScaleUtilities = (prefix: string, obj: Record<string, any> | undefined) => {
   if (!obj) return [];
   return Object.keys(obj).map((k) => ({ name: `${prefix}-${k}` }));
};

// ===============================
// ✅ 개별 유틸리티 그룹
// ===============================
const spacingUtils = Object.keys(theme.spacing || {}).flatMap((k) => [
   { name: `p-${k}` },
   { name: `m-${k}` },
   { name: `px-${k}` },
   { name: `py-${k}` },
   { name: `mx-${k}` },
   { name: `my-${k}` },
]);

const roundedUtils = genScaleUtilities("rounded", theme.borderRadius);
const shadowUtils = genScaleUtilities("shadow", theme.boxShadow);
const widthUtils = genScaleUtilities("w", theme.width);
const heightUtils = genScaleUtilities("h", theme.height);
const fontSizeUtils = genScaleUtilities("text", theme.fontSize);
const borderColorUtils = genColorUtilities("border");

// ✅ 레이아웃 관련
const layoutUtils = [
   "flex",
   "inline-flex",
   "grid",
   "block",
   "inline-block",
   "hidden",
   "absolute",
   "relative",
   "fixed",
   "sticky",
   "justify-center",
   "justify-between",
   "items-center",
   "items-start",
   "items-end",
   "gap-1",
   "gap-2",
   "gap-4",
   "overflow-hidden",
   "overflow-auto",
].map((n) => ({ name: n }));

// ===============================
// ✅ 전체 조합 (variants ❌ 제외)
// ===============================
const allUtilities = [
   ...genColorUtilities("bg"),
   ...genColorUtilities("text"),
   ...borderColorUtils,
   ...spacingUtils,
   ...roundedUtils,
   ...shadowUtils,
   ...widthUtils,
   ...heightUtils,
   ...fontSizeUtils,
   ...layoutUtils,
];

// ✅ 중복 제거
const unique = new Map<string, { name: string; color?: string }>();
for (const u of allUtilities) {
   if (!unique.has(u.name)) unique.set(u.name, u);
}

const result = Array.from(unique.values());

// ✅ 저장
fs.writeFileSync("./src/tw-meta.json", JSON.stringify(result, null, 2), "utf-8");
console.log(`✅ Generated ${result.length} Tailwind utilities (no variants).`);
