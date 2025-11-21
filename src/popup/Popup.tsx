"use client";
import { useState } from "react";
import InspectorTab from "./tabs/InspectorTab.";
import LabelTab from "./tabs/LabelTab";

const tabs = ["Inspector", "Label"] as const;
type TabType = (typeof tabs)[number];

export default function Popup() {
   const [active, setActive] = useState<TabType>("Inspector");

   return (
      <div className="ex-tw-w-64 ex-tw-p-3 ex-tw-select-none">
         {/* Header */}
         <div className="ex-tw-mb-4 ex-tw-border-b ex-tw-border-border1 ex-tw-pb-2">
            <h1 className="ex-tw-text-xl ex-tw-font-bold ex-tw-text-text1">Tailwind Extension</h1>
         </div>

         {/* Tabs */}
         <div className="ex-tw-flex ex-tw-border-b ex-tw-border-border1">
            {tabs.map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={`ex-tw-flex-1 ex-tw-py-2 ex-tw-text-center ex-tw-font-semibold
              ${
                 active === tab
                    ? "ex-tw-border-b-2 ex-tw-border-indigo-500 ex-tw-text-indigo-600"
                    : "ex-tw-text-gray-400"
              }`}
               >
                  {tab}
               </button>
            ))}
         </div>

         {/* Tab Content */}
         <div className="ex-tw-pt-4">
            {active === "Inspector" && <InspectorTab />}
            {active === "Label" && <LabelTab />}
         </div>
      </div>
   );
}
