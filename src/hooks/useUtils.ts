export function getClassAppliedStyles(el: HTMLElement) {
   const computed = getComputedStyle(el);

   // 비교용 기본 element
   const defaultEl = document.createElement(el.tagName);
   defaultEl.style.all = "unset";
   document.body.appendChild(defaultEl);
   const defaultStyles = getComputedStyle(defaultEl);

   const result: Record<string, string | string[]> = {};
   const allowedProps = [
      "position",
      "color",
      "background-color",
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

   // 일반 속성 필터링
   for (let i = 0; i < computed.length; i++) {
      const prop = computed.item(i);
      if (!prop) continue;

      // 인라인 스타일 제외
      if (el.style[prop as any]) continue;

      // border-radius 개별 속성은 따로 처리
      if (
         prop === "border-top-left-radius" ||
         prop === "border-top-right-radius" ||
         prop === "border-bottom-right-radius" ||
         prop === "border-bottom-left-radius"
      ) {
         continue;
      }

      if (!allowedProps.includes(prop as any)) continue;

      const value = computed.getPropertyValue(prop);
      const defaultValue = defaultStyles.getPropertyValue(prop);
      if (value === defaultValue) continue;

      result[prop] = value;
   }

   // ✅ border-radius 처리
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
         result["border-radius"] = tl;
      } else {
         const radiusClasses: string[] = [];
         if (tl !== dtl) radiusClasses.push(`rounded-tl-[${tl}]`);
         if (tr !== dtr) radiusClasses.push(`rounded-tr-[${tr}]`);
         if (br !== dbr) radiusClasses.push(`rounded-br-[${br}]`);
         if (bl !== dbl) radiusClasses.push(`rounded-bl-[${bl}]`);
         if (radiusClasses.length) result["border-radius"] = radiusClasses;
      }
   }

   // ✅ border-width 처리
   const bwTop = computed.getPropertyValue("border-top-width");
   const bwRight = computed.getPropertyValue("border-right-width");
   const bwBottom = computed.getPropertyValue("border-bottom-width");
   const bwLeft = computed.getPropertyValue("border-left-width");

   if (
      bwTop !== defaultStyles.getPropertyValue("border-top-width") ||
      bwRight !== defaultStyles.getPropertyValue("border-right-width") ||
      bwBottom !== defaultStyles.getPropertyValue("border-bottom-width") ||
      bwLeft !== defaultStyles.getPropertyValue("border-left-width")
   ) {
      if (bwTop === bwRight && bwRight === bwBottom && bwBottom === bwLeft) {
         result["border-width"] = bwTop;
      } else {
         if (bwTop !== defaultStyles.getPropertyValue("border-top-width"))
            result["border-top-width"] = bwTop;
         if (bwRight !== defaultStyles.getPropertyValue("border-right-width"))
            result["border-right-width"] = bwRight;
         if (bwBottom !== defaultStyles.getPropertyValue("border-bottom-width"))
            result["border-bottom-width"] = bwBottom;
         if (bwLeft !== defaultStyles.getPropertyValue("border-left-width"))
            result["border-left-width"] = bwLeft;
      }
   }

   // ✅ border-color 처리
   const bcTop = computed.getPropertyValue("border-top-color");
   const bcRight = computed.getPropertyValue("border-right-color");
   const bcBottom = computed.getPropertyValue("border-bottom-color");
   const bcLeft = computed.getPropertyValue("border-left-color");

   if (
      bcTop !== defaultStyles.getPropertyValue("border-top-color") ||
      bcRight !== defaultStyles.getPropertyValue("border-right-color") ||
      bcBottom !== defaultStyles.getPropertyValue("border-bottom-color") ||
      bcLeft !== defaultStyles.getPropertyValue("border-left-color")
   ) {
      if (bcTop === bcRight && bcRight === bcBottom && bcBottom === bcLeft) {
         result["border-color"] = bcTop;
      } else {
         if (bcTop !== defaultStyles.getPropertyValue("border-top-color"))
            result["border-top-color"] = bcTop;
         if (bcRight !== defaultStyles.getPropertyValue("border-right-color"))
            result["border-right-color"] = bcRight;
         if (bcBottom !== defaultStyles.getPropertyValue("border-bottom-color"))
            result["border-bottom-color"] = bcBottom;
         if (bcLeft !== defaultStyles.getPropertyValue("border-left-color"))
            result["border-left-color"] = bcLeft;
      }
   }

   // ✅ border-style 처리
   const bsTop = computed.getPropertyValue("border-top-style");
   const bsRight = computed.getPropertyValue("border-right-style");
   const bsBottom = computed.getPropertyValue("border-bottom-style");
   const bsLeft = computed.getPropertyValue("border-left-style");

   if (
      bsTop !== defaultStyles.getPropertyValue("border-top-style") ||
      bsRight !== defaultStyles.getPropertyValue("border-right-style") ||
      bsBottom !== defaultStyles.getPropertyValue("border-bottom-style") ||
      bsLeft !== defaultStyles.getPropertyValue("border-left-style")
   ) {
      if (bsTop === bsRight && bsRight === bsBottom && bsBottom === bsLeft) {
         result["border-style"] = bsTop;
      } else {
         if (bsTop !== defaultStyles.getPropertyValue("border-top-style"))
            result["border-top-style"] = bsTop;
         if (bsRight !== defaultStyles.getPropertyValue("border-right-style"))
            result["border-right-style"] = bsRight;
         if (bsBottom !== defaultStyles.getPropertyValue("border-bottom-style"))
            result["border-bottom-style"] = bsBottom;
         if (bsLeft !== defaultStyles.getPropertyValue("border-left-style"))
            result["border-left-style"] = bsLeft;
      }
   }

   document.body.removeChild(defaultEl);
   return result;
}
