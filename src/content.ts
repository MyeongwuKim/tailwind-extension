let inspectorEnabled = false;
let overlay: HTMLDivElement | null = null;

chrome.runtime.onMessage.addListener((msg) => {
   if (msg.action === "toggle") {
      inspectorEnabled = msg.enabled;
      if (inspectorEnabled) startInspector();
      else stopInspector();
   }
});

function startInspector() {
   console.log("✅ Inspector ON");
   document.addEventListener("mouseover", highlightElement, true);
   document.addEventListener("click", blockClick, true);
}

function stopInspector() {
   console.log("❌ Inspector OFF");
   document.removeEventListener("mouseover", highlightElement, true);
   document.removeEventListener("click", blockClick, true);
   removeOverlay();
}

function highlightElement(e: MouseEvent) {
   const el = e.target as HTMLElement;
   if (!el || el === overlay) return;

   const rect = el.getBoundingClientRect();

   if (!overlay) {
      overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.pointerEvents = "none"; // 오버레이가 클릭 막지 않음
      overlay.style.zIndex = "999999";
      document.body.appendChild(overlay);
   }

   overlay.style.top = rect.top + "px";
   overlay.style.left = rect.left + "px";
   overlay.style.width = rect.width + "px";
   overlay.style.height = rect.height + "px";
   overlay.style.border = "2px solid red";
   overlay.style.background = "rgba(255,0,0,0.1)";
}

function blockClick(e: MouseEvent) {
   e.preventDefault(); // 기본 동작(링크 이동 등) 막기
   e.stopPropagation(); // 페이지 JS 이벤트 막기
   const el = e.target as HTMLElement;
   console.log("🛑 클릭 차단! 대상:", el);
}

function removeOverlay() {
   if (overlay) {
      overlay.remove();
      overlay = null;
   }
}
