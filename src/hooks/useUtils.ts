export function logger(...args: any[]) {
   if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({
         action: "log",
         payload: args,
      });
   }
   console.log(...args); // 현재 컨텍스트에도 찍기
}
