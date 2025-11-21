import { useEffect, useState } from "react";
import AlphaSlider from "./AlphaSlider";

function hexToRgb(hex: string) {
   hex = hex.replace("#", "");
   if (hex.length === 3) {
      hex = hex
         .split("")
         .map((c) => c + c)
         .join("");
   }
   const num = parseInt(hex, 16);
   return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
   };
}

export default function ColorBoxControl({
   color,
   opacity,
   onColorChange,
   onOpacityChange,
}: {
   color: string;
   opacity: number; // 0~1
   onColorChange: (c: string) => void;
   onOpacityChange: (v: number) => void;
}) {
   const [tempColor, setTempColor] = useState(color);

   useEffect(() => {
      setTempColor(color);
   }, [color]);

   const rgb = hexToRgb(tempColor);

   return (
      <div className="ex-tw-w-full ex-tw-flex ex-tw-flex-col ex-tw-gap-2">
         {/* 컬러 박스 */}
         <div className="ex-tw-w-full ex-tw-h-8 ex-tw-rounded-lg ex-tw-overflow-hidden ex-tw-relative ex-tw-border ex-tw-border-border1">
            <input
               type="color"
               value={tempColor}
               onChange={(e) => {
                  setTempColor(e.target.value);
                  onColorChange(e.target.value);
               }}
               className="ex-tw-absolute ex-tw-w-full ex-tw-h-full ex-tw-opacity-0 ex-tw-cursor-pointer"
            />
            <div className="ex-tw-w-full ex-tw-h-full" style={{ backgroundColor: tempColor }} />
         </div>

         {/* Alpha Slider (높이 동일하게 스타일링 가능) */}
         <div className="ex-tw-h-10 ex-tw-flex ex-tw-items-center">
            <AlphaSlider alpha={opacity} rgb={rgb} onChange={(v) => onOpacityChange(v)} />
         </div>
      </div>
   );
}
