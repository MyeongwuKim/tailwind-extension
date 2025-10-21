import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";

import ConverterPopover from "./apps/converter";
import TesterPopover from "./apps/tester";
import tailwindCss from "../tailwind.css?inline";
import { injectFonts } from "../content/fontLoader";
import { initInspector, removeInspectorInfo } from "../content/inspector";
import { logger } from "../hooks/useUtils";

/* ==================================================================================
   iframe 생성
   ================================================================================== */
function createInspectorIframe() {
   const iframe = document.createElement("iframe");
   iframe.id = "tw-inspector-iframe";

   Object.assign(iframe.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      border: "none",
      width: "100vw",
      height: "100vh",
      display: "none",
      pointerEvents: "none",
   });
   document.body.appendChild(iframe);

   const iframeDoc = iframe.contentDocument!;
   iframeDoc.open();
   iframeDoc.write("<!DOCTYPE html><html><head></head><body></body></html>");
   iframeDoc.close();

   // Tailwind & Meta CSS 주입
   const styleEl = iframeDoc.createElement("style");
   styleEl.textContent = tailwindCss;
   iframeDoc.head.appendChild(styleEl);

   injectFonts(iframeDoc);

   const resetEl = iframeDoc.createElement("style");
   resetEl.textContent = `
    html, body {
      margin: 0; padding: 0;
      background: transparent;
      overflow: hidden;
      width: 100%; height: 100%;
    }
    * { box-sizing: border-box; }
  `;
   iframeDoc.head.appendChild(resetEl);

   const mountEl = iframeDoc.createElement("div");
   iframeDoc.body.appendChild(mountEl);

   return { iframe, iframeDoc, mountEl };
}

const { iframe, iframeDoc, mountEl } = createInspectorIframe();

/* ==================================================================================
   React App
   ================================================================================== */
type ModeType = "converter" | "tester" | null;

export function App() {
   const [modeProps, setModeProps] = useState<{ mode: ModeType; width: number; height: number }>({
      mode: null,
      width: 0,
      height: 0,
   });
   const [target, setTarget] = useState<HTMLElement | null>(null);
   const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
   const [dragging, setDragging] = useState(false);
   const dragOffset = useRef({ x: 0, y: 0 });

   /* ==================================================================================
     background → 메시지 수신
  ================================================================================== */
   useEffect(() => {
      const listener = (msg: any) => {
         if (msg.action === "startConverter") {
            logger("▶️ startConverter");
            initInspector((el) => {
               const rect = el.getBoundingClientRect();
               const popoverWidth = 400;
               const popoverHeight = 400;

               const top = rect.bottom + 8;
               const left = rect.left + rect.width / 2 - popoverWidth / 2;

               setPos({ top, left });
               setTarget(el);
               setModeProps({ mode: "converter", width: popoverWidth, height: popoverHeight });

               iframe.style.display = "block";
               iframe.style.pointerEvents = "auto";
            });
         }

         if (msg.action === "startTester") {
            logger("▶️ startTester");
            initInspector((el) => {
               const rect = el.getBoundingClientRect();
               const popoverWidth = 400;
               const popoverHeight = 430;

               const top = rect.bottom + 8;
               const left = rect.left + rect.width / 2 - popoverWidth / 2;

               setPos({ top, left });
               setTarget(el);
               setModeProps({ mode: "tester", width: popoverWidth, height: popoverHeight });

               iframe.style.display = "block";
               iframe.style.pointerEvents = "auto";
            });
         }
      };

      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
   }, []);

   /* ==================================================================================
     스크롤 시 위치 갱신 (드래그한 위치 유지)
  ================================================================================== */
   useEffect(() => {
      if (!pos) return;

      let lastScrollY = window.scrollY;
      let lastScrollX = window.scrollX;

      const handleScroll = () => {
         if (dragging) return; // 드래그 중이면 무시

         const deltaY = window.scrollY - lastScrollY;
         const deltaX = window.scrollX - lastScrollX;
         lastScrollY = window.scrollY;
         lastScrollX = window.scrollX;

         // ✅ 스크롤 이동량만큼 현재 위치 보정 (드래그한 위치 그대로 유지)
         setPos((prev) =>
            prev
               ? {
                    top: prev.top - deltaY,
                    left: prev.left - deltaX,
                 }
               : prev
         );
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
   }, [dragging, pos]);

   /* ==================================================================================
     드래그 로직
  ================================================================================== */
   useEffect(() => {
      if (!iframeDoc) return;

      const handleMouseDown = (e: MouseEvent) => {
         const t = e.target as HTMLElement;
         if (!t.closest("#tw-drag-handle")) return;
         e.preventDefault();
         e.stopPropagation();

         const popup = iframeDoc.querySelector("#tw-popup-container") as HTMLElement | null;
         if (!popup) return;

         setDragging(true);
         const rect = popup.getBoundingClientRect();
         dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
         };
      };

      const handleMouseMove = (e: MouseEvent) => {
         if (!dragging) return;
         e.preventDefault();
         setPos({
            top: e.clientY - dragOffset.current.y,
            left: e.clientX - dragOffset.current.x,
         });
      };

      const handleMouseUp = () => setDragging(false);

      iframeDoc.addEventListener("mousedown", handleMouseDown, true);
      iframeDoc.addEventListener("mousemove", handleMouseMove, true);
      iframeDoc.addEventListener("mouseup", handleMouseUp, true);

      return () => {
         iframeDoc.removeEventListener("mousedown", handleMouseDown, true);
         iframeDoc.removeEventListener("mousemove", handleMouseMove, true);
         iframeDoc.removeEventListener("mouseup", handleMouseUp, true);
      };
   }, [dragging, iframeDoc]);

   /* ==================================================================================
     렌더
  ================================================================================== */
   if (!modeProps.mode || !target || !pos) return null;

   return (
      <>
         {/* 백드롭 패널 */}
         <div
            id="tw-popup-panel"
            className="ex-tw-absolute ex-tw-bg-transparent ex-tw-z-[2147483645] ex-tw-w-full ex-tw-h-full"
            onMouseDown={() => {
               setModeProps({ mode: null, width: 0, height: 0 });
               setTarget(null);
               setPos(null);
               removeInspectorInfo();
               iframe.style.display = "none";
               iframe.style.pointerEvents = "none";
            }}
         />

         {/* 팝업 본체 */}
         <div
            id="tw-popup-container"
            className="ex-tw-absolute ex-tw-bg-white ex-tw-rounded-2xl ex-tw-shadow-2xl 
                   ex-tw-border ex-tw-border-gray-200 ex-tw-z-[2147483646]"
            style={{
               width: modeProps.width,
               height: modeProps.height,
               top: pos.top,
               left: pos.left,
               cursor: dragging ? "grabbing" : "default",
            }}
         >
            {modeProps.mode === "converter" && <ConverterPopover target={target} />}
            {modeProps.mode === "tester" && <TesterPopover target={target} iframeDoc={iframeDoc} />}
         </div>
      </>
   );
}

/* ==================================================================================
   React Root
   ================================================================================== */
const root = createRoot(mountEl);
root.render(<App />);
