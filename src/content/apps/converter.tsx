import { useMemo, useState } from "react";
import { categorizeClasses, cssToTailwind, getClassAppliedStyles } from "../../hooks/useConverter";
import CopyButton from "../../components/CopyButton";
import ItemButton from "../../components/ButtonItem";
import { logger } from "../../hooks/useUtils";

export default function ConverterPopover({ target }: { target: HTMLElement }) {
   const [pos] = useState({ top: 0, left: 0 });

   const { tailwindStyles, classCategory } = useMemo(() => {
      if (!target) return { tailwindStyles: "", classCategory: null };

      const styleObj = getClassAppliedStyles(target);
      logger("1", styleObj);
      const tailwindStyles = cssToTailwind(styleObj as Record<string, string>);
      const classCategory = categorizeClasses(tailwindStyles);
      logger("styleObj(raw):", classCategory);
      return { tailwindStyles, classCategory };
   }, [target]);

   return (
      <div
         onMouseDown={(e) => e.stopPropagation()}
         className="ex-tw-absolute ex-tw-rounded-md ex-tw-w-full ex-tw-h-full ex-tw-font-inter 
                    ex-tw-border-border1 ex-tw-border-2 ex-tw-overflow-auto 
                    ex-tw-bg-background1 ex-tw-shadow-lg  
                    ex-tw-transition-transform ex-tw-duration-150"
         style={{
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
         }}
      >
         <div
            id="tw-drag-handle"
            className="ex-tw-w-full ex-tw-relative ex-tw-border-border1 ex-tw-border-b-2 ex-tw-py-4  ex-tw-pl-4 ex-tw-select-none"
         >
            <h2 className="ex-tw-text-xl ex-tw-font-bold ex-tw-text-text5">Tailwind Converter</h2>
            {/* <h3
               className="mt-2 ex-tw-text-lg ex-tw-font-bold ex-tw-text-text1 ex-tw-line-clamp-2 
                        ex-tw-break-words ex-tw-w-full ex-tw-relative"
            >
               {targetName}
            </h3> */}
         </div>

         <div className="ex-tw-p-4">
            <div className="ex-tw-gap-4">
               <div id="tailwindClasses-area">
                  <div className="ex-tw-text-base ex-tw-leading-relaxed ex-tw-text-text2 ex-tw-break-words">
                     {tailwindStyles}
                  </div>
                  <div className="ex-tw-flex ex-tw-justify-end ex-tw-mt-4">
                     <CopyButton textToCopy={tailwindStyles} className="ex-tw-w-32 ex-tw-h-10" />
                  </div>
               </div>

               <div id="category-area" className="ex-tw-gap-2 ex-tw-flex ex-tw-flex-col">
                  {classCategory &&
                     (Object.keys(classCategory) as (keyof typeof classCategory)[]).map(
                        (category, i) => (
                           <div key={i}>
                              <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                                 {category}
                              </h3>
                              <div className="ex-tw-mt-2 ex-tw-flex ex-tw-gap-2 ex-tw-flex-wrap">
                                 {classCategory[category].length <= 0 ? (
                                    <span className="ex-tw-text-base ex-tw-text-text2">
                                       No Class List
                                    </span>
                                 ) : (
                                    classCategory[category].map((str) => (
                                       <ItemButton key={str} className="ex-tw-w-auto ex-tw-text-sm">
                                          {str}
                                       </ItemButton>
                                    ))
                                 )}
                              </div>
                           </div>
                        )
                     )}
               </div>
            </div>
         </div>
      </div>
   );
}
