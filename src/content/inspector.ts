import { INITIAL_CONFIG } from "../constants/define";
import { logger } from "../hooks/useUtils";

let overlay: HTMLDivElement | null = null;
let label: HTMLDivElement | null = null;
let blocker: HTMLDivElement | null = null;
let colorProps = INITIAL_CONFIG;

function hexToRgb(hex: string) {
   hex = hex.replace("#", "");

   // 3자리 (#fff) → 6자리로 확장
   if (hex.length === 3) {
      hex = hex
         .split("")
         .map((c) => c + c)
         .join("");
   }

   const r = parseInt(hex.substring(0, 2), 16);
   const g = parseInt(hex.substring(2, 4), 16);
   const b = parseInt(hex.substring(4, 6), 16);

   return { r, g, b };
}

chrome.storage.onChanged.addListener((changes, area) => {
   if (area !== "local") return;

   if (changes.overlayBorder) {
      const newBorder = changes.overlayBorder.newValue;
      colorProps.overlayBorder = newBorder;
   }
   if (changes.overlayBg) {
      const newBg = changes.overlayBg.newValue;
      colorProps.overlayBg = newBg;
   }
});

export function removeInspectorInfo() {
   overlay?.remove();
   overlay = null;
   label?.remove();
   label = null;
}

export function initInspector(setTarget: (el: HTMLElement) => void) {
   logger("initInspector (main doc)");

   if (blocker) return;

   function stopInspector() {
      blocker?.remove();
      blocker = null;

      document.removeEventListener("mousemove", handleMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      logger("[inspector] stopped");
   }

   function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
         stopInspector();
         removeInspectorInfo();
      }
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
         const bg_rgb = hexToRgb(colorProps.overlayBg);
         const border_rgb = hexToRgb(colorProps.overlayBorder);
         Object.assign(overlay.style, {
            position: "absolute",
            zIndex: "999999",
            pointerEvents: "none",
            border: `2px solid rgba(${border_rgb.r},${border_rgb.g},${border_rgb.b},1)`,
            background: `rgba(${bg_rgb.r},${bg_rgb.g},${bg_rgb.b},0.1)`,
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
            whiteSpace: "nowrap", // 긴 텍스트 한 줄로
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

      // ✅ label 높이 계산해서 그만큼 위로 올림
      const labelHeight = label.offsetHeight || 20;
      const top = rect.top + window.scrollY - labelHeight - 8; // 8px 여백

      Object.assign(label.style, {
         top: `${Math.max(top, 0)}px`, // 화면 위로 벗어나지 않게 보정
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
