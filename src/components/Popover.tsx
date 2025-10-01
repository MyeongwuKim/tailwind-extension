import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { categorizeClasses, cssToTailwind, getClassAppliedStyles } from "../hooks/useConverter";
import CopyButton from "./CopyButton";
import ItemButton from "./ButtonItem";
import { logger } from "../hooks/useUtils";

export default function Popover({ target, onClose }: { target: HTMLElement; onClose: () => void }) {
   const popoverRef = useRef<HTMLDivElement>(null);
   const [pos, setPos] = useState({ top: 0, left: 0 });
   const [placement, setPlacement] = useState<"top" | "bottom">("top");

   useLayoutEffect(() => {
      if (!target || !popoverRef.current) return;

      const rect = target.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popRect = popoverRef.current.getBoundingClientRect();

      let top = rect.top + window.scrollY - popRect.height - 8;
      let left = rect.left + window.scrollX + rect.width / 2 - popRect.width / 2;
      let place: "top" | "bottom" = "top";

      // 위쪽 공간 부족 → 아래로
      if (top < window.scrollY) {
         top = rect.bottom + window.scrollY + 8;
         place = "bottom";
      }

      // 아래쪽 공간 부족 → 위로
      if (place === "bottom" && top + popRect.height > vh + window.scrollY) {
         top = rect.top + window.scrollY - popRect.height - 8;
         place = "top";
      }

      // 좌우 화면 보정
      left = Math.max(8, Math.min(left, vw - popRect.width - 8));

      setPos({ top, left });
      setPlacement(place);
   }, [target]);

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (
            popoverRef.current &&
            !popoverRef.current.contains(e.target as Node) &&
            !target.contains(e.target as Node)
         ) {
            onClose();
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [target]);

   const { tailwindStyles, classCategory } = useMemo(() => {
      if (!target) return { tailwindStyles: "", classCategory: null };

      // ✅ getClassAppliedStyles → 순수 CSS 값만
      const styleObj = getClassAppliedStyles(target);
      logger("1", styleObj);
      const tailwindStyles = cssToTailwind(styleObj as Record<string, string>);

      const classCategory = categorizeClasses(tailwindStyles);

      logger("styleObj(raw):", classCategory);
      return { tailwindStyles, classCategory };
   }, [target]);

   const targetName = useMemo(() => {
      const tag = target.tagName.toLowerCase();

      // nth-of-type 구하기
      let index = 0;
      if (target.parentElement) {
         const siblings = Array.from(target.parentElement.children).filter(
            (child) => child.tagName === target.tagName
         );
         index = siblings.indexOf(target);
      }

      const id = target.id ? `#${target.id}` : `#${index}`;
      const classes = target.classList.length ? "." + Array.from(target.classList).join(".") : "";

      return `${tag}${id}${classes}`;
   }, [target]);

   return (
      <div
         onMouseDown={(e) => e.stopPropagation()} // 👈 추가
         ref={popoverRef}
         className="absolute rounded-md w-[400px] min-h-80 max-h-[400px] font-inter
                 overflow-auto bg-background1 shadow-lg p-4 transition-transform duration-150"
         style={{
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
         }}
      >
         <h2 className="text-xl font-bold text-text1 line-clamp-2 break-words w-full">
            {targetName}
         </h2>

         <div className="border-border1 border-b-2 w-full my-4 relative"></div>
         <div className="gap-4">
            <div id="tailwindClasses-area">
               <div className="text-base leading-relaxed text-gray-500 dark:text-gray-400 break-words ">
                  {tailwindStyles}
               </div>
               <div className="flex justify-end mt-4">
                  <CopyButton textToCopy={tailwindStyles} className="w-32 h-10" />
               </div>
            </div>
            <div id="typography-area" className="">
               {/* <h3 className="font-medium text-lg text-text1">Typography</h3>
               <div className="mt-4 flex gap-2 flex-wrap">
                  {typographyStyles.length <= 0 ? (
                     <span className="text-base text-gray-500 dark:text-gray-400">
                        No Class List
                     </span>
                  ) : (
                     typographyStyles.map((str) => {
                        return <ItemButton className="w-auto text-sm">{str}</ItemButton>;
                     })
                  )}
               </div> */}
            </div>
         </div>
      </div>
   );
}
