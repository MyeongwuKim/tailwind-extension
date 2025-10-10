export function injectFonts(targetDoc: Document = document) {
   const fontFaces = [
      {
         weight: 400,
         url: chrome.runtime.getURL("fonts/inter-latin-400-normal.woff2"),
      },
      {
         weight: 500,
         url: chrome.runtime.getURL("fonts/inter-latin-500-normal.woff2"),
      },
      {
         weight: 700,
         url: chrome.runtime.getURL("fonts/inter-latin-700-normal.woff2"),
      },
   ];

   // ✅ 모든 @font-face 규칙을 하나의 문자열로 결합
   let css = "";
   for (const { weight, url } of fontFaces) {
      css += `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: ${weight};
        font-display: swap;
        src: url("${url}") format("woff2");
      }
    `;
   }

   // ✅ <style> 엘리먼트 생성 후 targetDoc (document or iframeDoc)에 삽입
   const style = targetDoc.createElement("style");
   style.textContent = css;
   targetDoc.head.appendChild(style);
}
