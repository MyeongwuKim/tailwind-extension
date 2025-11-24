export function logger(...args: any[]) {
   if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({
         action: "log",
         payload: args,
      });
   }
   console.log(...args); // 현재 컨텍스트에도 찍기
}

export function hexToRgb(hex: string) {
   hex = hex.replace("#", "");

   // 3자리 (#fff) → 6자리로 확장
   if (hex.length === 3) {
      hex = hex
         .split("")
         .map((c) => c + c)
         .join("");
   }

   const r = parseInt(hex.substring(0, 2), 16);
   const g = parseInt(hex.substring(2, 4), 16);
   const b = parseInt(hex.substring(4, 6), 16);

   return { r, g, b };
}
