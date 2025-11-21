import { useEffect, useState } from "react";
import ColorBoxControl from "../../components/ColorBoxControl";

export default function InspectorTab() {
   const [overlayBorder, setOverlayBorder] = useState("#000000");
   const [overlayBorderOpacity, setOverlayBorderOpacity] = useState(1);

   const [overlayBg, setOverlayBg] = useState("#ffffff");
   const [overlayBgOpacity, setOverlayBgOpacity] = useState(1);

   useEffect(() => {
      chrome.storage.local.get(
         ["overlayBorder", "overlayBorderOpacity", "overlayBg", "overlayBgOpacity"],
         (res) => {
            if (res.overlayBorder) setOverlayBorder(res.overlayBorder);
            if (typeof res.overlayBorderOpacity === "number")
               setOverlayBorderOpacity(res.overlayBorderOpacity);

            if (res.overlayBg) setOverlayBg(res.overlayBg);
            if (typeof res.overlayBgOpacity === "number") setOverlayBgOpacity(res.overlayBgOpacity);
         }
      );
   }, []);

   return (
      <div className="ex-tw-flex ex-tw-flex-col ex-tw-gap-4 ex-tw-p-2">
         {/* Border */}
         <div>
            <h3 className="ex-tw-font-semibold ex-tw-text-text2 ex-tw-mb-2">Border</h3>
            <ColorBoxControl
               color={overlayBorder}
               opacity={overlayBorderOpacity}
               onColorChange={(c) => {
                  setOverlayBorder(c);
                  chrome.storage.local.set({ overlayBorder: c });
               }}
               onOpacityChange={(v) => {
                  setOverlayBorderOpacity(v);
                  chrome.storage.local.set({ overlayBorderOpacity: v });
               }}
            />
         </div>

         {/* Background */}
         <div>
            <h3 className="ex-tw-font-semibold ex-tw-text-text2 ex-tw-mb-2">Background</h3>
            <ColorBoxControl
               color={overlayBg}
               opacity={overlayBgOpacity}
               onColorChange={(c) => {
                  setOverlayBg(c);
                  chrome.storage.local.set({ overlayBg: c });
               }}
               onOpacityChange={(v) => {
                  setOverlayBgOpacity(v);
                  chrome.storage.local.set({ overlayBgOpacity: v });
               }}
            />
         </div>
      </div>
   );
}
