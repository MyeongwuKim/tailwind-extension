import { useEffect, useState } from "react";
import ColorBoxControl from "../../components/ColorBoxControl";

export default function LabelTab() {
   const [labelBorder, setLabelBorder] = useState("#000000");
   const [labelBorderOpacity, setLabelBorderOpacity] = useState(1);

   const [labelBg, setLabelBg] = useState("#ffffff");
   const [labelBgOpacity, setLabelBgOpacity] = useState(1);

   useEffect(() => {
      chrome.storage.local.get(
         ["labelBorder", "labelBorderOpacity", "labelBg", "labelBgOpacity"],
         (res) => {
            if (res.labelBorder) setLabelBorder(res.labelBorder);
            if (typeof res.labelBorderOpacity === "number")
               setLabelBorderOpacity(res.labelBorderOpacity);

            if (res.labelBg) setLabelBg(res.labelBg);
            if (typeof res.labelBgOpacity === "number") setLabelBgOpacity(res.labelBgOpacity);
         }
      );
   }, []);

   return (
      <div className="ex-tw-flex ex-tw-flex-col ex-tw-gap-4 ex-tw-p-2">
         <ColorBoxControl
            color={labelBorder}
            opacity={labelBorderOpacity}
            onColorChange={(c) => {
               setLabelBorder(c);
               chrome.storage.local.set({ labelBorder: c });
            }}
            onOpacityChange={(v) => {
               setLabelBorderOpacity(v);
               chrome.storage.local.set({ labelBorderOpacity: v });
            }}
         />

         {/* Label Background */}
         <ColorBoxControl
            color={labelBg}
            opacity={labelBgOpacity}
            onColorChange={(c) => {
               setLabelBg(c);
               chrome.storage.local.set({ labelBg: c });
            }}
            onOpacityChange={(v) => {
               setLabelBgOpacity(v);
               chrome.storage.local.set({ labelBgOpacity: v });
            }}
         />
      </div>
   );
}
