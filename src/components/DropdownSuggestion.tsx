import { useEffect, useRef } from "react";

interface TWItem {
   name: string;
   color?: string;
}

interface DropdownSuggestionProps {
   position: { top: number; left: number; width: number };
   suggestions: TWItem[];
   highlightIndex: number;
   onSelect: (name: string) => void;
}

export default function DropdownSuggestion({
   position,
   suggestions,
   highlightIndex,
   onSelect,
}: DropdownSuggestionProps) {
   const containerRef = useRef<HTMLDivElement>(null);
   const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

   // ✅ highlight 변경 시 해당 아이템이 보이도록 스크롤 조정
   useEffect(() => {
      const el = itemRefs.current[highlightIndex];
      if (el && containerRef.current) {
         const container = containerRef.current;
         const elTop = el.offsetTop;
         const elBottom = elTop + el.offsetHeight;

         // 현재 스크롤 범위
         const viewTop = container.scrollTop;
         const viewBottom = viewTop + container.clientHeight;

         // 범위 밖이면 자동 스크롤
         if (elTop < viewTop) {
            container.scrollTop = elTop; // 위로
         } else if (elBottom > viewBottom) {
            container.scrollTop = elBottom - container.clientHeight; // 아래로
         }
      }
   }, [highlightIndex]);

   function extractColor(className: string): string {
      const parts = className.split("-");
      if (parts.length < 3) return "";
      const color = parts[1];
      const shade = parts[2];
      const map: Record<string, string> = {
         red: `hsl(0, 80%, ${100 - Number(shade) / 10}%)`,
         blue: `hsl(220, 80%, ${100 - Number(shade) / 10}%)`,
         green: `hsl(140, 60%, ${100 - Number(shade) / 10}%)`,
         gray: `hsl(0, 0%, ${100 - Number(shade) / 10}%)`,
         yellow: `hsl(45, 90%, ${100 - Number(shade) / 10}%)`,
      };
      return map[color] || "";
   }

   function isColorUtility(name: string) {
      return (
         name.startsWith("bg-") ||
         name.startsWith("text-") ||
         name.startsWith("border-") ||
         name.startsWith("ring-")
      );
   }
   return (
      <div
         ref={containerRef}
         id="meta-dropdown"
         className="ex-tw-fixed ex-tw-bg-white ex-tw-border ex-tw-border-gray-200 ex-tw-rounded-md ex-tw-shadow-lg ex-tw-z-[2147483646] ex-tw-max-h-72 ex-tw-overflow-auto"
         style={{
            top: position.top - window.scrollY,
            left: position.left - window.scrollX,
            width: position.width,
         }}
      >
         {suggestions.map((item, i) => (
            <button
               ref={(el) => {
                  itemRefs.current[i] = el;
               }}
               key={item.name}
               onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.name);
               }}
               className={`ex-tw-flex ex-tw-items-center ex-tw-gap-2 ex-tw-w-full ex-tw-text-left ex-tw-px-3 ex-tw-py-2 ex-tw-transition ${
                  i === highlightIndex ? "ex-tw-bg-blue-100" : "hover:ex-tw-bg-gray-100"
               }`}
            >
               {isColorUtility(item.name) && (
                  <span
                     className="ex-tw-w-3 ex-tw-h-3 ex-tw-rounded-full ex-tw-border ex-tw-border-gray-300"
                     style={{ backgroundColor: item.color || extractColor(item.name) }}
                  />
               )}
               <span className="ex-tw-text-sm ex-tw-text-gray-800">{item.name}</span>
            </button>
         ))}
      </div>
   );
}
