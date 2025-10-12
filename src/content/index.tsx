import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import ConverterPopover from "./apps/converter";

import tailwindCss from "../tailwind.css?inline";
import { injectFonts } from "../content/fontLoader";
import { initInspector } from "../content/inspector";
import TesterPopover from "./apps/tester";

/* ==================================================================================
   iframe + Tailwind 초기 세팅
   ================================================================================== */
function createInspectorIframe() {
   const iframe = document.createElement("iframe");
   iframe.id = "tw-inspector-iframe";
   Object.assign(iframe.style, {
      position: "absolute",
      top: "0",
      left: "0",
      zIndex: "2147483647",
      border: "none",
      background: "transparent",
      pointerEvents: "none",
   });
   document.body.appendChild(iframe);

   const iframeDoc = iframe.contentDocument!;
   iframeDoc.open();
   iframeDoc.write("<!DOCTYPE html><html><head></head><body></body></html>");
   iframeDoc.close();

   const styleEl = iframeDoc.createElement("style");
   styleEl.textContent = tailwindCss;
   iframeDoc.head.appendChild(styleEl);

   const resetEl = iframeDoc.createElement("style");
   resetEl.textContent = `
      html, body { margin: 0; padding: 0; background: transparent; }
      * { box-sizing: border-box; }
   `;
   iframeDoc.head.appendChild(resetEl);

   injectFonts(iframeDoc);

   const mountEl = iframeDoc.createElement("div");
   iframeDoc.body.appendChild(mountEl);

   return { iframe, iframeDoc, mountEl };
}

const { iframe, iframeDoc, mountEl } = createInspectorIframe();

/* ==================================================================================
   React App
   ================================================================================== */

type ModeType = {
   type: "converter" | "tester";
   width: number;
   height: number;
};
export default function App() {
   const [target, setTarget] = useState<HTMLElement | null>(null);
   const [mode, setMode] = useState<ModeType | null>(null);

   // ✅ background → 메시지 수신 (오버레이는 initInspector 내부에서)
   useEffect(() => {
      const listener = (msg: any) => {
         if (msg.action === "startConverter") {
            setMode({ type: "converter", width: 400, height: 400 });
            initInspector(setTarget);
         }
         if (msg.action === "startTester") {
            setMode({ type: "tester", width: 400, height: 400 });
            initInspector(setTarget);
         }
      };

      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
   }, []);

   // ✅ Popover 위치 및 외부 클릭 제어
   useEffect(() => {
      if (!target) {
         iframe.style.pointerEvents = "none";
         iframe.style.width = "0";
         iframe.style.height = "0";
         return;
      }
      if (!mode) return;

      const rect = target.getBoundingClientRect();
      const width = mode.width;
      const height = mode.height;
      const top = rect.bottom + window.scrollY + 8;
      const left = rect.left + window.scrollX + rect.width / 2 - width / 2;

      Object.assign(iframe.style, {
         pointerEvents: "auto",
         width: `${width}px`,
         height: `${height}px`,
         top: `${top}px`,
         left: `${left}px`,
      });

      const handleOutsideClick = (e: MouseEvent) => {
         const clickedInsideIframe =
            iframe.contentDocument?.contains(e.target as Node) || iframe.contains(e.target as Node);
         if (!clickedInsideIframe) setTarget(null);
      };

      const stopInsideClick = (e: MouseEvent) => e.stopPropagation();
      iframeDoc.addEventListener("mousedown", stopInsideClick, true);
      window.addEventListener("mousedown", handleOutsideClick, true);

      return () => {
         window.removeEventListener("mousedown", handleOutsideClick, true);
         iframeDoc.removeEventListener("mousedown", stopInsideClick, true);
      };
   }, [target]);

   if (!mode || !target) return null;

   return (
      <div className="ex-tw-font-inter">
         {mode.type === "converter" && <ConverterPopover target={target} />}
         {mode.type === "tester" && <TesterPopover target={target} />}
      </div>
   );
}

/* ==================================================================================
   React Root
   ================================================================================== */
const root = createRoot(mountEl);
root.render(<App />);
