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

         // 2초 후 다시 원래 상태로
         setTimeout(() => setCopied(false), 2000);
      } catch (err) {
         console.error("복사 실패:", err);
      }
   };

   return (
      <button
         onClick={handleCopy}
         className={`flex items-center justify-center text-center font-medium gap-2
            focus:outline-none focus:ring-4 h-10 px-5 text-lg rounded-lg border 
           bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-300
dark:bg-slate-500 dark:hover:bg-slate-600 dark:focus:ring-slate-800
        ${className}`}
      >
         {copied ? (
            <>
               <CheckIcon className="w-5 h-5 animate-bounce" />
               <span className="">Copied!</span>
            </>
         ) : (
            <>
               <ClipboardIcon className="w-5 h-5" />
               <span>Copy</span>
            </>
         )}
      </button>
   );
}
