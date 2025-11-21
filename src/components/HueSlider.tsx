export default function HueSlider({ hue, onChange }) {
   return (
      <input
         type="range"
         min={0}
         max={360}
         value={hue}
         onChange={(e) => onChange(Number(e.target.value))}
         className="ex-tw-w-full ex-tw-h-3 ex-tw-rounded-full ex-tw-appearance-none slider-hue"
      />
   );
}
