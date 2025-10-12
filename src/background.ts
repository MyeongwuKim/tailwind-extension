let inspectorEnabled = false;

chrome.runtime.onMessage.addListener((msg) => {
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
      }
   } else if (msg.action == "log") {
      console.log(msg.payload);
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
