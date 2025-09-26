import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initInspector } from "./inspector";
import Popover from "../components/Popover";
import tailwindCss from "../tailwind.css?inline";

// 1. 호스트 엘리먼트 만들기
const host = document.createElement("div");
host.id = "tw-panel-root";
document.body.appendChild(host);

// 2. Shadow Root 붙이기
const shadow = host.attachShadow({ mode: "open" });

const styleEl = document.createElement("style");
styleEl.textContent = tailwindCss;
shadow.appendChild(styleEl);

// 4. React 마운트 컨테이너 추가
const shadowContainer = document.createElement("div");
shadow.appendChild(shadowContainer);

// 5. React Root 연결
const root = createRoot(shadowContainer);

function App() {
   const [target, setTarget] = useState<HTMLElement | null>(null);

   useEffect(() => {
      initInspector(setTarget);
   }, []);

   if (!target) return null;

   return (
      <div>
         <Popover target={target} onClose={() => setTarget(null)} />
      </div>
   );
}

root.render(<App />);
