import fs from "fs";
import resolveConfig from "tailwindcss/resolveConfig";

const tailwindConfig = (await import("../tailwind.config.js")).default;
const resolved = resolveConfig(tailwindConfig); // ✅ 이름 변경
const theme = resolved.theme;

const VARIANTS = ["hover", "focus", "active", "disabled", "dark"];

/* ========== 색상 계열 ========== */
const genColorUtilities = (prefix: string) => {
   const res: { name: string; color?: string }[] = [];
   const colors = theme.colors || {};
   for (const [name, val] of Object.entries(colors)) {
      if (typeof val === "string") {
         res.push({ name: `${prefix}-${name}`, color: val });
      } else if (typeof val === "object") {
         for (const [shade, hex] of Object.entries(val)) {
            if (shade !== "DEFAULT" && shade !== "inherit" && shade !== "none")
               res.push({ name: `${prefix}-${name}-${shade}`, color: hex as string });
         }
      }
   }
   return res;
};

function withVariants(baseClasses: { name: string }[]) {
   const res: { name: string }[] = [];
   for (const { name } of baseClasses) {
      res.push({ name }); // 기본
      for (const variant of VARIANTS) res.push({ name: `${variant}:${name}` });
   }
   return res;
}

/* ========== scale 기반 속성 ========== */
const genScaleUtilities = (prefix: string, obj: Record<string, any> | undefined) =>
   obj
      ? Object.keys(obj)
           .filter((k) => k !== "DEFAULT" && k !== "none" && k !== "inherit" && k !== "current")
           .map((k) => ({ name: `${prefix}-${k}` }))
      : [];

/* ========== Transition 관련 ========== */
const genTransitionUtils = (theme: any) => {
   const res: { name: string }[] = [];
   const transitionProps = [
      "transition",
      "transition-none",
      "transition-all",
      "transition-colors",
      "transition-opacity",
      "transition-shadow",
      "transition-transform",
   ];
   res.push(...transitionProps.map((n) => ({ name: n })));

   const durations = Object.keys(theme.transitionDuration || {}).filter((d) => d !== "DEFAULT");
   durations.forEach((d) => res.push({ name: `duration-${d}` }));

   const delays = Object.keys(theme.transitionDelay || {}).filter((d) => d !== "DEFAULT");
   delays.forEach((d) => res.push({ name: `delay-${d}` }));

   const easings = Object.keys(theme.transitionTimingFunction || {}).filter((e) => e !== "DEFAULT");
   easings.forEach((e) => res.push({ name: `ease-${e}` }));

   return res;
};

/* ========== Border / Ring width ========== */
const genBorderRingUtilities = (theme: any) => {
   const res: { name: string }[] = [];

   Object.keys(theme.borderWidth || {})
      .filter((w) => w !== "DEFAULT")
      .forEach((w) => res.push({ name: `border-${w}` }));

   Object.keys(theme.ringWidth || {})
      .filter((w) => w !== "DEFAULT")
      .forEach((w) => res.push({ name: `ring-${w}` }));

   Object.keys(theme.ringOffsetWidth || {})
      .filter((w) => w !== "DEFAULT")
      .forEach((w) => res.push({ name: `ring-offset-${w}` }));

   return res;
};

/* ========== 피드백 유틸리티 ========== */
const feedback = [
   { name: "opacity-50" },
   { name: "opacity-75" },
   { name: "scale-95" },
   { name: "scale-100" },
   { name: "scale-105" },
   { name: "cursor-pointer" },
   { name: "cursor-not-allowed" },
   { name: "pointer-events-none" },
   { name: "pointer-events-auto" },
];

/* ========== 전체 조합 ========== */
const base = [
   ...genColorUtilities("bg"),
   ...genColorUtilities("text"),
   ...genColorUtilities("border"),
   ...genColorUtilities("ring"),
   ...genScaleUtilities("shadow", theme.boxShadow),
   ...genScaleUtilities("rounded", theme.borderRadius),
   ...genTransitionUtils(theme),
   ...genBorderRingUtilities(theme),
   ...feedback,
];

const uniqueBase = Array.from(new Map(base.map((i) => [i.name, i])).values());
const withVar = withVariants(uniqueBase);

const uniqueFull = Array.from(new Map(withVar.map((i) => [i.name, i])).values());

fs.writeFileSync("./src/tw-meta.clean.json", JSON.stringify(uniqueBase, null, 2), "utf-8");
fs.writeFileSync("./src/tw-meta.full.json", JSON.stringify(uniqueFull, null, 2), "utf-8");

console.log(
   `✅ Generated clean(${uniqueBase.length}) & full(${uniqueFull.length}) Tailwind utilities.`
);
