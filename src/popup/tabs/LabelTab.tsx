import { useEffect, useState } from "react";
import ColorBoxControl from "../../components/ColorBoxControl";

export default function LabelTab() {
   const [labelText, setLabelText] = useState("#000000");
   const [labelTextOpacity, setLabelTextOpacity] = useState(1);

   const [labelBg, setLabelBg] = useState("#ffffff");
   const [labelBgOpacity, setLabelBgOpacity] = useState(1);

   // --- 초기값 로드 ---
   useEffect(() => {
      chrome.storage.local.get(
         ["labelText", "labelTextOpacity", "labelBg", "labelBgOpacity"],
         (res) => {
            if (res.labelText) setLabelText(res.labelText);
            if (typeof res.labelTextOpacity === "number") {
               setLabelTextOpacity(res.labelTextOpacity);
            }

            if (res.labelBg) setLabelBg(res.labelBg);
            if (typeof res.labelBgOpacity === "number") {
               setLabelBgOpacity(res.labelBgOpacity);
            }
         }
      );
   }, []);

   // --- 상태 → 스토리지 자동 동기화 ---
   useEffect(() => {
      chrome.storage.local.set({ labelText });
   }, [labelText]);

   useEffect(() => {
      chrome.storage.local.set({ labelTextOpacity });
   }, [labelTextOpacity]);

   useEffect(() => {
      chrome.storage.local.set({ labelBg });
   }, [labelBg]);

   useEffect(() => {
      chrome.storage.local.set({ labelBgOpacity });
   }, [labelBgOpacity]);

   return (
      <div className="ex-tw-flex ex-tw-flex-col ex-tw-gap-4 ex-tw-p-2">
         <h1 className="ex-tw-font-semibold ex-tw-text-text1 ex-tw-text-base">
            라벨의 컬러값을 변경합니다.
         </h1>

         {/* Text */}
         <div>
            <h3 className="ex-tw-font-semibold ex-tw-text-text2 ex-tw-mb-2">Text</h3>
            <ColorBoxControl
               color={labelText}
               opacity={labelTextOpacity}
               onColorChange={setLabelText}
               onOpacityChange={setLabelTextOpacity}
            />
         </div>

         {/* Background */}
         <div>
            <h3 className="ex-tw-font-semibold ex-tw-text-text2 ex-tw-mb-2">Background</h3>
            <ColorBoxControl
               color={labelBg}
               opacity={labelBgOpacity}
               onColorChange={setLabelBg}
               onOpacityChange={setLabelBgOpacity}
            />
         </div>
      </div>
   );
}
