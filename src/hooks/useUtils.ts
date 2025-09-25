const cssToTailwindMap: Record<string, (value: string) => string | null> = {
   "background-color": (val) => `bg-[${val}]`,
   color: (val) => `text-[${val}]`,
   "border-radius": (val) => {
      if (val === "4px") return "rounded";
      if (val === "8px") return "rounded-md";
      if (val === "16px") return "rounded-xl";
      return `rounded-[${val}]`;
   },
   "border-width": (val) => (val === "1px" ? "border" : `border-[${val}]`),
   "border-color": (val) => `border-[${val}]`,
   height: (val) => (val === "32px" ? "h-8" : `h-[${val}]`),
   width: (val) => (val === "32px" ? "w-8" : `w-[${val}]`),
   "font-size": (val) => {
      if (val === "16px") return "text-base";
      if (val === "14px") return "text-sm";
      return `text-[${val}]`;
   },
   padding: (val) => {
      if (val === "16px") return "p-4";
      return `p-[${val}]`;
   },
   margin: (val) => {
      if (val === "16px") return "m-4";
      return `m-[${val}]`;
   },
};

type CSSObject = Record<string, string>;

export function convertCssObjToTailwind(cssObj: CSSObject): Record<string, string> {
   const result: Record<string, string> = {};

   for (const [prop, val] of Object.entries(cssObj)) {
      const normalizedProp = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()); // camelCase → kebab-case
      const converter = cssToTailwindMap[normalizedProp];

      if (converter) {
         const tw = converter(val);
         if (tw) result[normalizedProp] = tw;
      } else {
         result[normalizedProp] = `[${normalizedProp}:${val}]`; // fallback
      }
   }

   return result;
}

export function getClassAppliedStyles(el: HTMLElement) {
   const computed = getComputedStyle(el);

   // 비교용 기본 element
   const defaultEl = document.createElement(el.tagName);
   defaultEl.style.all = "unset";
   document.body.appendChild(defaultEl);
   const defaultStyles = getComputedStyle(defaultEl);

   const result: Record<string, string | string[]> = {};
   const allowedProps = [
      "color",
      "background-color",
      "border-color",
      "border-width",
      "width",
      "height",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "font-size",
      "font-weight",
      "display",
      "flex-direction",
      "justify-content",
      "align-items",
      "gap",
      "text-align",
      "line-height",
      "letter-spacing",
      "box-shadow",
   ];

   for (let i = 0; i < computed.length; i++) {
      const prop = computed.item(i);
      if (!prop) continue;

      // 인라인 스타일 제외
      if (el.style[prop as any]) continue;

      // border-radius는 별도 처리
      if (
         prop === "border-top-left-radius" ||
         prop === "border-top-right-radius" ||
         prop === "border-bottom-right-radius" ||
         prop === "border-bottom-left-radius"
      ) {
         continue; // 개별 값은 아래에서 처리
      }

      if (!allowedProps.includes(prop as any)) continue;

      const value = computed.getPropertyValue(prop);
      const defaultValue = defaultStyles.getPropertyValue(prop);
      if (value === defaultValue) continue;

      result[prop] = value;
   }

   const tl = computed.getPropertyValue("border-top-left-radius");
   const tr = computed.getPropertyValue("border-top-right-radius");
   const br = computed.getPropertyValue("border-bottom-right-radius");
   const bl = computed.getPropertyValue("border-bottom-left-radius");

   const dtl = defaultStyles.getPropertyValue("border-top-left-radius");
   const dtr = defaultStyles.getPropertyValue("border-top-right-radius");
   const dbr = defaultStyles.getPropertyValue("border-bottom-right-radius");
   const dbl = defaultStyles.getPropertyValue("border-bottom-left-radius");

   if (tl !== dtl || tr !== dtr || br !== dbr || bl !== dbl) {
      if (tl === tr && tr === br && br === bl) {
         result["border-radius"] = `rounded-[${tl}]`;
      } else {
         const radiusClasses: string[] = [];
         if (tl !== dtl) radiusClasses.push(`rounded-tl-[${tl}]`);
         if (tr !== dtr) radiusClasses.push(`rounded-tr-[${tr}]`);
         if (br !== dbr) radiusClasses.push(`rounded-br-[${br}]`);
         if (bl !== dbl) radiusClasses.push(`rounded-bl-[${bl}]`);
         if (radiusClasses.length) result["border-radius"] = radiusClasses;
      }
   }

   document.body.removeChild(defaultEl);
   return result;
}
