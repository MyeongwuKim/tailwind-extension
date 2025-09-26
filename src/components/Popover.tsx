import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function Popover({ target, onClose }: { target: HTMLElement; onClose: () => void }) {
   const popoverRef = useRef<HTMLDivElement>(null);
   const [pos, setPos] = useState({ top: 0, left: 0 });
   const [placement, setPlacement] = useState<"top" | "bottom">("top");

   useLayoutEffect(() => {
      if (!target || !popoverRef.current) return;

      const rect = target.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popRect = popoverRef.current.getBoundingClientRect();

      let top = rect.top + window.scrollY - popRect.height - 8;
      let left = rect.left + window.scrollX + rect.width / 2 - popRect.width / 2;
      let place: "top" | "bottom" = "top";

      // 위쪽 공간 부족 → 아래로
      if (top < window.scrollY) {
         top = rect.bottom + window.scrollY + 8;
         place = "bottom";
      }

      // 아래쪽 공간 부족 → 위로
      if (place === "bottom" && top + popRect.height > vh + window.scrollY) {
         top = rect.top + window.scrollY - popRect.height - 8;
         place = "top";
      }

      // 좌우 화면 보정
      left = Math.max(8, Math.min(left, vw - popRect.width - 8));

      setPos({ top, left });
      setPlacement(place);
   }, [target]);

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (
            popoverRef.current &&
            !popoverRef.current.contains(e.target as Node) &&
            !target.contains(e.target as Node)
         ) {
            onClose();
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [target]);

   return (
      <div
         onMouseDown={(e) => e.stopPropagation()} // 👈 추가
         ref={popoverRef}
         className="absolute rounded-md w-[400px] min-h-80
                 overflow-visible bg-background1 shadow-lg p-4 transition-transform duration-150"
         style={{
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
         }}
      >
         <h2 className="text-2xl font-bold text-text1">
            {`<${target.tagName.toLowerCase()}>`} Element
         </h2>
         <div className="border-border1 border-b-2 w-full my-4"></div>
         <div className="text-text2">gdgdgdgdg</div>
      </div>
   );
}
