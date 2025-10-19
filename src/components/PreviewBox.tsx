// src/components/PreviewPortal.tsx
import { useEffect } from "react";

export default function PreviewPortal({ target }: { target: HTMLElement }) {
   useEffect(() => {
      if (!target) return;

      const existing = document.getElementById("ex-tw-preview-portal");
      if (existing) existing.remove();

      const rect = target.getBoundingClientRect();
      const clone = target.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.style.pointerEvents = "auto";
      clone.style.position = "relative";
      clone.style.margin = "auto";

      const container = document.createElement("div");
      container.id = "ex-tw-preview-portal";
      Object.assign(container.style, {
         position: "fixed",
         top: `${rect.bottom + window.scrollY + 16}px`,
         left: `${rect.left + window.scrollX}px`,
         zIndex: "999999",
         background: "#fff",
         border: "1px solid rgba(0,0,0,0.1)",
         borderRadius: "8px",
         padding: "12px",
         boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      });

      container.appendChild(clone);
      document.body.appendChild(container);

      return () => container.remove();
   }, [target]);

   return null;
}
