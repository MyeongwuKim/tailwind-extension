"use client";
import type { ReactNode } from "react";
import { useState } from "react";

interface ItemButtonProps {
   children: ReactNode;
   className?: string;
}

export default function ItemButton({ children, className = "" }: ItemButtonProps) {
   const [copied, setCopied] = useState(false);
   const text = typeof children === "string" ? children : "";

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

   const match = text.match(/text-\[(.+?)\]/);
   const colorValue = match ? match[1] : text;

   const isColor =
      /^#([0-9A-F]{3}){1,2}$/i.test(colorValue) ||
      /^rgb/.test(colorValue) ||
      /^hsl/.test(colorValue) ||
      /^[a-z]+$/i.test(colorValue);
   console.log(isColor);
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
         {isColor && (
            <span
               className={`inline-block w-3 h-3 rounded-sm border border-gray-400 ${copied && "invisible"}`}
               style={{ backgroundColor: colorValue }}
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
