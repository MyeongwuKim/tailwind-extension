// src/content/index.tsx
import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";

import ConverterPopover from "./apps/converter";
import TesterPopover from "./apps/tester";
import tailwindCss from "../tailwind.css?inline";
import { injectFonts } from "../content/fontLoader";
import { initInspector, removeInspectorInfo } from "../content/inspector";
import { logger } from "../hooks/useUtils";

/* ==================================================================================
   iframe (모달 + 배경 블러)
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

      display: "none", // ✅ 처음에는 완전 숨김
      pointerEvents: "none",
   });
   document.body.appendChild(iframe);

   const iframeDoc = iframe.contentDocument!;
   iframeDoc.open();
   iframeDoc.write("<!DOCTYPE html><html><head></head><body></body></html>");
   iframeDoc.close();

   // Tailwind & 폰트
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

const style = document.createElement("link");
style.id = "ex-tw-tester";
style.rel = "stylesheet";
style.href = chrome.runtime.getURL("assets/tw-meta.built.css");
document.head.appendChild(style);

const { iframe, iframeDoc, mountEl } = createInspectorIframe();

/* ==================================================================================
   React App
   ================================================================================== */
type ModeType = "converter" | "tester" | null;

function App() {
   const [modeProps, setModeProps] = useState<{ mode: ModeType; width: number; height: number }>({
      mode: null,
      width: 0,
      height: 0,
   });
   const [target, setTarget] = useState<HTMLElement | null>(null);
   const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
   const [dragging, setDragging] = useState(false);
   const dragOffset = useRef({ x: 0, y: 0 });

   /* ===== background → 메시지 수신 ===== */
   useEffect(() => {
      const listener = (msg: any) => {
         if (msg.action === "startConverter") {
            logger("▶️ startConverter");
            initInspector((el) => {
               const rect = el.getBoundingClientRect();
               const popoverWidth = 400;
               const popoverHeight = 400;
               const top = rect.bottom + 8; // ✅ scrollY 제거
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

   useEffect(() => {
      if (modeProps.mode) {
         document.body.style.overflow = "hidden"; // ✅ 스크롤 막기
      } else {
         document.body.style.overflow = "auto"; // ✅ 다시 허용
      }

      return () => {
         document.body.style.overflow = "auto";
      };
   }, [modeProps.mode]);
   /* ===== 팝오버 외부 클릭 시 닫기 ===== */
   useEffect(() => {}, []);

   /* ==================================================================================
      🔹 드래그 로직 (handle 내부 영역에서만)
   ================================================================================== */
   useEffect(() => {
      if (!iframeDoc) return;

      const handleMouseDown = (e: MouseEvent) => {
         const t = e.target as HTMLElement;
         if (!t.closest("#tw-drag-handle")) return; // ✅ 드래그 핸들이 아니면 무시
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
         {/* ① 클릭 감지용 패널 (투명 or 반투명) */}
         <div
            id="tw-popup-panel"
            className="ex-tw-fixed inset-0 ex-tw-bg-transparent ex-tw-z-[2147483645] ex-tw-w-full ex-tw-h-full"
            onMouseDown={() => {
               // 팝업 닫기
               setModeProps({ mode: null, width: 0, height: 0 });
               setTarget(null);
               setPos(null);
               removeInspectorInfo();
               iframe.style.display = "none";
               iframe.style.pointerEvents = "none";
            }}
         />

         {/* ② 실제 팝업 */}
         <div
            id="tw-popup-container"
            className="ex-tw-absolute ex-tw-bg-white ex-tw-rounded-2xl ex-tw-shadow-2xl 
                 ex-tw-border ex-tw-border-gray-200 
                 ex-tw-z-[2147483646]"
            style={{
               width: modeProps.width,
               height: modeProps.height,
               top: pos.top,
               left: pos.left,
               cursor: dragging ? "grabbing" : "default",
            }}
         >
            {modeProps.mode === "converter" && <ConverterPopover target={target} />}
            {modeProps.mode === "tester" && <TesterPopover target={target} />}
         </div>
      </>
   );
}

/* ==================================================================================
   React Root
   ================================================================================== */
const root = createRoot(mountEl);
root.render(<App />);
