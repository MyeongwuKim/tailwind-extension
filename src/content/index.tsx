import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import Popover from "../components/Popover";
import tailwindCss from "../tailwind.css?inline";
import { injectFonts } from "../content/fontLoader";
import { initInspector } from "../content/inspector";

/* ==================================================================================
   1️⃣ iframe 기반 렌더링 컨테이너 생성
   ================================================================================== */

const iframe = document.createElement("iframe");
iframe.id = "tw-inspector-iframe";

Object.assign(iframe.style, {
   position: "absolute",
   top: "0",
   left: "0",
   zIndex: "2147483647",
   border: "none",
   background: "transparent",
   pointerEvents: "none", // 기본은 비활성화
});

document.body.appendChild(iframe);

// iframe 문서 초기화
const iframeDoc = iframe.contentDocument!;
iframeDoc.open();
iframeDoc.write("<!DOCTYPE html><html><head></head><body></body></html>");
iframeDoc.close();

// Tailwind CSS 주입
const styleEl = iframeDoc.createElement("style");
styleEl.textContent = tailwindCss;
iframeDoc.head.appendChild(styleEl);

// Reset 스타일 삽입
const resetEl = iframeDoc.createElement("style");
resetEl.textContent = `
  html, body {
    margin: 0;
    padding: 0;
    font-size: 16px !important;
    font-family: system-ui, sans-serif;
    line-height: 1.5;
    background: transparent;
    transform: none !important;
    zoom: 1 !important;
  }

  * {
    box-sizing: border-box;
  }
`;
iframeDoc.head.appendChild(resetEl);

// Theme 변수 삽입
const themeVars = iframeDoc.createElement("style");
themeVars.textContent = `
  :root {
    --color-background1: #fff;
    --color-text1: #212529;
    --color-text2: #495057;
    --color-text3: #868e96;
    --color-text4: #ced4da;
    --color-border1: #dee2e6;
  }

  :root.dark {
    --color-background1: #374151;
    --color-text1: #ececec;
    --color-text2: #d9d9d9;
    --color-text3: #acacac;
    --color-text4: #595959;
    --color-border1: #4d4d4d;
  }
`;
iframeDoc.head.appendChild(themeVars);

// 폰트 주입 (Inter 등)
injectFonts(iframeDoc);

// React 마운트 컨테이너
const mountEl = iframeDoc.createElement("div");
iframeDoc.body.appendChild(mountEl);

/* ==================================================================================
   2️⃣ React App 정의
   ================================================================================== */

function App() {
   const [target, setTarget] = useState<HTMLElement | null>(null);

   // ✅ 인스펙터 초기화 (요소 클릭 → target 설정)
   useEffect(() => {
      initInspector(setTarget);
   }, []);

   // ✅ Popover 위치 및 외부 클릭 제어
   useEffect(() => {
      if (!target) {
         iframe.style.pointerEvents = "none";
         iframe.style.width = "0";
         iframe.style.height = "0";
         return;
      }

      // 위치 계산
      const rect = target.getBoundingClientRect();
      const popoverWidth = 400;
      const popoverHeight = 400;

      const top = rect.bottom + window.scrollY + 8;
      const left = rect.left + window.scrollX + rect.width / 2 - popoverWidth / 2;

      Object.assign(iframe.style, {
         pointerEvents: "auto",
         width: `${popoverWidth}px`,
         height: `${popoverHeight}px`,
         top: `${top}px`,
         left: `${left}px`,
      });

      // ✅ 외부 클릭 시 닫기
      const handleOutsideClick = (e: MouseEvent) => {
         const clickedInsideIframe =
            iframe.contentDocument?.contains(e.target as Node) || iframe.contains(e.target as Node);
         if (!clickedInsideIframe) setTarget(null);
      };

      // ✅ 내부 클릭 시 닫히지 않게 막기
      const stopInsideClick = (e: MouseEvent) => e.stopPropagation();
      iframeDoc.addEventListener("mousedown", stopInsideClick, true);

      window.addEventListener("mousedown", handleOutsideClick, true);
      return () => {
         window.removeEventListener("mousedown", handleOutsideClick, true);
         iframeDoc.removeEventListener("mousedown", stopInsideClick, true);
      };
   }, [target]);

   if (!target) return null;

   return (
      <div className="font-inter">
         <Popover target={target} />
      </div>
   );
}

/* ==================================================================================
   3️⃣ React Root 생성 및 마운트
   ================================================================================== */

const root = createRoot(mountEl);
root.render(<App />);
