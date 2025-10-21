import { useEffect, useRef, useState } from "react";
import ClassInput from "../../components/ClassInput";
import { logger } from "../../hooks/useUtils";

const evtList = ["Active", "Hover", "Disabled", "Focus"] as const;

export default function TesterPopover({
   target,
   iframeDoc,
}: {
   target: HTMLElement;
   iframeDoc: Document;
}) {
   const previewRef = useRef<HTMLDivElement>(null);
   const popoverRef = useRef<HTMLDivElement>(null);
   const [previewClone, setPreviewClone] = useState<HTMLElement | null>(null);

   const [isDisabled, setIsDisabled] = useState(false); // ✅ 체크박스 상태

   /* ========== Tailwind + Override 스타일 주입 ========== */
   useEffect(() => {
      const styleId = "ex-tw-tester";
      if (!iframeDoc.getElementById(styleId)) {
         const style = iframeDoc.createElement("link");
         style.id = styleId;
         style.rel = "stylesheet";
         style.href = chrome.runtime.getURL("assets/tw-meta.built.css");
         iframeDoc.head.appendChild(style);
      }

      const overrideId = "ex-tw-color-override";
      if (!iframeDoc.getElementById(overrideId)) {
         const s = iframeDoc.createElement("style");
         s.id = overrideId;
         s.textContent = `
            .ex-tw-color-scope * { color: inherit !important; }
            .ex-tw-color-scope button,
            .ex-tw-color-scope input,
            .ex-tw-color-scope select,
            .ex-tw-color-scope textarea { color: inherit !important; }
            .ex-tw-color-scope, .ex-tw-color-scope * {
               -webkit-text-fill-color: currentColor !important;
               -webkit-text-stroke-color: currentColor !important;
            }
         `;
         iframeDoc.head.appendChild(s);
      }
   }, [iframeDoc]);

   /* ========== 타겟 복제 및 스타일 복사 ========== */
   useEffect(() => {
      if (!target || !previewRef.current) return;
      previewRef.current.innerHTML = "";

      const clone = target.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.style.pointerEvents = "none";
      clone.style.margin = "0";
      clone.style.display = "block";
      clone.style.position = "relative";
      clone.classList.add("ex-tw-color-scope");

      const computed = window.getComputedStyle(target);
      const SKIP = new Set([
         "-webkit-text-fill-color",
         "-webkit-text-stroke-color",
         "-webkit-text-stroke-width",
      ]);
      for (const prop of computed) {
         if (SKIP.has(prop)) continue;
         try {
            clone.style.setProperty(prop, computed.getPropertyValue(prop));
         } catch {}
      }

      clone.style.setProperty("-webkit-text-fill-color", "currentColor");
      clone.style.setProperty("-webkit-text-stroke-color", "currentColor");

      previewRef.current.appendChild(clone);
      setPreviewClone(clone);

      // 스케일 맞추기
      const container = previewRef.current;
      const rect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scaleX = containerRect.width / rect.width;
      const scaleY = containerRect.height / rect.height;
      const scale = Math.min(scaleX, scaleY, 1);
      clone.style.transformOrigin = "top left";
      clone.style.transform = `scale(${scale})`;
   }, [target]);

   /* ========== Disable 속성 토글 ========== */
   useEffect(() => {
      if (!previewClone) return;
      if (isDisabled) {
         previewClone.setAttribute("disabled", "true");
      } else {
         previewClone.removeAttribute("disabled");
      }
   }, [isDisabled, previewClone]);

   /* ========== UI ========== */
   return (
      <div
         ref={popoverRef}
         onMouseDown={(e) => {
            if (iframeDoc.getElementById("meta-dropdown"))
               document.dispatchEvent(new CustomEvent("close-all-dropdowns"));
         }}
         className="ex-tw-absolute ex-tw-rounded-md ex-tw-w-full ex-tw-h-full ex-tw-font-inter 
              ex-tw-border-border1 ex-tw-border-2 ex-tw-overflow-auto 
              ex-tw-bg-background1 ex-tw-shadow-lg
              ex-tw-transition-transform ex-tw-duration-150"
         style={{ zIndex: 9999 }}
      >
         <div
            id="tw-drag-handle"
            className="ex-tw-w-full ex-tw-relative ex-tw-border-border1 ex-tw-border-b-2 ex-tw-py-4 ex-tw-pl-4 ex-tw-select-none"
         >
            <h2 className="ex-tw-text-xl ex-tw-font-bold ex-tw-text-text5">Tailwind UI Tester</h2>
         </div>

         <div className="ex-tw-gap-2 ex-tw-flex ex-tw-flex-col ex-tw-p-4 ex-tw-relative">
            <div className="ex-tw-flex ex-tw-justify-between">
               <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text">Preview</h3>
               {/* ✅ 우하단 Disable 체크박스 */}
               <label
                  id="disable-Checkbox"
                  className="ex-tw-flex ex-tw-items-center ex-tw-gap-1 ex-tw-text-sm ex-tw-text-text3"
               >
                  <input
                     type="checkbox"
                     checked={isDisabled}
                     onChange={(e) => setIsDisabled(e.target.checked)}
                     className="ex-tw-w-4 ex-tw-h-4"
                  />
                  Disable
               </label>
            </div>

            <div
               id="preview-area"
               className="ex-tw-relative ex-tw-flex ex-tw-items-center ex-tw-justify-center ex-tw-h-[200px] ex-tw-overflow-hidden ex-tw-rounded-md ex-tw-bg-background2 ex-tw-p-4"
            >
               <div ref={previewRef} />
            </div>

            {previewClone &&
               evtList.map((evt, i) => (
                  <div id={`${evt}-area`} key={i} className="ex-tw-relative ex-tw-overflow-visible">
                     <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                        {evt}
                        <ClassInput type={evt} target={target} preview={previewClone} />
                     </h3>
                  </div>
               ))}
         </div>
      </div>
   );
}
