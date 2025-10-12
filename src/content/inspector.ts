import { logger } from "../hooks/useUtils";

let overlay: HTMLDivElement | null = null;
let label: HTMLDivElement | null = null; // 👈 tagname 표시용 라벨 추가
let blocker: HTMLDivElement | null = null;

export function initInspector(setTarget: (el: HTMLElement) => void) {
   logger("initInspector");

   // 🔸 이미 실행 중이면 중복 방지
   if (blocker) {
      logger("inspector already active");
      return;
   }

   // ================= stop =================
   function stopInspector() {
      blocker?.remove();
      blocker = null;
      overlay?.remove();
      overlay = null;
      label?.remove();
      label = null;

      document.removeEventListener("mousemove", handleMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      logger("[inspector] stopped");
   }

   // ================= handlers =================
   function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") stopInspector();
   }

   function handleClick(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();

      const candidates = document.elementsFromPoint(e.clientX, e.clientY);
      const el = candidates.find((n) => n !== blocker && n !== overlay && n !== label) as
         | HTMLElement
         | undefined;

      if (el) {
         logger("[inspector] clicked element:", el.tagName);
         setTarget(el);
      }
      stopInspector();
   }

   function handleMove(e: MouseEvent) {
      const candidates = document.elementsFromPoint(e.clientX, e.clientY);
      const el = candidates.find((n) => n !== blocker && n !== overlay && n !== label) as
         | HTMLElement
         | undefined;

      if (!el) {
         if (overlay) overlay.style.display = "none";
         if (label) label.style.display = "none";
         return;
      }

      const rect = el.getBoundingClientRect();
      showOverlay(rect, el);
   }

   // ================= overlay =================
   function showOverlay(rect: DOMRect, el: HTMLElement) {
      if (!overlay) {
         overlay = document.createElement("div");
         Object.assign(overlay.style, {
            position: "fixed",
            pointerEvents: "none",
            zIndex: "1000000",
            boxSizing: "border-box",
            transition: "top 0.05s, left 0.05s, width 0.05s, height 0.05s",
         });
         document.body.appendChild(overlay);
      }

      // 위치 / 스타일 업데이트
      Object.assign(overlay.style, {
         display: "block",
         top: `${Math.max(0, rect.top)}px`,
         left: `${Math.max(0, rect.left)}px`,
         width: `${Math.max(0, rect.width)}px`,
         height: `${Math.max(0, rect.height)}px`,
         border: "2px solid magenta",
         background: "rgba(255,0,255,0.12)",
         mixBlendMode: "difference",
      });

      // 라벨
      if (!label) {
         label = document.createElement("div");
         Object.assign(label.style, {
            position: "fixed",
            zIndex: "1000001",
            pointerEvents: "none",
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#fff",
            background: "rgba(0,0,0,0.75)",
            padding: "2px 6px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
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

      const labelHeight = 20;
      const top = rect.top > labelHeight + 4 ? rect.top - labelHeight - 4 : rect.bottom + 4;

      Object.assign(label.style, {
         top: `${Math.max(0, top)}px`,
         left: `${Math.max(0, rect.left)}px`,
         display: "block",
      });
   }

   // ================= 실행 즉시 오버레이 시작 =================
   blocker = document.createElement("div");
   Object.assign(blocker.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "999998",
      background: "transparent",
      cursor: "crosshair",
      pointerEvents: "auto",
   });
   document.body.appendChild(blocker);

   document.addEventListener("mousemove", handleMove, true);
   document.addEventListener("click", handleClick, true);
   document.addEventListener("keydown", handleKeyDown, true);

   logger("[inspector] started");
}
