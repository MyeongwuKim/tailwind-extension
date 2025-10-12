import React, { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CopyButtonProps {
   textToCopy: string;
   className?: string;
}

export default function CopyButton({ textToCopy, className = "" }: CopyButtonProps) {
   const [copied, setCopied] = useState(false);

   const handleCopy = async () => {
      try {
         await navigator.clipboard.writeText(textToCopy);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
      } catch (err) {
         console.error("복사 실패:", err);
      }
   };

   return (
      <button
         onClick={handleCopy}
         className={`ex-tw-flex ex-tw-items-center ex-tw-justify-center ex-tw-text-center 
            ex-tw-font-medium ex-tw-gap-2 ex-tw-focus:outline-none ex-tw-focus:ring-4 
            ex-tw-h-10 ex-tw-px-5 ex-tw-text-lg ex-tw-rounded-lg ex-tw-border 
            ex-tw-bg-slate-600 ex-tw-text-white hover:ex-tw-bg-slate-700 ex-tw-focus:ring-slate-300
            dark:ex-tw-bg-slate-500 dark:hover:ex-tw-bg-slate-600 dark:ex-tw-focus:ring-slate-800
            ${className}`}
      >
         {copied ? (
            <>
               <CheckIcon className="ex-tw-w-5 ex-tw-h-5 ex-tw-animate-bounce" />
               <span>Copied!</span>
            </>
         ) : (
            <>
               <ClipboardIcon className="ex-tw-w-5 ex-tw-h-5" />
               <span>Copy</span>
            </>
         )}
      </button>
   );
}
