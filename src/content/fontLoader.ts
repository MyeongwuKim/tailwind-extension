export function injectFonts() {
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

   const style = document.createElement("style");
   style.textContent = css;
   document.head.appendChild(style);
}
