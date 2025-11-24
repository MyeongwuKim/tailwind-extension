import { useEffect, useState } from "react";
import ColorBoxControl from "../../components/ColorBoxControl";

export default function InspectorTab() {
   const [overlayBorder, setOverlayBorder] = useState("#000000");
   const [overlayBorderOpacity, setOverlayBorderOpacity] = useState(1);

   const [overlayBg, setOverlayBg] = useState("#ffffff");
   const [overlayBgOpacity, setOverlayBgOpacity] = useState(1);

   // --- 초기값 로드 ---
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

   // --- 상태 → 스토리지 자동 동기화 ---
   useEffect(() => {
      chrome.storage.local.set({ overlayBorder });
   }, [overlayBorder]);

   useEffect(() => {
      chrome.storage.local.set({ overlayBorderOpacity });
   }, [overlayBorderOpacity]);

   useEffect(() => {
      chrome.storage.local.set({ overlayBg });
   }, [overlayBg]);

   useEffect(() => {
      chrome.storage.local.set({ overlayBgOpacity });
   }, [overlayBgOpacity]);

   return (
      <div className="ex-tw-flex ex-tw-flex-col ex-tw-gap-4 ex-tw-p-2">
         <h1 className="ex-tw-font-semibold ex-tw-text-text1 ex-tw-text-base">
            인스펙터의 컬러값을 변경합니다.
         </h1>

         {/* Border */}
         <div>
            <h3 className="ex-tw-font-semibold ex-tw-text-text2 ex-tw-mb-2">Border</h3>
            <ColorBoxControl
               color={overlayBorder}
               opacity={overlayBorderOpacity}
               onColorChange={setOverlayBorder}
               onOpacityChange={setOverlayBorderOpacity}
            />
         </div>

         {/* Background */}
         <div>
            <h3 className="ex-tw-font-semibold ex-tw-text-text2 ex-tw-mb-2">Background</h3>
            <ColorBoxControl
               color={overlayBg}
               opacity={overlayBgOpacity}
               onColorChange={setOverlayBg}
               onOpacityChange={setOverlayBgOpacity}
            />
         </div>
      </div>
   );
}
