export default function cssToTailwind(css: string): string {
   const [prop, rawValue] = css.split(":").map((s) => s.trim().replace(";", ""));
   const value = rawValue.toLowerCase();

   const propMap: Record<string, string> = {
      color: "text",
      "background-color": "bg",
      "font-size": "text",
      "line-height": "leading",
      width: "w",
      height: "h",
      margin: "m",
      "margin-top": "mt",
      "margin-bottom": "mb",
      "margin-left": "ml",
      "margin-right": "mr",
      padding: "p",
      "padding-top": "pt",
      "padding-bottom": "pb",
      "padding-left": "pl",
      "padding-right": "pr",
   };

   if (propMap[prop]) {
      return `${propMap[prop]}-[${value}]`;
   }

   return `[${prop}:${value}]`;
}
