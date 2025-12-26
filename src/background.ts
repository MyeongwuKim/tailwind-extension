import { INITIAL_CONFIG } from "./constants/define";

let inspectorEnabled = true;

/* ==================================================================================
   설치 시: 메뉴 + 초기 상태 생성 (★ 핵심)
   ================================================================================== */
chrome.runtime.onInstalled.addListener(() => {
   console.log("install");

   chrome.storage.local.set({
      enabled: true,
      darkMode: false,
      ...INITIAL_CONFIG,
   });

   // ✅ 컨텍스트 메뉴는 무조건 여기서 생성
   chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
         id: "tailwind-converter",
         title: "Tailwind Converter",
         contexts: ["all"],
      });

      chrome.contextMenus.create({
         id: "tailwind-tester",
         title: "Tailwind UI Tester",
         contexts: ["all"],
      });
   });
});

/* ==================================================================================
   메인 메시지 리스너 (동작 제어만 담당)
   ================================================================================== */
chrome.runtime.onMessage.addListener((msg): any => {
   if (msg.action === "toggle") {
      inspectorEnabled = msg.enabled;

      chrome.contextMenus.update("tailwind-converter", {
         title: inspectorEnabled ? "Tailwind Converter" : "Tailwind Converter (Disabled)",
      });

      chrome.contextMenus.update("tailwind-tester", {
         title: inspectorEnabled ? "Tailwind UI Tester" : "Tailwind UI Tester (Disabled)",
      });

      if (!inspectorEnabled) {
         // inspector 비활성화 시 UI만 닫음 (메뉴는 유지)
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab?.id) return;
            chrome.tabs.sendMessage(tab.id, { action: "disEnabled" });
         });
      }
   } else if (msg.action === "log") {
      console.log(msg.payload);
   } else if (msg.action === "darkMode") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         const tab = tabs[0];
         if (!tab?.id) return;
         chrome.tabs.sendMessage(tab.id, {
            action: "darkMode",
            darkMode: msg.darkMode,
         });
      });
   }
});

/* ==================================================================================
   컨텍스트 메뉴 클릭
   ================================================================================== */
chrome.contextMenus.onClicked.addListener((info, tab) => {
   if (!tab?.id) return;

   // ❌ 비활성 상태면 무시
   if (!inspectorEnabled) return;

   if (info.menuItemId === "tailwind-converter") {
      chrome.tabs.sendMessage(tab.id, { action: "startConverter" });
   }

   if (info.menuItemId === "tailwind-tester") {
      chrome.tabs.sendMessage(tab.id, { action: "startTester" });
   }
});
