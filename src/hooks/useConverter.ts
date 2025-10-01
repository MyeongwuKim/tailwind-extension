import fullConfig from "../../full-config.json";

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
   if (/^(rgb|hsl)/.test(val) || /^#/.test(val)) {
      return val.trim().replace(/[,\s]+/g, "_"); // ✅ ,와 공백 → _
   }
   return val.trim();
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
const spacingMap = buildSpacingMap();
const fontSizeMap = buildFontSizeMap();
const radiusMap = buildRadiusMap();

function convertSingleProp(prop: string, value: string): string | null {
   // ----- shadow -----
   if (prop === "box-shadow") {
      const clean = normalizeColor(value);
      return `shadow-[${clean}]`;
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
   if (prop === "border-width") {
      if (isZero(value)) return "border-0";
      if (value === "1px") return "border";
      if (value === "2px") return "border-2";
      return `border-[${value}]`;
   }
   if (prop === "border-color") return `border-[${normalizeColor(value)}]`;
   if (prop === "border-style") {
      switch (value) {
         case "solid":
            return "border-solid";
         case "none":
            return "border-none";
         default:
            return `border-[${value}]`;
      }
   }
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
      "display",
      "flex-direction",
      "justify-content",
      "align-items",
      "gap",
      "text-align",
      "line-height",
      "letter-spacing",
      "box-shadow",
      "text-overflow",
   ];

   // ✅ allowedProps만 추출
   for (const prop of allowedProps) {
      const value = computed.getPropertyValue(prop);
      if (
         value &&
         value.trim() !== "" &&
         value !== "normal" &&
         value !== "auto" &&
         value !== "none"
      ) {
         result[prop] = value.trim();
      }
   }

   // ✅ border-radius (개별 값이 전부 같은지 확인 후 하나로 축약)
   const tl = computed.getPropertyValue("border-top-left-radius");
   const tr = computed.getPropertyValue("border-top-right-radius");
   const br = computed.getPropertyValue("border-bottom-right-radius");
   const bl = computed.getPropertyValue("border-bottom-left-radius");

   if (tl && tl === tr && tr === br && br === bl) {
      result["border-radius"] = tl;
   }

   // ✅ border-width
   const bwTop = computed.getPropertyValue("border-top-width");
   const bwRight = computed.getPropertyValue("border-right-width");
   const bwBottom = computed.getPropertyValue("border-bottom-width");
   const bwLeft = computed.getPropertyValue("border-left-width");

   if (bwTop === bwRight && bwRight === bwBottom && bwBottom === bwLeft) {
      if (!isZero(bwTop)) result["border-width"] = bwTop;
   }

   // ✅ border-color
   const bcTop = computed.getPropertyValue("border-top-color");
   const bcRight = computed.getPropertyValue("border-right-color");
   const bcBottom = computed.getPropertyValue("border-bottom-color");
   const bcLeft = computed.getPropertyValue("border-left-color");

   if (bcTop === bcRight && bcRight === bcBottom && bcBottom === bcLeft) {
      result["border-color"] = bcTop;
   }

   // ✅ border-style
   const bsTop = computed.getPropertyValue("border-top-style");
   const bsRight = computed.getPropertyValue("border-right-style");
   const bsBottom = computed.getPropertyValue("border-bottom-style");
   const bsLeft = computed.getPropertyValue("border-left-style");

   if (bsTop === bsRight && bsRight === bsBottom && bsBottom === bsLeft) {
      result["border-style"] = bsTop;
   }

   return result;
}

const CATEGORY_RULES: Record<Category, RegExp[]> = {
   Typography: [
      /^text-(xs|sm|base|lg|xl|\d|\[)/, // 글자 크기
      /^leading-/,
      /^truncate$/,
      /^text-(left|center|right|justify)/,
      /^font-/,
      /^tracking-/,
      /^whitespace-/,
      /^list-/,
   ],
   Color: [
      /^text-\[/,
      /^text-(red|blue|green|gray|yellow|purple|pink|indigo|emerald|teal|orange|stone|neutral|zinc|slate|lime|amber|cyan|fuchsia|rose)-/,
      /^bg-/,
      /^border-/,
      /^divide-/,
      /^from-/,
      /^to-/,
      /^via-/,
   ],
   "Box Model": [
      /^m[trblxy]?/,
      /^p[trblxy]?/, // spacing
      /^w-/,
      /^h-/,
      /^max-/,
      /^min-/, // sizing
      /^border/,
      /^rounded/, // border, radius
   ],
   Layout: [
      /^flex$/,
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
   ],
   Effects: [
      /^shadow-/,
      /^opacity-/,
      /^blur-/,
      /^brightness-/,
      /^contrast-/,
      /^drop-shadow/,
      /^backdrop-/,
      /^transition/,
      /^duration-/,
      /^ease-/,
      /^transform$/,
      /^scale-/,
      /^rotate-/,
      /^translate-/,
   ],
   Other: [],
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
   // rgb/hsl normalization
   function normalizeRgbHsl(input: string) {
      return input.replace(
         /\[(rgb|hsl)\(([^)]+)\)\]/g,
         (_, fn, inner) => `[${fn}(${inner.replace(/[\s,]+/g, "_")})]`
      );
   }
   // [ ... ] 안은 공백 유지
   function safeSplit(className: string): string[] {
      const regex = /\[[^\]]*\]|\S+/g;
      return className.match(regex) || [];
   }

   // 1차 정리
   let cleaned = cleanDoubleBrackets(className);
   cleaned = normalizeRgbHsl(cleaned);
   const classes = safeSplit(cleaned);

   // ✅ 0 관련 클래스 제거
   const filtered = classes.filter((cls) => {
      return !/^m[trblxy]?-0$/.test(cls) && !/^p[trblxy]?-0$/.test(cls);
   });

   // ✅ margin/padding 축약 최적화
   function optimizeSpacing(list: string[]): string[] {
      const set = new Set(list);

      // ✅ 0 값 전부 제거 (m-0, p-0, mt-0, etc)
      for (const cls of [...set]) {
         if (/^(m|p)[trblxy]?-(0|\[0(px|rem)?\])$/.test(cls)) {
            set.delete(cls);
         }
      }

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

   return result;
}
