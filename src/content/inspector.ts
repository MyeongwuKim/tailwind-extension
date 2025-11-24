import { INITIAL_CONFIG } from "../constants/define";
import { logger, hexToRgb } from "../hooks/useUtils";

let overlay: HTMLDivElement | null = null;
let label: HTMLDivElement | null = null;
let blocker: HTMLDivElement | null = null;
let colorProps = INITIAL_CONFIG;

chrome.storage.local.get(
   [
      "overlayBorder",
      "overlayBg",
      "overlayBorderOpacity",
      "overlayBgOpacity",
      "labelText",
      "labelBg",
      "labelTextOpacity",
      "labelBgOpacity",
   ],
   (res) => {
      colorProps = {
         ...INITIAL_CONFIG,
         ...res, // 저장된 값으로 덮어쓰기
      };

      // 이미 overlay가 있다면 즉시 업데이트
      updateStyles();
   }
);

function updateStyles() {
   if (overlay) {
      const bg = hexToRgb(colorProps.overlayBg);
      const border = hexToRgb(colorProps.overlayBorder);

      overlay.style.background = `rgba(${bg.r},${bg.g},${bg.b},${colorProps.overlayBgOpacity})`;
      overlay.style.border = `2px solid rgba(${border.r},${border.g},${border.b},${colorProps.overlayBorderOpacity})`;
   }

   if (label) {
      const bg = hexToRgb(colorProps.labelBg);
      const text = hexToRgb(colorProps.labelText);

      label.style.background = `rgba(${bg.r},${bg.g},${bg.b},${colorProps.labelBgOpacity})`;
      label.style.color = `rgba(${text.r},${text.g},${text.b},${colorProps.labelTextOpacity})`;
   }
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

   if (changes.overlayBorderOpacity) {
      const newBorder = changes.overlayBorderOpacity.newValue;
      colorProps.overlayBorderOpacity = newBorder;
   }
   if (changes.overlayBgOpacity) {
      const newBg = changes.overlayBgOpacity.newValue;
      colorProps.overlayBgOpacity = newBg;
   }

   if (changes.labelText) {
      const newBorder = changes.labelText.newValue;
      colorProps.labelText = newBorder;
   }
   if (changes.labelTextOpacity) {
      const newBg = changes.labelTextOpacity.newValue;
      colorProps.labelTextOpacity = newBg;
   }
   if (changes.labelBg) {
      const newBorder = changes.labelBg.newValue;
      colorProps.labelBg = newBorder;
   }
   if (changes.labelBgOpacity) {
      const newBg = changes.labelBgOpacity.newValue;
      colorProps.labelBgOpacity = newBg;
   }

   updateStyles();
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
            border: `2px solid rgba(${border_rgb.r},${border_rgb.g},${border_rgb.b},${colorProps.overlayBorderOpacity})`,
            background: `rgba(${bg_rgb.r},${bg_rgb.g},${bg_rgb.b},${colorProps.overlayBgOpacity})`,
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
         const bg_rgb = hexToRgb(colorProps.labelBg);
         const text_rgb = hexToRgb(colorProps.labelText);

         label = document.createElement("div");
         Object.assign(label.style, {
            position: "absolute",
            zIndex: "1000000",
            fontFamily: "monospace",
            fontSize: "14px",
            color: `rgba(${text_rgb.r},${text_rgb.g},${text_rgb.b},${colorProps.labelTextOpacity})`,
            background: `rgba(${bg_rgb.r},${bg_rgb.g},${bg_rgb.b},${colorProps.labelBgOpacity})`,
            padding: "2px 5px",
            borderRadius: "3px",
            maxWidth: "300px", // ⚡ 최대 너비 지정
            whiteSpace: "normal", // ⚡ 줄바꿈 가능하게
            wordBreak: "break-all", // ⚡ 긴 className도 잘 잘림
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
