import { logger } from "../hooks/useUtils";

let overlay: HTMLDivElement | null = null;
let label: HTMLDivElement | null = null;
let blocker: HTMLDivElement | null = null;

export function removeInspectorInfo() {
   overlay?.remove();
   overlay = null;
   label?.remove();
   label = null;
   blocker?.remove();
   blocker = null;
}

export function initInspector(setTarget: (el: HTMLElement) => void) {
   logger("initInspector (main doc)");

   if (blocker) return;

   function stopInspector() {
      document.removeEventListener("mousemove", handleMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      logger("[inspector] stopped");
   }

   function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") stopInspector();
   }

   function handleClick(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();

      if (overlay) overlay.style.backgroundColor = "transparent";
      const el = document
         .elementsFromPoint(e.clientX, e.clientY)
         .find((n) => n !== blocker && n !== overlay && n !== label) as HTMLElement | undefined;

      if (el) {
         setTarget(el);
      }

      stopInspector();
   }

   function handleMove(e: MouseEvent) {
      const el = document
         .elementsFromPoint(e.clientX, e.clientY)
         .find((n) => n !== blocker && n !== overlay && n !== label) as HTMLElement | undefined;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      showOverlay(rect, el);
   }

   function showOverlay(rect: DOMRect, el: HTMLElement) {
      if (!overlay) {
         overlay = document.createElement("div");
         Object.assign(overlay.style, {
            position: "absolute",
            zIndex: "999999",
            pointerEvents: "none",
            border: "2px solid magenta",
            background: "rgba(255,0,255,0.1)",
         });
         document.body.appendChild(overlay);
      }
      Object.assign(overlay.style, {
         top: `${rect.top + window.scrollY}px`,
         left: `${rect.left + window.scrollX}px`,
         width: `${rect.width}px`,
         height: `${rect.height}px`,
      });

      if (!label) {
         label = document.createElement("div");
         Object.assign(label.style, {
            position: "absolute",
            zIndex: "1000000",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#fff",
            background: "rgba(0,0,0,0.8)",
            padding: "2px 5px",
            borderRadius: "3px",
         });
         document.body.appendChild(label);
      }
      const tag = el.tagName.toLowerCase();
      const siblings = el.parentElement
         ? Array.from(el.parentElement.children).filter((child) => child.tagName === el.tagName)
         : [];
      const index = siblings.indexOf(el);
      const id = el.id ? `#${el.id}` : `#${index}`;
      const classes = el.classList.length ? "." + Array.from(el.classList).join(".") : "";

      label.textContent = `${tag}${id}${classes}`;

      Object.assign(label.style, {
         top: `${rect.top + window.scrollY - 20}px`,
         left: `${rect.left + window.scrollX}px`,
      });
   }

   blocker = document.createElement("div");
   Object.assign(blocker.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "transparent",
      cursor: "crosshair",
      zIndex: "999998",
   });
   document.body.appendChild(blocker);

   document.addEventListener("mousemove", handleMove, true);
   document.addEventListener("click", handleClick, true);
   document.addEventListener("keydown", handleKeyDown, true);

   logger("[inspector] started");
}
