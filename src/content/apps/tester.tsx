import { useEffect, useRef, useState } from "react";
import ClassInput from "../../components/ClassInput";

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
         style.id = "ex-tw-tester";
         style.rel = "stylesheet";
         style.href = chrome.runtime.getURL("assets/tw-meta.built.css");
         style.onload = () => console.log("✅ tw-meta.built.css 로드 완료");
         iframeDoc.head.appendChild(style);
      }
      // ✅ variant 시뮬레이션용 스타일 블록 추가
      const previewStyleId = "ex-tw-preview-variants";
      if (!iframeDoc.getElementById(previewStyleId)) {
         const variantStyle = iframeDoc.createElement("style");
         variantStyle.id = previewStyleId;
         variantStyle.textContent = `
/* ============================
   1) Fallback (Tailwind 변형 클래스가 없을 때만)
   ============================ */
.ex-tw-preview:hover:not([class*="hover:"]) {
  background-color: var(--tw-hover-bg-color);
  color:            var(--tw-hover-text-color);
  border-color:     var(--tw-hover-border-color);
}
.ex-tw-preview:active:not([class*="active:"]) {
  background-color: var(--tw-active-bg-color);
  color:            var(--tw-active-text-color);
  border-color:     var(--tw-active-border-color);
}
.ex-tw-preview:focus:not([class*="focus:"]) {
  background-color: var(--tw-focus-bg-color);
  color:            var(--tw-focus-text-color);
  border-color:     var(--tw-focus-border-color);
  outline: 2px solid var(--tw-focus-outline-color, transparent);
  outline-offset: 2px;
}
.ex-tw-preview:disabled:not([class*="disabled:"]) {
  background-color: var(--tw-disabled-bg-color);
  color:            var(--tw-disabled-text-color);
  border-color:     var(--tw-disabled-border-color);
}

/* ============================
   2) Override (가변값이 설정된 경우)
   - Tailwind 클래스보다 강하게 적용 (단, 동일 상태에 한함)
   ============================ */
.ex-tw-preview.ex-ov-hover-bg:hover {
  background-color: var(--tw-hover-bg-color) !important;
}
.ex-tw-preview.ex-ov-hover-text:hover {
  color: var(--tw-hover-text-color) !important;
}
.ex-tw-preview.ex-ov-hover-bc:hover {
  border-color: var(--tw-hover-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-active-bg:active {
  background-color: var(--tw-active-bg-color) !important;
}
.ex-tw-preview.ex-ov-active-text:active {
  color: var(--tw-active-text-color) !important;
}
.ex-tw-preview.ex-ov-active-bc:active {
  border-color: var(--tw-active-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-focus-bg:focus {
  background-color: var(--tw-focus-bg-color) !important;
}
.ex-tw-preview.ex-ov-focus-text:focus {
  color: var(--tw-focus-text-color) !important;
}
.ex-tw-preview.ex-ov-focus-bc:focus {
  border-color: var(--tw-focus-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-disabled-bg:disabled {
  background-color: var(--tw-disabled-bg-color) !important;
}
.ex-tw-preview.ex-ov-disabled-text:disabled {
  color: var(--tw-disabled-text-color) !important;
}
.ex-tw-preview.ex-ov-disabled-bc:disabled {
  border-color: var(--tw-disabled-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-hover-ring:hover {
  --tw-ring-color: var(--tw-hover-ring-color) !important;
}
.ex-tw-preview.ex-ov-active-ring:active {
  --tw-ring-color: var(--tw-active-ring-color) !important;
}
.ex-tw-preview.ex-ov-focus-ring:focus {
  --tw-ring-color: var(--tw-focus-ring-color) !important;
}
.ex-tw-preview.ex-ov-disabled-ring:disabled {
  --tw-ring-color: var(--tw-disabled-ring-color) !important;
}
`;

         iframeDoc.head.appendChild(variantStyle);
      }
      //border 가 none으로 고정되어있어서 일단 강제로 스타일 생성
      const fixBorder = iframeDoc.createElement("style");
      fixBorder.textContent = `
  *, ::before, ::after {
    border-style: solid !important;
  }
`;
      iframeDoc.head.appendChild(fixBorder);

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
      clone.style.pointerEvents = "auto";
      clone.style.margin = "0";
      clone.style.display = "block";
      clone.style.position = "relative";
      clone.classList.add("ex-tw-color-scope", "ex-tw-preview");

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
         } catch {
            console.error("setproperty error");
         }
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
      clone.removeAttribute("href");
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
         onMouseDown={() => {
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
                        <div className="ex-tw-flex ex-tw-justify-between">
                           <span>{evt}</span>
                        </div>
                        <ClassInput type={evt} preview={previewClone} />
                     </h3>
                  </div>
               ))}
         </div>
      </div>
   );
}
