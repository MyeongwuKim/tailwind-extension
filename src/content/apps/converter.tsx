import { useEffect, useMemo, useState } from "react";
import { categorizeClasses, cssToTailwind, getClassAppliedStyles } from "../../hooks/useConverter";
import CopyButton from "../../components/CopyButton";
import ItemButton from "../../components/ButtonItem";
import { logger } from "../../hooks/useUtils";

type BreadcrumbItem =
   | { kind: "node"; element: HTMLElement; index: number }
   | { kind: "ellipsis"; key: string };

export default function ConverterPopover({
   target,
   onTargetChange,
}: {
   target: HTMLElement;
   onTargetChange?: (el: HTMLElement) => void;
}) {
   const [pos] = useState({ top: 0, left: 0 });
   const [baseTarget, setBaseTarget] = useState<HTMLElement>(target);
   const [selectedTarget, setSelectedTarget] = useState<HTMLElement>(target);

   useEffect(() => {
      setBaseTarget(target);
      setSelectedTarget(target);
   }, [target]);

   const ancestorChain = useMemo(() => {
      if (!baseTarget || !baseTarget.isConnected) return [];

      const chain: HTMLElement[] = [];
      let current: HTMLElement | null = baseTarget;

      // 너무 긴 체인은 UI 가독성을 위해 제한
      while (current && chain.length < 12) {
         chain.push(current);
         if (current === document.body || current === document.documentElement) break;
         current = current.parentElement;
      }
      return chain;
   }, [baseTarget]);

   const selectedLabel = useMemo(() => {
      if (!selectedTarget) return "";
      const tag = selectedTarget.tagName.toLowerCase();
      const id = selectedTarget.id ? `#${selectedTarget.id}` : "";
      const classes = Array.from(selectedTarget.classList).slice(0, 1).join(".");
      return classes ? `${tag}.${classes}${id}` : `${tag}${id}`;
   }, [selectedTarget]);

   const trimMiddle = (value: string, max = 22) => {
      if (value.length <= max) return value;
      const head = Math.ceil((max - 3) / 2);
      const tail = Math.floor((max - 3) / 2);
      return `${value.slice(0, head)}...${value.slice(-tail)}`;
   };

   const makeTargetLabel = (el: HTMLElement) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const classes = Array.from(el.classList).slice(0, 1).join(".");
      const raw = classes ? `${tag}.${classes}${id}` : `${tag}${id}`;
      return trimMiddle(raw);
   };

   const breadcrumbItems = useMemo(() => {
      const maxNodes = 6;
      const nodes: BreadcrumbItem[] = ancestorChain.map((el, idx) => ({
         kind: "node",
         element: el,
         index: idx,
      }));

      if (nodes.length <= maxNodes) return nodes;

      return [nodes[0], nodes[1], { kind: "ellipsis", key: "middle" }, ...nodes.slice(-3)];
   }, [ancestorChain]);

   const handleTargetSelect = (el: HTMLElement) => {
      setSelectedTarget(el);
      onTargetChange?.(el);
   };

   const { tailwindStyles, classCategory } = useMemo(() => {
      if (!selectedTarget || !selectedTarget.isConnected)
         return { tailwindStyles: "", classCategory: null };

      const styleObj = getClassAppliedStyles(selectedTarget);
      logger("1", styleObj);
      const tailwindStyles = cssToTailwind(styleObj as Record<string, string>);
      const classCategory = categorizeClasses(tailwindStyles);
      logger("styleObj(raw):", classCategory);
      return { tailwindStyles, classCategory };
   }, [selectedTarget]);

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
            {selectedLabel && (
               <h3 className="ex-tw-mt-1 ex-tw-text-xs ex-tw-text-text3 ex-tw-line-clamp-2 ex-tw-break-all ex-tw-pr-4">
                  {selectedLabel}
               </h3>
            )}
         </div>

         <div className="ex-tw-p-4">
            <div className="ex-tw-gap-4">
               <div id="ancestor-area" className="ex-tw-mb-4">
                  <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1 ex-tw-mb-1">
                     Parent Chain
                  </h3>
                  <div className="ex-tw-flex ex-tw-flex-wrap ex-tw-items-center ex-tw-gap-1 ex-tw-text-xs ex-tw-text-text3">
                     {breadcrumbItems.map((item, idx) => (
                        <div key={item.kind === "ellipsis" ? item.key : `${item.element.tagName}-${item.index}`}>
                           {idx > 0 && <span className="ex-tw-mx-1">{" > "}</span>}
                           {item.kind === "ellipsis" ? (
                              <span className="ex-tw-text-text4">...</span>
                           ) : (
                              <button
                                 onClick={() => handleTargetSelect(item.element)}
                                 className={`ex-tw-underline-offset-2 hover:ex-tw-underline ${
                                    item.element === selectedTarget
                                       ? "ex-tw-text-text5 ex-tw-font-semibold ex-tw-underline"
                                       : "ex-tw-text-text2"
                                 }`}
                              >
                                 {makeTargetLabel(item.element)}
                              </button>
                           )}
                        </div>
                     ))}
                  </div>
               </div>

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
