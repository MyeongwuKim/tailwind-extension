chrome.runtime.onMessage.addListener((msg) => {
   if (msg.action === "toggle") {
      // 현재 탭에 전달
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
               action: "toggle",
               enabled: msg.enabled,
            });
         }
      });
   }
});
