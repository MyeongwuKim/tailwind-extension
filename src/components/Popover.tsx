import { useEffect, useRef, useState } from "react";
import { getClassAppliedStyles } from "../hooks/useUtils";
import { cssToTailwind } from "../hooks/useConverter";

export default function Popover({ target, onClose }: { target: HTMLElement; onClose: () => void }) {
   const popoverRef = useRef<HTMLDivElement>(null);
   const [pos, setPos] = useState({ top: 0, left: 0 });
   const [placement, setPlacement] = useState<"top" | "bottom">("top");

   useEffect(() => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const vw = window.innerWidth;
      const popoverWidth = 400;
      const popoverHeight = 320; // min-h-80 (20rem)

      // 기본 위치: 위쪽
      let top = rect.top + window.scrollY - popoverHeight - 8;
      let left = rect.left + window.scrollX + rect.width / 2 - popoverWidth / 2;
      let place: "top" | "bottom" = "top";

      // 위쪽 공간 부족 → 아래쪽으로
      if (top < window.scrollY) {
         top = rect.bottom + window.scrollY + 8;
         place = "bottom";
      }

      // 좌우 화면 보정
      if (left < 8) left = 8;
      if (left + popoverWidth > vw) left = vw - popoverWidth - 8;

      setPos({ top, left });
      setPlacement(place);

      // 외부 클릭 감지
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
         ref={popoverRef}
         className="absolute rounded-md w-[400px] min-h-80
                 overflow-visible bg-background1 shadow-lg p-4 transition-transform duration-150"
         style={{
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
         }}
      >
         <h2 className="text-xl font-bold text-text1">
            {`<${target.tagName.toLowerCase()}>`} Element
         </h2>
         <div className="border-border1 border-b-2 w-full my-4"></div>
         <div className="text-text2">gdgdgdgdg</div>
         {/* 변환 UI 들어갈 자리 */}
      </div>
   );
}
