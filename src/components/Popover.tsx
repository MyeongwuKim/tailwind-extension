import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { categorizeClasses, cssToTailwind, getClassAppliedStyles } from "../hooks/useConverter";
import CopyButton from "./CopyButton";
import ItemButton from "./ButtonItem";
import { logger } from "../hooks/useUtils";

export default function Popover({ target }: { target: HTMLElement }) {
   const popoverRef = useRef<HTMLDivElement>(null);
   const [pos, setPos] = useState({ top: 0, left: 0 });
   const [placement, setPlacement] = useState<"top" | "bottom">("top");

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
         className="absolute rounded-md w-[400px] h-[400px] font-inter
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
               <div className="text-base leading-relaxed text-gray-500 dark:text-gray-400 break-words">
                  {tailwindStyles}
               </div>
               <div className="flex justify-end mt-4">
                  <CopyButton textToCopy={tailwindStyles} className="w-32 h-10" />
               </div>
            </div>
            <div id="category-area" className="gap-2 flex flex-col">
               {classCategory &&
                  (Object.keys(classCategory) as (keyof typeof classCategory)[]).map(
                     (category, i) => {
                        return (
                           <div key={i}>
                              <h3 className="font-medium text-lg text-text1">{category}</h3>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                 {classCategory[category].length <= 0 ? (
                                    <span className="text-base text-gray-500 dark:text-gray-400">
                                       No Class List
                                    </span>
                                 ) : (
                                    classCategory[category].map((str) => {
                                       return (
                                          <ItemButton className="w-auto text-sm">{str}</ItemButton>
                                       );
                                    })
                                 )}
                              </div>
                           </div>
                        );
                     }
                  )}
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
