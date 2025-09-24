let inspectorEnabled = false;

chrome.runtime.onMessage.addListener((msg) => {
   if (msg.action === "toggle") {
      inspectorEnabled = msg.enabled;

      if (inspectorEnabled) {
         // ✅ 메뉴 생성 (고정된 ID 사용)
         chrome.contextMenus.create({
            id: "tailwind-converter",
            title: "CSS → Tailwind Converter",
            contexts: ["all"],
         });
      } else {
         // ✅ 메뉴 제거
         chrome.contextMenus.removeAll();
      }
   }
});

// ✅ 메뉴 클릭 → content script에 전달
chrome.contextMenus.onClicked.addListener((info, tab) => {
   if (tab?.id && info.menuItemId === "tailwind-converter") {
      console.log("✅ 메뉴 클릭됨, content.js로 메시지 보냄");
      chrome.tabs.sendMessage(tab.id, { action: "startInspector" });
   }
});
