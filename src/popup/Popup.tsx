"use client";
import { useState } from "react";
import InspectorTab from "./tabs/InspectorTab.";
import LabelTab from "./tabs/LabelTab";
import BottomView from "./views/BottomView";

const tabs = ["Inspector", "Label"] as const;
type TabType = (typeof tabs)[number];

export default function Popup() {
   const [active, setActive] = useState<TabType>("Inspector");

   return (
      <div className="ex-tw-w-64 ex-tw-bg-background2 ex-tw-h-[430px] ex-tw-flex ex-tw-flex-col ex-tw-overflow-hidden ex-tw-select-none">
         <div className="ex-tw-flex ex-tw-border-b ex-tw-border-border1 ">
            {tabs.map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={`ex-tw-flex-1 ex-tw-py-4 ex-tw-text-sm ex-tw-text-center ex-tw-font-semibold
                     ${active === tab ? "ex-tw-border-b-2 ex-tw-text-text5 ex-tw-border-text5" : "ex-tw-text-text4"}`}
               >
                  {tab}
               </button>
            ))}
         </div>
         <div className="ex-tw-flex-1 ex-tw-overflow-y-auto ex-tw-pt-4">
            {active === "Inspector" && <InspectorTab />}
            {active === "Label" && <LabelTab />}
         </div>
         <BottomView />
      </div>
   );
}
