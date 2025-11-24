//background에서 돌면서 Listen을 함 (각종 이벤트 처리해주는 미들웨어)
import { INITIAL_CONFIG } from "./constants/define";

let inspectorEnabled = false;

chrome.runtime.onInstalled.addListener(() => {
   console.log("install");
   chrome.storage.local.set({
      enabled: true,
      darkMode: false,
      ...INITIAL_CONFIG,
   });
});

//메인 리스너(각종 이벤트처리)
chrome.runtime.onMessage.addListener((msg): any => {
   if (msg.action === "toggle") {
      inspectorEnabled = msg.enabled;

      if (inspectorEnabled) {
         // ✅ 메뉴 생성 (고정된 ID 사용)
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
      } else {
         // ✅ 메뉴 제거
         chrome.contextMenus.removeAll();
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab?.id) return;
            chrome.tabs.sendMessage(tab.id, { action: "disEnabled" });
         });
      }
   } else if (msg.action == "log") {
      console.log(msg.payload);
   } else if (msg.action == "darkMode") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         const tab = tabs[0];
         if (!tab?.id) return;
         chrome.tabs.sendMessage(tab.id, { action: "darkMode", darkMode: msg.darkMode }); // ★ 현재탭 content script로 전달
      });
   }
});

// ✅ 메뉴 클릭 → content script에 전달
chrome.contextMenus.onClicked.addListener((info, tab) => {
   console.log(info.menuItemId);
   if (!tab?.id) return;
   if (info.menuItemId === "tailwind-converter") {
      chrome.tabs.sendMessage(tab.id, { action: "startConverter" });
   }
   if (info.menuItemId === "tailwind-tester") {
      chrome.tabs.sendMessage(tab.id, { action: "startTester" });
   }
});
