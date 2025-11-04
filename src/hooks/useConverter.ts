import fullConfig from "../full-config.json";

/* ========== Helpers ========== */
function remToPx(rem: string) {
   return `${parseFloat(rem) * 16}px`;
}
function normalize(val: string) {
   if (val.endsWith("rem")) return remToPx(val);
   return val;
}
function closest(px: number, map: Record<string, string>) {
   let bestKey: string | null = null;
   let bestDiff = Infinity;
   for (const [val, key] of Object.entries(map)) {
      const num = parseFloat(val);
      const diff = Math.abs(px - num);
      if (diff < bestDiff) {
         bestDiff = diff;
         bestKey = key;
      }
   }
   return bestKey;
}
function isZero(val: string) {
   return val === "0" || val === "0px" || val === "0rem";
}

function normalizeColor(val: string) {
   const v = val.trim();

   // ✅ CSS4 함수형 색상 (oklab, oklch, color, rgb, hsl 등)
   if (/^(rgb|rgba|hsl|hsla|oklab|oklch|color)\(/i.test(v) || /^#/.test(v)) {
      // 괄호 안의 공백, 쉼표, 슬래시를 언더스코어로 변환
      return v
         .replace(/[,\s/]+/g, "_") // 예: oklab(0.7 -0.1 -0.08 / 0.5) → oklab(0.7_-0.1_-0.08_/_0.5)
         .replace(/\)+_/g, ")_") // ) 뒤 중복 _ 정리
         .replace(/_+$/g, ""); // 끝의 _ 제거
   }

   // ✅ 일반적인 키워드 색상 (red, transparent, currentcolor 등)
   return v;
}

/* ========== Build Maps from Tailwind config ========== */
function buildSpacingMap() {
   const spacing = fullConfig.theme.spacing;
   const map: Record<string, string> = {};
   for (const [key, val] of Object.entries(spacing)) {
      map[normalize(val as string)] = key;
   }
   return map;
}
function buildFontSizeMap() {
   const fontSize = fullConfig.theme.fontSize;
   const map: Record<string, string> = {};
   for (const [key, val] of Object.entries(fontSize)) {
      const arr = val as any[];
      map[normalize(arr[0])] = key; // ex: "16px" → "base"
   }
   return map;
}
function buildRadiusMap() {
   const radius = fullConfig.theme.borderRadius;
   const map: Record<string, string> = {};
   for (const [key, val] of Object.entries(radius)) {
      map[normalize(val as string)] = key;
   }
   return map;
}

function normalizeShadow(value: string): string {
   return value.trim().replace(/\s+/g, " ").replace(/, /g, ",");
}

function buildShadowMap() {
   const shadows = fullConfig.theme.boxShadow;
   const map: Record<string, string> = {};

   for (const [key, val] of Object.entries(shadows)) {
      const clean = normalizeShadow(val as string);
      map[clean] = key === "DEFAULT" ? "shadow" : `shadow-${key}`;
   }
   return map;
}

const shadowMap = buildShadowMap();

function convertBoxShadow(value: string): string {
   if (!value) return "";

   // ✅ 여러 쉐도우 중 첫 번째만 사용
   const parts = value.split(/,(?![^(]*\))/g).map((v) => v.trim());
   const first = parts.find((v) => !/rgba?\(0,\s*0,\s*0,\s*0\)/.test(v)) || parts[0];

   // ✅ 색상 추출 (모든 CSS4 함수 포함)
   const colorMatch = first.match(
      /(rgba?\([^)]+\)|hsla?\([^)]+\)|oklab\([^)]+\)|oklch\([^)]+\)|color\([^)]+\)|#[0-9a-f]{3,8})/i
   );
   const color = colorMatch ? colorMatch[1] : null;

   // ✅ 색상 제거 후 offset 부분만 정리
   const offsetPart = color ? first.replace(color, "").trim() : first.trim();

   // ✅ Tailwind 매핑
   const clean = normalizeShadow(first);
   const matchKey = shadowMap[clean]; // 완전 일치 확인

   let shadowSize = "";
   if (matchKey) {
      shadowSize = matchKey; // Tailwind 기본값 매칭 성공
   } else {
      // offset 값만 브라켓으로 감싸기
      const offsetClass = offsetPart
         .replace(/[,\s]+/g, "_")
         .replace(/\)+_/g, ")_")
         .replace(/_+$/g, "");
      shadowSize = `shadow-[${offsetClass}]`;
   }

   // ✅ 색상은 항상 별도 브라켓으로
   const colorClass = color ? `shadow-[${color.replace(/[,\s]+/g, "_")}]` : "";

   return [shadowSize, colorClass].filter(Boolean).join(" ");
}

const spacingMap = buildSpacingMap();
const fontSizeMap = buildFontSizeMap();
const radiusMap = buildRadiusMap();

function convertSingleProp(prop: string, value: string): string | null {
   // ----- shadow -----
   if (prop === "box-shadow") {
      const clean = normalizeShadow(value);
      if (shadowMap[clean]) return shadowMap[clean]; // Tailwind config 매칭
      return convertBoxShadow(value); // 근사치 변환 + 색상 처리
   }
   // ----- Spacing -----
   if (prop.startsWith("margin")) {
      if (isZero(value)) return null;
      const key = closest(parseFloat(value), spacingMap);
      if (!key) return `m-[${value}]`;
      if (prop === "margin") return `m-${key}`;
      if (prop === "margin-top") return `mt-${key}`;
      if (prop === "margin-bottom") return `mb-${key}`;
      if (prop === "margin-left") return `ml-${key}`;
      if (prop === "margin-right") return `mr-${key}`;
   }

   if (prop.startsWith("padding")) {
      if (isZero(value)) return null;
      const key = closest(parseFloat(value), spacingMap);
      if (!key) return `p-[${value}]`;
      if (prop === "padding") return `p-${key}`;
      if (prop === "padding-top") return `pt-${key}`;
      if (prop === "padding-bottom") return `pb-${key}`;
      if (prop === "padding-left") return `pl-${key}`;
      if (prop === "padding-right") return `pr-${key}`;
   }

   // ----- Typography -----
   if (prop === "text-decoration") {
      switch (value) {
         case "underline":
            return "underline";
         case "line-through":
            return "line-through";
         case "none":
            return "no-underline";
      }
   }
   if (prop === "font-size") {
      const key = closest(parseFloat(value), fontSizeMap);
      return key ? `text-${key}` : `text-[${value}]`;
   }
   if (prop === "font-weight") {
      const map: Record<string, string> = {
         "400": "font-normal",
         "500": "font-medium",
         "600": "font-semibold",
         "700": "font-bold",
      };
      return map[value] || `font-[${value}]`;
   }
   if (prop === "text-align") {
      if (value === "center") return "text-center";
      if (value === "left") return "text-left";
      if (value === "right") return "text-right";
   }
   if (prop === "text-overflow" && value === "ellipsis") return "truncate";
   if (prop === "color") return `text-[${normalizeColor(value)}]`;

   // ----- Background -----
   if (prop === "background-color") return `bg-[${normalizeColor(value)}]`;

   // ----- Borders -----
   // ----- Borders -----
   if (prop === "border-width") {
      if (isZero(value)) return "border-0";
      if (value === "1px") return "border";
      if (value === "2px") return "border-2";
      return `border-[${value}]`;
   }

   if (prop === "border-color") {
      return `border-[${normalizeColor(value)}]`;
   }

   if (prop === "border-style") {
      switch (value) {
         case "solid":
            return "border-solid";
         case "dashed":
            return "border-dashed";
         case "dotted":
            return "border-dotted";
         case "none":
            return "border-none";
         default:
            return `border-[${value}]`;
      }
   }

   // ----- Border Sides (width) -----
   if (prop === "border-top-width") {
      if (isZero(value)) return null;
      if (value === "1px") return "border-t";
      if (value === "2px") return "border-t-2";
      return `border-t-[${value}]`;
   }
   if (prop === "border-right-width") {
      if (isZero(value)) return null;
      if (value === "1px") return "border-r";
      if (value === "2px") return "border-r-2";
      return `border-r-[${value}]`;
   }
   if (prop === "border-bottom-width") {
      if (isZero(value)) return null;
      if (value === "1px") return "border-b";
      if (value === "2px") return "border-b-2";
      return `border-b-[${value}]`;
   }
   if (prop === "border-left-width") {
      if (isZero(value)) return null;
      if (value === "1px") return "border-l";
      if (value === "2px") return "border-l-2";
      return `border-l-[${value}]`;
   }

   // ----- Border Sides (color) -----
   if (prop === "border-top-color") return `border-t-[${normalizeColor(value)}]`;
   if (prop === "border-right-color") return `border-r-[${normalizeColor(value)}]`;
   if (prop === "border-bottom-color") return `border-b-[${normalizeColor(value)}]`;
   if (prop === "border-left-color") return `border-l-[${normalizeColor(value)}]`;

   // ----- Border Sides (style) -----
   if (prop === "border-top-style") return `border-t-${value}`;
   if (prop === "border-right-style") return `border-r-${value}`;
   if (prop === "border-bottom-style") return `border-b-${value}`;
   if (prop === "border-left-style") return `border-l-${value}`;

   if (prop.includes("radius")) {
      const key = closest(parseFloat(value), radiusMap);

      if (key === "DEFAULT") {
         return "rounded"; // ✅ 기본값은 그냥 rounded
      } else if (key == "none") {
         //rounded-none 제거
         return null;
      }
      return key ? `rounded-${key}` : `rounded-[${value}]`;
   }

   // ----- Layout -----
   if (prop === "display") {
      if (value === "flex") return "flex";
      if (value === "block") return "block";
      if (value === "inline-flex") return "inline-flex";
      if (value === "grid") return "grid";
   }
   if (prop === "position") {
      if (value === "static") return null; // ✅ static 제거
      return value;
   }

   // ----- Flex/Grid helpers -----
   if (prop === "justify-content") {
      if (value === "center") return "justify-center";
   }
   if (prop === "align-items") {
      if (value === "center") return "items-center";
   }

   if (prop === "flex-direction") {
      switch (value) {
         case "row":
            return "flex-row";
         case "row-reverse":
            return "flex-row-reverse";
         case "column":
            return "flex-col";
         case "column-reverse":
            return "flex-col-reverse";
         default:
            return `flex-[${value}]`;
      }
   }

   // ----- Sizing -----
   if (prop === "width") {
      if (isZero(value)) return "w-0";
      if (value === "100%") return "w-full";
      const key = closest(parseFloat(value), spacingMap);
      return key ? `w-${key}` : `w-[${value}]`;
   }

   if (prop === "min-width") {
      const key = closest(parseFloat(value), spacingMap);
      return key ? `min-w-${key}` : `min-w-[${value}]`;
   }

   if (prop === "max-width") {
      const key = closest(parseFloat(value), spacingMap);
      return key ? `max-w-${key}` : `max-w-[${value}]`;
   }

   if (prop === "height") {
      if (isZero(value)) return "h-0";
      if (value === "100%") return "h-full";
      const key = closest(parseFloat(value), spacingMap);
      return key ? `h-${key}` : `h-[${value}]`;
   }

   if (prop === "min-height") {
      const key = closest(parseFloat(value), spacingMap);
      return key ? `min-h-${key}` : `min-h-[${value}]`;
   }

   if (prop === "max-height") {
      const key = closest(parseFloat(value), spacingMap);
      return key ? `max-h-${key}` : `max-h-[${value}]`;
   }

   return `${prop}-[${value}]`;
}

/* ========== px, py, mx, my 축약 최적화 ========== */
function optimizeSpacing(classes: string[]): string[] {
   const set = new Set(classes);

   // px (pl + pr)
   for (const cls of [...set]) {
      const match = cls.match(/^pl-(.+)$/);
      if (match) {
         const val = match[1];
         if (set.has(`pr-${val}`)) {
            set.delete(cls);
            set.delete(`pr-${val}`);
            set.add(`px-${val}`);
         }
      }
   }

   // py (pt + pb)
   for (const cls of [...set]) {
      const match = cls.match(/^pt-(.+)$/);
      if (match) {
         const val = match[1];
         if (set.has(`pb-${val}`)) {
            set.delete(cls);
            set.delete(`pb-${val}`);
            set.add(`py-${val}`);
         }
      }
   }

   // mx (ml + mr)
   for (const cls of [...set]) {
      const match = cls.match(/^ml-(.+)$/);
      if (match) {
         const val = match[1];
         if (set.has(`mr-${val}`)) {
            set.delete(cls);
            set.delete(`mr-${val}`);
            set.add(`mx-${val}`);
         }
      }
   }

   // my (mt + mb)
   for (const cls of [...set]) {
      const match = cls.match(/^mt-(.+)$/);
      if (match) {
         const val = match[1];
         if (set.has(`mb-${val}`)) {
            set.delete(cls);
            set.delete(`mb-${val}`);
            set.add(`my-${val}`);
         }
      }
   }

   return [...set];
}

/* ========== CSS 전체 → Tailwind 변환 ========== */
export function cssToTailwind(styles: Record<string, string>): string {
   const rawClasses: string[] = [];

   for (const [prop, value] of Object.entries(styles)) {
      const cls = convertSingleProp(prop, value);
      if (cls) rawClasses.push(cls);
   }

   return optimizeSpacing(rawClasses).join(" ");
}

export function getClassAppliedStyles(el: HTMLElement) {
   const computed = getComputedStyle(el);
   const defaults = getComputedStyle(document.createElement(el.tagName));

   const result: Record<string, string | string[]> = {};
   const allowedProps = [
      "display",
      "color",
      "background-color",
      "width",
      "height",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "font-size",
      "font-weight",
      "flex-direction",
      "justify-content",
      "align-items",
      "gap",
      "text-align",
      "line-height",
      "letter-spacing",
      "box-shadow",
      "text-overflow",
      "text-decoration",
      "border-radius",
   ];

   const isZero = (v: string) => !v || v === "0" || v === "0px" || v === "0rem";

   // ✅ 기본 allowedProps 추출
   for (const prop of allowedProps) {
      const value = computed.getPropertyValue(prop);
      const defaultVal = defaults.getPropertyValue(prop);
      if (
         value &&
         value.trim() !== "" &&
         value !== "normal" &&
         value !== "auto" &&
         value !== "none" &&
         value !== defaultVal
      ) {
         result[prop] = value.trim();
      }
   }

   // ✅ border-radius (네 모서리 같으면 하나로 축약)
   const tl = computed.getPropertyValue("border-top-left-radius");
   const tr = computed.getPropertyValue("border-top-right-radius");
   const br = computed.getPropertyValue("border-bottom-right-radius");
   const bl = computed.getPropertyValue("border-bottom-left-radius");

   if (tl && tl === tr && tr === br && br === bl) {
      result["border-radius"] = tl;
   }

   // ============================
   // ✅ Border 처리
   // ============================

   const bwTop = computed.getPropertyValue("border-top-width");
   const bwRight = computed.getPropertyValue("border-right-width");
   const bwBottom = computed.getPropertyValue("border-bottom-width");
   const bwLeft = computed.getPropertyValue("border-left-width");

   const bsTop = computed.getPropertyValue("border-top-style");
   const bsRight = computed.getPropertyValue("border-right-style");
   const bsBottom = computed.getPropertyValue("border-bottom-style");
   const bsLeft = computed.getPropertyValue("border-left-style");

   const bcTop = computed.getPropertyValue("border-top-color");
   const bcRight = computed.getPropertyValue("border-right-color");
   const bcBottom = computed.getPropertyValue("border-bottom-color");
   const bcLeft = computed.getPropertyValue("border-left-color");

   const hasBorder =
      ![bwTop, bwRight, bwBottom, bwLeft].every(isZero) &&
      ![bsTop, bsRight, bsBottom, bsLeft].every((s) => s === "none");

   if (hasBorder) {
      // width
      if (bwTop === bwRight && bwRight === bwBottom && bwBottom === bwLeft) {
         result["border-width"] = bwTop;
      } else {
         if (!isZero(bwTop)) result["border-top-width"] = bwTop;
         if (!isZero(bwRight)) result["border-right-width"] = bwRight;
         if (!isZero(bwBottom)) result["border-bottom-width"] = bwBottom;
         if (!isZero(bwLeft)) result["border-left-width"] = bwLeft;
      }

      // color
      if (bcTop === bcRight && bcRight === bcBottom && bcBottom === bcLeft) {
         result["border-color"] = bcTop;
      } else {
         result["border-top-color"] = bcTop;
         result["border-right-color"] = bcRight;
         result["border-bottom-color"] = bcBottom;
         result["border-left-color"] = bcLeft;
      }

      // style
      if (bsTop === bsRight && bsRight === bsBottom && bsBottom === bsLeft) {
         result["border-style"] = bsTop;
      } else {
         result["border-top-style"] = bsTop;
         result["border-right-style"] = bsRight;
         result["border-bottom-style"] = bsBottom;
         result["border-left-style"] = bsLeft;
      }
   }

   return result;
}

const CATEGORY_RULES: Record<Category, RegExp[]> = {
   Typography: [
      /^text-(xs|sm|base|lg|xl|\d+)$/, // 글자 크기
      /^leading-/, // line-height
      /^truncate$/,
      /^whitespace-/,
      /^list-/,
      /^text-(left|center|right|justify|start|end)$/, // 정렬
      /^font-/,
      /^tracking-/, // 폰트/자간
      /^underline$/,
      /^line-through$/,
      /^no-underline$/,
      /^overline$/, // 데코
      /^italic$/,
      /^not-italic$/, // 이탤릭
      /^text-align-\[/,
      /^line-height-\[/,
      /^text-overflow-\[/,
   ],
   Color: [
      /^text-\[/,
      /^text-(red|blue|green|gray|yellow|purple|pink|indigo|emerald|teal|orange|stone|neutral|zinc|slate|lime|amber|cyan|fuchsia|rose)-/,
      /^bg-/,
      /^border-\[/, // ✅ border-[rgb(...)]
      /^border-(red|blue|green|gray|yellow|purple|pink|indigo|emerald|teal|orange|stone|neutral|zinc|slate|lime|amber|cyan|fuchsia|rose)-/, // ✅ border-color
      /^divide-/,
      /^from-/,
      /^to-/,
      /^via-/,
      /^accent-/,
      /^caret-/,
      /^decoration-/,
      /^outline-/,
   ],
   "Box Model": [
      /^m[trblxy]?/,
      /^p[trblxy]?/,
      /^w-/,
      /^h-/,
      /^max-/,
      /^min-/,
      /^inset-/,
      /^top-/,
      /^right-/,
      /^bottom-/,
      /^left-/,
      /^aspect-/,
      /^border$/,
      /^border[trblxy]?-/,
      /^rounded/,
      /^border-solid$/,
      /^border-dashed$/,
      /^border-dotted$/,
      /^border-double$/,
      /^border-none$/,
      /^border-\d+$/, // 두께
   ],

   Layout: [
      /^flex$/,
      /^flex-/,
      /^grid$/,
      /^inline/,
      /^block$/,
      /^hidden$/,
      /^absolute$/,
      /^relative$/,
      /^fixed$/,
      /^sticky$/,
      /^justify-/,
      /^items-/,
      /^content-/,
      /^place-/,
      /^gap-/,
      /^col-/,
      /^row-/,
      /^order-/,
      /^z-/,
      /^overflow-/,
      /^overscroll-/,
      /^isolate$/,
      /^isolation-/,
   ],
   Effects: [
      /^shadow(-|\[|$)/,
      /^drop-shadow/,
      /^ring-/,
      /^ring-offset-/,
      /^opacity-/,
      /^blur-/,
      /^brightness-/,
      /^contrast-/,
      /^grayscale-/,
      /^hue-rotate-/,
      /^invert-/,
      /^saturate-/,
      /^sepia-/,
      /^backdrop-/,
      /^filter$/,
      /^backdrop-filter$/,
      /^transition/,
      /^duration-/,
      /^ease-/,
      /^transform$/,
      /^scale-/,
      /^rotate-/,
      /^translate-/,
      /^skew-/,
   ],

   Other: [
      /^cursor-/,
      /^select-/,
      /^pointer-events-/, // 인터랙션
      /^sr-only$/,
      /^not-sr-only$/, // 접근성
   ],
};

export function categorizeClasses(className: string): ClassCategoryMap {
   const result: ClassCategoryMap = {
      Typography: [],
      Color: [],
      "Box Model": [],
      Layout: [],
      Effects: [],
      Other: [],
   };

   // 이중 브라켓 정리
   function cleanDoubleBrackets(input: string) {
      return input.replace(/\[\[+/g, "[").replace(/\]\]+/g, "]");
   }

   // rgb/hsl → Tailwind 규칙에 맞춰 공백/쉼표를 언더스코어로 치환
   function normalizeRgbHsl(input: string) {
      return input.replace(
         /\[(rgb|hsl)\(([^)]+)\)\]/g,
         (_, fn, inner) => `[${fn}(${inner.replace(/[\s,]+/g, "_")})]`
      );
   }

   // [ ... ] 안은 그대로 두고 split
   function safeSplit(input: string): string[] {
      const regex = /\[[^\]]*\]|\S+/g;
      return input.match(regex) || [];
   }

   // spacing 최적화 (px, py, mx, my)
   function optimizeSpacing(list: string[]): string[] {
      const set = new Set(list);

      // ✅ px (pl + pr)
      for (const cls of [...set]) {
         const match = cls.match(/^pl-(\d+|\[.+\])$/);
         if (match) {
            const val = match[1];
            if (set.has(`pr-${val}`)) {
               set.delete(cls);
               set.delete(`pr-${val}`);
               set.add(`px-${val}`);
            }
         }
      }

      // ✅ py (pt + pb)
      for (const cls of [...set]) {
         const match = cls.match(/^pt-(\d+|\[.+\])$/);
         if (match) {
            const val = match[1];
            if (set.has(`pb-${val}`)) {
               set.delete(cls);
               set.delete(`pb-${val}`);
               set.add(`py-${val}`);
            }
         }
      }

      // ✅ mx (ml + mr)
      for (const cls of [...set]) {
         const match = cls.match(/^ml-(\d+|\[.+\])$/);
         if (match) {
            const val = match[1];
            if (set.has(`mr-${val}`)) {
               set.delete(cls);
               set.delete(`mr-${val}`);
               set.add(`mx-${val}`);
            }
         }
      }

      // ✅ my (mt + mb)
      for (const cls of [...set]) {
         const match = cls.match(/^mt-(\d+|\[.+\])$/);
         if (match) {
            const val = match[1];
            if (set.has(`mb-${val}`)) {
               set.delete(cls);
               set.delete(`mb-${val}`);
               set.add(`my-${val}`);
            }
         }
      }

      return [...set];
   }

   // 1차 정리
   let cleaned = cleanDoubleBrackets(className);
   cleaned = normalizeRgbHsl(cleaned); // ✅ 여기서 underscore 변환 유지
   const classes = safeSplit(cleaned);

   // ✅ 0 관련 클래스 제거
   const filtered = classes.filter((cls) => {
      return !/^m[trblxy]?-0$/.test(cls) && !/^p[trblxy]?-0$/.test(cls);
   });

   // spacing 축약
   const optimized = optimizeSpacing(filtered);

   // ✅ 카테고리 분류
   for (const cls of optimized) {
      let matched = false;
      for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
         if (rules.some((regex) => regex.test(cls))) {
            result[category as Category].push(cls);
            matched = true;
            break;
         }
      }
      if (!matched) result.Other.push(cls);
   }
   console.log(result);
   return result;
}
