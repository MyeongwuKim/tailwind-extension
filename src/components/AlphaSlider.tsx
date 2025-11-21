interface AlphaSliderProps {
   alpha: number;
   rgb: {
      r: number;
      g: number;
      b: number;
   };
   onChange: (value: number) => void;
}

export default function AlphaSlider({ alpha, rgb, onChange }: AlphaSliderProps) {
   return (
      <input
         type="range"
         min={0}
         max={1}
         step={0.01}
         value={alpha}
         onChange={(e) => onChange(Number(e.target.value))}
         className="ex-tw-w-full ex-tw-h-3 ex-tw-rounded-full ex-tw-appearance-none slider-alpha"
         style={
            {
               "--rgb": `${rgb.r}, ${rgb.g}, ${rgb.b}`,
            } as any
         }
      />
   );
}
