"use client";
import type { ReactNode } from "react";
import { useState } from "react";

// ✅ CSS color keyword 화이트리스트 (필요하면 더 추가 가능)
const cssColorNames = new Set([
   "black",
   "white",
   "red",
   "blue",
   "green",
   "yellow",
   "gray",
   "grey",
   "transparent",
   "currentcolor",
   "inherit",
   "initial",
   "revert",
   "unset",
]);

// ✅ 언더스코어 → 공백 변환
function normalizeColor(value: string): string {
   return value.replace(/_/g, " ");
}
function isCssColor(value: string): boolean {
   const v = value.toLowerCase();

   return (
      v.startsWith("#") || // hex 색상
      v.includes("rgb") || // rgb(), rgba()
      v.includes("hsl") || // hsl(), hsla()
      v.includes("oklab") || // ✅ CSS4: oklab()
      v.includes("oklch") || // ✅ CSS4: oklch()
      v.includes("color(") || // ✅ color(display-p3 ...), color-mix 등
      cssColorNames.has(v) // ✅ CSS 색상 키워드 (white, black, transparent 등)
   );
}

interface ItemButtonProps {
   children: ReactNode;
   className?: string;
}

export default function ItemButton({ children, className = "" }: ItemButtonProps) {
   const [copied, setCopied] = useState(false);
   const text = typeof children === "string" ? children : "";

   // text-[...] 패턴 잡아내기
   const match =
      text.match(/(?:text|bg|border|shadow)-\[(.+?)\]/) ||
      text.match(/(oklab\(.*?\)|oklch\(.*?\)|rgb\(.*?\)|hsl\(.*?\)|#[0-9a-f]{3,8})/i);
   const colorValue = match ? match[1] : text;
   const isColor = isCssColor(colorValue);

   const handleCopy = async () => {
      if (!text) return;
      console.log(colorValue);
      try {
         await navigator.clipboard.writeText(text);
         setCopied(true);
         setTimeout(() => setCopied(false), 1500);
      } catch (err) {
         console.error("복사 실패:", err);
      }
   };

   return (
      <button
         onClick={handleCopy}
         className={`flex items-center gap-2 border border-gray-300 
        bg-white text-gray-900 hover:bg-gray-100 focus:ring-gray-100 
        dark:border-gray-600 dark:bg-gray-800 dark:text-white 
        dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700
        rounded-full px-4 py-2 transition-colors duration-150
        ${className}`}
      >
         {/* 색상칩 */}
         {isColor && (
            <span
               className={`inline-block w-3 h-3 rounded-sm border border-gray-400 ${
                  copied ? "invisible" : ""
               }`}
               style={{ backgroundColor: normalizeColor(colorValue) }}
            />
         )}

         <span className="relative inline-block">
            {/* 원래 텍스트 */}
            <span className={copied ? "opacity-0" : "opacity-100"}>{text}</span>

            {/* Copied! 텍스트 (센터 정렬) */}
            <span
               className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                  copied ? "opacity-100" : "opacity-0"
               }`}
            >
               Copied!
            </span>
         </span>
      </button>
   );
}
