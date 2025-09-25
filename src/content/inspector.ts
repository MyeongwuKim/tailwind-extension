let overlay: HTMLDivElement | null = null;

export function initInspector(setTarget: (el: HTMLElement) => void) {
   function handleClick(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();

      setTarget(e.target as HTMLElement);

      // ✅ 오버레이 중단
      document.removeEventListener("mouseover", highlightElement, true);
      document.removeEventListener("click", handleClick, true);

      // ✅ 오버레이 제거
      if (overlay) {
         overlay.remove();
         overlay = null;
      }
   }

   chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "startInspector") {
         console.log("start?!");

         document.addEventListener("mouseover", highlightElement, true);
         document.addEventListener("click", handleClick, true);
      }
   });
}

function highlightElement(e: MouseEvent) {
   const el = e.target as HTMLElement;
   if (!el || el === overlay) return;

   const rect = el.getBoundingClientRect();

   if (!overlay) {
      overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "999999";
      document.body.appendChild(overlay);
   }

   overlay.style.top = rect.top + "px";
   overlay.style.left = rect.left + "px";
   overlay.style.width = rect.width + "px";
   overlay.style.height = rect.height + "px";
   overlay.style.border = "2px solid magenta";
   overlay.style.background = "rgba(255,0,255,0.25)";
   overlay.style.mixBlendMode = "difference";
}
