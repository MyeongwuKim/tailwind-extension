import { useMemo } from "react";
import CssRow from "./CssRow";
import cssToTailwind from "../utils/cssToTailwind";

interface PanelProps {
   target?: HTMLElement | null;
}

export default function Panel({ target }: PanelProps) {
   const styles = useMemo(() => {
      if (!target) return [];
      const computed = getComputedStyle(target);
      return Array.from(computed).map((prop) => ({
         prop,
         value: computed.getPropertyValue(prop),
      }));
   }, [target]);

   return (
      <div className="relative w-full h-full   bg-[#1e1e1e] shadow text-white p-3">
         {target ? (
            <>
               <div className="font-bold mb-2">&lt;{target.tagName.toLowerCase()}&gt;</div>
               {styles.map(({ prop, value }) =>
                  value && value !== "auto" && value !== "0px" && value !== "normal" ? (
                     <CssRow
                        key={prop}
                        property={prop}
                        value={value}
                        tw={cssToTailwind(`${prop}: ${value};`)}
                     />
                  ) : null
               )}
            </>
         ) : (
            <div className="text-gray-400">👉 요소를 클릭하세요</div>
         )}
      </div>
   );
}
