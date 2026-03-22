import { useEffect, useMemo, useState } from "react";
import {
   categorizeClasses,
   convertWithReasons,
   cssToTailwind,
   getClassAppliedStyles,
} from "../../hooks/useConverter";
import ItemButton from "../../components/ButtonItem";
import CopyFormatDropdown from "../../components/CopyFormatDropdown";
import { logger } from "../../hooks/useUtils";
import { cleanClassString } from "../../hooks/classCleaner";

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
   const [showReasons, setShowReasons] = useState(false);
   const [showCleaned, setShowCleaned] = useState(true);
   const [copiedLabel, setCopiedLabel] = useState("");

   useEffect(() => {
      setBaseTarget(target);
      setSelectedTarget(target);
      setShowReasons(false);
      setShowCleaned(true);
      setCopiedLabel("");
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

   const { tailwindStyles, classCategory, reasons } = useMemo(() => {
      if (!selectedTarget || !selectedTarget.isConnected)
         return { tailwindStyles: "", classCategory: null, reasons: [] };

      const styleObj = getClassAppliedStyles(selectedTarget);
      logger("1", styleObj);
      const tailwindStyles = cssToTailwind(styleObj as Record<string, string>);
      const classCategory = categorizeClasses(tailwindStyles);
      const reasons = convertWithReasons(styleObj as Record<string, string>);
      logger("styleObj(raw):", classCategory);
      return { tailwindStyles, classCategory, reasons };
   }, [selectedTarget]);
   const cleanedTailwindStyles = useMemo(() => cleanClassString(tailwindStyles), [tailwindStyles]);
   const visibleTailwindStyles = showCleaned ? cleanedTailwindStyles : tailwindStyles;
   const getCopyPayload = (format: "className" | "apply" | "multiline") => {
      const source = visibleTailwindStyles.trim();
      if (!source) return "";
      if (format === "apply") {
         return `.converted {\n  @apply ${source};\n}`;
      }
      if (format === "multiline") {
         return source.split(/\s+/).filter(Boolean).join("\n");
      }
      return `className="${source}"`;
   };

   const handleCopyByFormat = async (format: "className" | "apply" | "multiline") => {
      const payload = getCopyPayload(format);
      if (!payload) return;
      try {
         await navigator.clipboard.writeText(payload);
         setCopiedLabel(
            format === "className" ? "Copied className" : format === "apply" ? "Copied @apply" : "Copied multiline"
         );
      } catch {
         setCopiedLabel("Copy failed");
      }
   };

   useEffect(() => {
      if (!copiedLabel) return;
      const t = window.setTimeout(() => setCopiedLabel(""), 1400);
      return () => window.clearTimeout(t);
   }, [copiedLabel]);

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
            <div className="ex-tw-gap-6">
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

               <div id="tailwindClasses-area" className="ex-tw-pb-1">
                  <div className="ex-tw-flex ex-tw-gap-2 ex-tw-mb-2">
                     <button
                        type="button"
                        onClick={() => setShowCleaned(false)}
                        className={`ex-tw-text-xs ex-tw-px-2 ex-tw-py-1 ex-tw-rounded ex-tw-border ${
                           showCleaned
                              ? "ex-tw-border-border1 ex-tw-text-text3"
                              : "ex-tw-border-text5 ex-tw-text-text5"
                        }`}
                     >
                        Raw
                     </button>
                     <button
                        type="button"
                        onClick={() => setShowCleaned(true)}
                        className={`ex-tw-text-xs ex-tw-px-2 ex-tw-py-1 ex-tw-rounded ex-tw-border ${
                           showCleaned
                              ? "ex-tw-border-text5 ex-tw-text-text5"
                              : "ex-tw-border-border1 ex-tw-text-text3"
                        }`}
                     >
                        Clean
                     </button>
                  </div>
                  <div className="ex-tw-text-base ex-tw-leading-relaxed ex-tw-text-text2 ex-tw-break-words">
                     {visibleTailwindStyles}
                  </div>
                  <div className="ex-tw-flex ex-tw-justify-between ex-tw-items-center ex-tw-mt-4">
                     <div />
                     <CopyFormatDropdown
                        buttonLabel={copiedLabel || "Copy"}
                        disabled={!visibleTailwindStyles.trim()}
                        onSelect={handleCopyByFormat}
                     />
                  </div>
               </div>
               <div id="reason-area" className="ex-tw-gap-2 ex-tw-flex ex-tw-flex-col ex-tw-py-2">
                  <div className="ex-tw-flex ex-tw-items-center ex-tw-justify-between">
                     <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                        Conversion Reasons
                     </h3>
                     <button
                        type="button"
                        onClick={() => setShowReasons((prev) => !prev)}
                        className="ex-tw-text-xs ex-tw-px-2 ex-tw-py-1 ex-tw-rounded ex-tw-border ex-tw-border-border1 ex-tw-text-text2 hover:ex-tw-bg-background2"
                     >
                        {showReasons ? "Hide" : "Show"}
                     </button>
                  </div>
                  {showReasons &&
                     (reasons.length === 0 ? (
                        <span className="ex-tw-text-sm ex-tw-text-text3">No conversion metadata</span>
                     ) : (
                        <div className="ex-tw-flex ex-tw-flex-col ex-tw-gap-2">
                           {reasons.map((item, i) => (
                              <div
                                 key={`${item.className}-${item.sourceProp}-${i}`}
                                 className="ex-tw-border ex-tw-border-border1 ex-tw-rounded ex-tw-p-2 ex-tw-bg-background2"
                              >
                                 <div className="ex-tw-flex ex-tw-items-center ex-tw-justify-between">
                                    <code className="ex-tw-text-xs ex-tw-text-text1">
                                       {item.className}
                                    </code>
                                    <span
                                       className={`ex-tw-text-[10px] ex-tw-px-2 ex-tw-py-0.5 ex-tw-rounded-full ${
                                          item.quality === "exact"
                                             ? "ex-tw-bg-emerald-100 ex-tw-text-emerald-700"
                                             : item.quality === "near"
                                               ? "ex-tw-bg-amber-100 ex-tw-text-amber-700"
                                               : "ex-tw-bg-red-100 ex-tw-text-red-700"
                                       }`}
                                    >
                                       {item.quality}
                                    </span>
                                 </div>
                                 <div className="ex-tw-mt-1 ex-tw-text-[11px] ex-tw-text-text3">
                                    {item.sourceProp}: {item.sourceValue}
                                 </div>
                              </div>
                           ))}
                        </div>
                     ))}
               </div>

               <div id="category-area" className="ex-tw-gap-3 ex-tw-flex ex-tw-flex-col ex-tw-pt-1">
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
