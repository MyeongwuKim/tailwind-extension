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

/* ========== CSS → Tailwind 변환기 ========== */
export function cssToTailwind(prop: string, value: string): string | null {
   // ----- Sizing -----
   if (
      prop === "width" ||
      prop === "height" ||
      prop.startsWith("min-") ||
      prop.startsWith("max-")
   ) {
      if (value === "100%") return prop[0] === "w" ? "w-full" : "h-full";
      const key = closest(parseFloat(value), spacingMap);
      return key ? `${prop[0]}-${key}` : `${prop[0]}-[${value}]`;
   }

   // ----- Spacing -----
   if (prop.startsWith("margin")) {
      const key = closest(parseFloat(value), spacingMap);
      if (!key) return `m-[${value}]`;
      if (prop === "margin") return `m-${key}`;
      if (prop === "margin-top") return `mt-${key}`;
      if (prop === "margin-bottom") return `mb-${key}`;
      if (prop === "margin-left") return `ml-${key}`;
      if (prop === "margin-right") return `mr-${key}`;
   }
   if (prop.startsWith("padding")) {
      const key = closest(parseFloat(value), spacingMap);
      if (!key) return `p-[${value}]`;
      if (prop === "padding") return `p-${key}`;
      if (prop === "padding-top") return `pt-${key}`;
      if (prop === "padding-bottom") return `pb-${key}`;
      if (prop === "padding-left") return `pl-${key}`;
      if (prop === "padding-right") return `pr-${key}`;
   }
   if (prop.startsWith("gap")) {
      const key = closest(parseFloat(value), spacingMap);
      return key ? `gap-${key}` : `gap-[${value}]`;
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
   if (prop === "line-height") return `leading-[${value}]`;
   if (prop === "letter-spacing") return `tracking-[${value}]`;
   if (prop === "text-align") {
      if (value === "center") return "text-center";
      if (value === "left") return "text-left";
      if (value === "right") return "text-right";
   }
   if (prop === "color") return `text-[${value}]`;

   // ----- Backgrounds -----
   if (prop === "background-color") return `bg-[${value}]`;
   if (prop === "background-size") return `bg-[${value}]`;
   if (prop === "background-position") return `bg-[${value}]`;
   if (prop === "background-image") return `bg-[${value}]`;

   // ----- Borders -----
   if (prop === "border-width") return `border-[${value}]`;
   if (prop === "border-color") return `border-[${value}]`;
   if (prop.includes("radius")) {
      const key = closest(parseFloat(value), radiusMap);
      return key ? `rounded-${key}` : `rounded-[${value}]`;
   }

   // ----- Effects -----
   if (prop === "box-shadow") return `shadow-[${value}]`;
   if (prop === "opacity") return `opacity-[${value}]`;

   // ----- Borders -----
   if (prop === "border-width") {
      if (value === "1px") return "border";
      if (value === "2px") return "border-2";
      if (value === "4px") return "border-4";
      if (value === "8px") return "border-8";
      return `border-[${value}]`;
   }
   if (prop === "border-color") return `border-[${value}]`;
   if (prop === "border-style") {
      switch (value) {
         case "solid":
            return "border-solid";
         case "dashed":
            return "border-dashed";
         case "dotted":
            return "border-dotted";
         case "double":
            return "border-double";
         case "none":
            return "border-none";
         default:
            return `border-[${value}]`;
      }
   }
   if (prop.includes("radius")) {
      const key = closest(parseFloat(value), radiusMap);
      return key ? `rounded-${key}` : `rounded-[${value}]`;
   }

   // ----- Layout -----
   if (prop === "display") {
      if (value === "flex") return "flex";
      if (value === "block") return "block";
      if (value === "inline-block") return "inline-block";
      if (value === "grid") return "grid";
   }
   if (prop === "position") return value; // relative, absolute 등 그대로 tailwind class 있음
   if (["top", "bottom", "left", "right"].includes(prop)) return `${prop}-[${value}]`;
   if (prop === "z-index") return `z-[${value}]`;
   if (prop === "overflow") return `overflow-${value}`;
   if (prop === "cursor") return `cursor-${value}`;

   // ----- Flex/Grid helpers -----
   if (prop === "justify-content") {
      if (value === "center") return "justify-center";
      if (value === "flex-start") return "justify-start";
      if (value === "flex-end") return "justify-end";
      if (value === "space-between") return "justify-between";
   }
   if (prop === "align-items") {
      if (value === "center") return "items-center";
      if (value === "flex-start") return "items-start";
      if (value === "flex-end") return "items-end";
   }

   // ----- Fallback -----
   return `${prop}-[${value}]`;
}
