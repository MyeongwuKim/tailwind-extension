import { MoonIcon, Power, PowerOff, SunIcon } from "lucide-react";
import IconToggle from "../../components/IconToggle";
import { useEffect, useState } from "react";

export default function BottomView() {
   const [enabled, setEnabled] = useState<boolean>(true);
   const [darkMode, setDarkMode] = useState<boolean>(false); // second toggle

   // 첫 로드 시 storage에서 값 복원
   useEffect(() => {
      chrome.storage.local.get(["enabled", "darkMode"], (res) => {
         setEnabled(!!res.enabled); // undefined → false
         setDarkMode(!!res.darkMode);
      });
   }, []);

   // enabled 바뀔 때 백그라운드로 전송
   useEffect(() => {
      chrome.runtime.sendMessage({ action: "toggle", enabled });
   }, [enabled]);

   useEffect(() => {
      if (darkMode) {
         document.documentElement.classList.add("dark");
         document.documentElement.classList.add("ex-tw-dark");
      } else {
         document.documentElement.classList.remove("dark");
         document.documentElement.classList.remove("ex-tw-dark");
      }
      chrome.runtime.sendMessage({ action: "darkMode", darkMode });
   }, [darkMode]);

   return (
      <div
         className="ex-tw-border-t-border1 ex-tw-shadow-md
         ex-tw-border-border1 ex-tw-p-3 ex-tw-gap-2 ex-tw-flex ex-tw-items-end ex-tw-w-full ex-tw-bg-background1"
      >
         <IconToggle
            checked={darkMode}
            onChange={(checked) => {
               setDarkMode(checked);
               chrome.storage.local.set({ darkMode: checked });
            }}
            checkIcon={<MoonIcon className="ex-tw-w-5 ex-tw-h-5" />}
            unCheckIcon={<SunIcon className="ex-tw-w-5 ex-tw-h-5" />}
         />
         <IconToggle
            checked={enabled}
            onChange={(checked) => {
               setEnabled(checked);
               chrome.storage.local.set({ enabled: checked });
            }}
            checkIcon={<Power className="ex-tw-w-5 ex-tw-h-5" />}
            unCheckIcon={<PowerOff className="ex-tw-w-5 ex-tw-h-5" />}
         />
      </div>
   );
}
