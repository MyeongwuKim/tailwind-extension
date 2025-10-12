"use client";
import { useEffect, useState } from "react";

export default function Popup() {
   const [enabled, setEnabled] = useState(false);

   useEffect(() => {
      // 초기 상태 가져오기
      chrome.storage.local.get("enabled").then(({ enabled }) => {
         setEnabled(!!enabled);
      });
   }, []);

   const toggle = () => {
      const newState = !enabled;
      setEnabled(newState);
      chrome.storage.local.set({ enabled: newState });
      chrome.runtime.sendMessage({ action: "toggle", enabled: newState });
   };

   return (
      <div className="ex-tw-p-4 ex-tw-w-48">
         <h1 className="ex-tw-font-bold ex-tw-mb-2 ">Tailwind Inspector</h1>
         <button
            onClick={toggle}
            className={`ex-tw-px-3 ex-tw-py-2 ex-tw-rounded ex-tw-text-white ex-tw-w-full ${
               enabled ? "ex-tw-bg-green-600" : "ex-tw-bg-gray-500"
            }`}
         >
            {enabled ? "ON" : "OFF"}
         </button>
      </div>
   );
}
