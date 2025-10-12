"use client";
import type { ReactNode } from "react";
import { useState } from "react";

// ✅ CSS color keyword 화이트리스트
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
      v.startsWith("#") ||
      v.includes("rgb") ||
      v.includes("hsl") ||
      v.includes("oklab") ||
      v.includes("oklch") ||
      v.includes("color(") ||
      cssColorNames.has(v)
   );
}

interface ItemButtonProps {
   children: ReactNode;
   className?: string;
}

export default function ItemButton({ children, className = "" }: ItemButtonProps) {
   const [copied, setCopied] = useState(false);
   const text = typeof children === "string" ? children : "";

   const match =
      text.match(/(?:text|bg|border|shadow)-\[(.+?)\]/) ||
      text.match(/(oklab\(.*?\)|oklch\(.*?\)|rgb\(.*?\)|hsl\(.*?\)|#[0-9a-f]{3,8})/i);
   const colorValue = match ? match[1] : text;
   const isColor = isCssColor(colorValue);

   const handleCopy = async () => {
      if (!text) return;
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
         className={`ex-tw-flex ex-tw-items-center ex-tw-gap-2 ex-tw-border ex-tw-border-gray-300 
            ex-tw-bg-white ex-tw-text-gray-900 hover:ex-tw-bg-gray-100 focus:ex-tw-ring-gray-100 
            dark:ex-tw-border-gray-600 dark:ex-tw-bg-gray-800 dark:ex-tw-text-white 
            dark:hover:ex-tw-border-gray-600 dark:hover:ex-tw-bg-gray-700 dark:focus:ex-tw-ring-gray-700
            ex-tw-rounded-full ex-tw-px-4 ex-tw-py-2 ex-tw-transition-colors ex-tw-duration-150
            ${className}`}
      >
         {/* 색상칩 */}
         {isColor && (
            <span
               className={`ex-tw-inline-block ex-tw-w-3 ex-tw-h-3 ex-tw-rounded-sm ex-tw-border ex-tw-border-gray-400 ${
                  copied ? "ex-tw-invisible" : ""
               }`}
               style={{ backgroundColor: normalizeColor(colorValue) }}
            />
         )}

         <span className="ex-tw-relative ex-tw-inline-block">
            {/* 원래 텍스트 */}
            <span className={copied ? "ex-tw-opacity-0" : "ex-tw-opacity-100"}>{text}</span>

            {/* Copied! 텍스트 */}
            <span
               className={`ex-tw-absolute ex-tw-inset-0 ex-tw-flex ex-tw-items-center ex-tw-justify-center 
                  ex-tw-transition-opacity ex-tw-duration-200 ${
                     copied ? "ex-tw-opacity-100" : "ex-tw-opacity-0"
                  }`}
            >
               Copied!
            </span>
         </span>
      </button>
   );
}
