// components/ColorPickerPopover.tsx
import { HexColorPicker } from "react-colorful";
import { useState, useEffect, useRef } from "react";

interface ColorPikcerProps {
   initialColor: string;
   onSelect: (color: string) => void;
   onClose: () => void;
   position: { x: number; y: number };
}

export default function ColorPickerPopover({
   initialColor = "#ffffff",
   onSelect,
   onClose,
   position = { x: 0, y: 0 },
}: ColorPikcerProps) {
   const [color, setColor] = useState(initialColor);
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleClick = (e: MouseEvent) => {
         if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
   }, [onClose]);

   return (
      <div
         ref={ref}
         style={{
            position: "fixed", // ✅ absolute → fixed 로 변경
            top: position.y - window.scrollY, // ✅ 스크롤 보정 (fixed는 viewport 기준)
            left: position.x - window.scrollX,
            zIndex: 2147483647, // dropdown보다 살짝 높게
         }}
         className="ex-tw-bg-white ex-tw-rounded-xl ex-tw-shadow-lg ex-tw-p-4 ex-tw-w-[220px] ex-tw-flex ex-tw-flex-col ex-tw-gap-3"
      >
         <HexColorPicker color={color} onChange={setColor} />
         <div
            className="ex-tw-h-6 ex-tw-rounded ex-tw-border ex-tw-border-gray-300"
            style={{ backgroundColor: color }}
         />
         <button
            className="ex-tw-bg-blue-500 ex-tw-text-white ex-tw-rounded ex-tw-py-1 hover:ex-tw-bg-blue-600"
            onClick={() => {
               onSelect(color);
               onClose();
            }}
         >
            적용
         </button>
      </div>
   );
}
