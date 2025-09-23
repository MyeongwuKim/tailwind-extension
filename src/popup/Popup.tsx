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
      <div className="p-4 w-48">
         <h1 className="font-bold mb-2">Tailwind Inspector</h1>
         <button
            onClick={toggle}
            className={`px-3 py-2 rounded text-white w-full ${
               enabled ? "bg-green-600" : "bg-gray-500"
            }`}
         >
            {enabled ? "ON" : "OFF"}
         </button>
      </div>
   );
}
