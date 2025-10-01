let overlay: HTMLDivElement | null = null;
let blocker: HTMLDivElement | null = null;

export function initInspector(setTarget: (el: HTMLElement) => void) {
   function stopInspector() {
      if (blocker) {
         blocker.remove();
         blocker = null;
      }
      if (overlay) {
         overlay.remove();
         overlay = null;
      }
      document.removeEventListener("mousemove", handleMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      console.log("[inspector] stopped");
   }

   function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") stopInspector();
   }

   // 클릭 처리: elementsFromPoint로 실제 밑의 엘리먼트 찾아 선택
   function handleClick(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();

      const candidates = document.elementsFromPoint(e.clientX, e.clientY);
      if (!candidates || candidates.length === 0) {
         console.log("[inspector] click: no candidates");
         stopInspector();
         return;
      }

      // blocker/overlay 제외한 첫 유효 요소 찾기
      const el = candidates.find((n) => n !== blocker && n !== overlay) as HTMLElement | undefined;
      if (el) {
         console.log("[inspector] clicked element:", el.tagName, el);
         setTarget(el);
      } else {
         console.log("[inspector] clicked: no valid element (only blocker/overlay)");
      }

      stopInspector();
   }

   // 마우스 이동 처리: elementsFromPoint로 밑 엘리먼트 찾아 overlay 위치 갱신
   function handleMove(e: MouseEvent) {
      const candidates = document.elementsFromPoint(e.clientX, e.clientY);
      if (!candidates || candidates.length === 0) {
         if (overlay) overlay.style.display = "none";
         return;
      }

      const el = candidates.find((n) => n !== blocker && n !== overlay) as HTMLElement | undefined;
      if (!el) {
         if (overlay) overlay.style.display = "none";
         return;
      }

      // 디버그 로그(원하면 주석 처리)
      // console.log("[inspector] hover element:", el.tagName, el);

      const rect = el.getBoundingClientRect();
      showOverlay(rect);
   }

   function showOverlay(rect: DOMRect) {
      if (!overlay) {
         overlay = document.createElement("div");
         overlay.style.position = "fixed";
         overlay.style.pointerEvents = "none"; // 하이라이트는 이벤트 통과
         overlay.style.zIndex = "1000000"; // blocker(999998)보다 위
         overlay.style.boxSizing = "border-box";
         overlay.style.transition = "top 0.05s, left 0.05s, width 0.05s, height 0.05s"; // 부드럽게
         document.body.appendChild(overlay);
      }
      overlay.style.display = "block";
      overlay.style.top = `${Math.max(0, rect.top)}px`;
      overlay.style.left = `${Math.max(0, rect.left)}px`;
      overlay.style.width = `${Math.max(0, rect.width)}px`;
      overlay.style.height = `${Math.max(0, rect.height)}px`;
      overlay.style.border = "2px solid magenta";
      overlay.style.background = "rgba(255,0,255,0.12)";
      overlay.style.mixBlendMode = "difference";
   }

   // 메시지로 시작 신호 받기
   chrome.runtime.onMessage.addListener(function listener(msg) {
      if (msg?.action !== "startInspector") return;

      // 이미 실행중이면 무시
      if (blocker) return;

      // 1) blocker 생성 (hover 스타일 차단용)
      blocker = document.createElement("div");
      blocker.style.position = "fixed";
      blocker.style.top = "0";
      blocker.style.left = "0";
      blocker.style.width = "100vw";
      blocker.style.height = "100vh";
      blocker.style.zIndex = "999998";
      blocker.style.background = "transparent";
      blocker.style.cursor = "crosshair";
      // blocker은 이벤트를 받아야 하므로 pointerEvents auto
      blocker.style.pointerEvents = "auto";
      document.body.appendChild(blocker);

      // 2) 이벤트는 document에서 잡기 (capture true)
      document.addEventListener("mousemove", handleMove, true);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleKeyDown, true);

      console.log("[inspector] started");
   });
}
