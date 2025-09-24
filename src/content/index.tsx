import "../index.css";
import { createRoot } from "react-dom/client";
import React, { useEffect } from "react";
import Panel from "../components/Panel";
import { initInspector } from "./inspector";

const container = document.createElement("div");
container.id = "tw-panel-root";
document.body.appendChild(container);

const root = createRoot(container);

const App = () => {
   const [target, setTarget] = React.useState<HTMLElement | null>(null);

   React.useEffect(() => {
      initInspector(setTarget);
   }, []);
   useEffect(() => {}, [target]);

   if (!target) return null; // ✅ 기본적으로는 아무것도 안 그림

   return (
      <div
         style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "400px",
            height: "100%",
            zIndex: 999999,
         }}
      >
         <Panel target={target} />
      </div>
   );
};

root.render(<App />);
