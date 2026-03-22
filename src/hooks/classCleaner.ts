function splitVariantToken(token: string) {
   const parts = token.split(":");
   if (parts.length === 1) return { variant: "", utility: token };
   return {
      variant: parts.slice(0, -1).join(":"),
      utility: parts[parts.length - 1],
   };
}

function isArbitraryColor(value: string) {
   const v = value.toLowerCase();
   return (
      v.includes("#") ||
      v.includes("rgb") ||
      v.includes("hsl") ||
      v.includes("oklch") ||
      v.includes("oklab") ||
      v.includes("color(") ||
      v.includes("var(")
   );
}

function isArbitraryLength(value: string) {
   const v = value.toLowerCase();
   return /(^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)?$)|(^calc\()/.test(v);
}

function getUtilityGroup(utility: string): string | null {
   const spacing = utility.match(/^(m|p)([trblxy]?)-/);
   if (spacing) return `${spacing[1]}${spacing[2] || ""}`;

   if (utility === "rounded") return "rounded";
   const rounded = utility.match(/^rounded(?:-([trbl]{1,2}))?-/);
   if (rounded) return rounded[1] ? `rounded-${rounded[1]}` : "rounded";

   if (/^text-(xs|sm|base|lg|xl|[2-9]xl|\[.+\])$/.test(utility)) return "text-size";
   if (/^font-/.test(utility)) return "font";
   if (/^tracking-/.test(utility)) return "tracking";
   if (/^leading-/.test(utility)) return "leading";
   if (/^w-/.test(utility)) return "w";
   if (/^h-/.test(utility)) return "h";
   if (/^min-w-/.test(utility)) return "min-w";
   if (/^max-w-/.test(utility)) return "max-w";
   if (/^min-h-/.test(utility)) return "min-h";
   if (/^max-h-/.test(utility)) return "max-h";
   if (/^(block|inline-block|inline|flex|inline-flex|grid|hidden)$/.test(utility)) return "display";
   if (/^(static|fixed|absolute|relative|sticky)$/.test(utility)) return "position";
   if (/^justify-/.test(utility)) return "justify";
   if (/^items-/.test(utility)) return "items";
   if (/^flex-(row|row-reverse|col|col-reverse)$/.test(utility)) return "flex-dir";

   // border width
   if (utility === "border" || /^border-(0|2|4|8)$/.test(utility)) return "border-width";
   if (/^border-[trblxy]$/.test(utility)) return `border-width-${utility.slice(-1)}`;
   if (/^border-[trblxy]-(0|2|4|8)$/.test(utility))
      return `border-width-${utility.split("-")[1]}`;
   if (/^border-\[(.+)\]$/.test(utility)) {
      const content = utility.slice("border-[".length, -1);
      if (isArbitraryLength(content)) return "border-width";
      if (isArbitraryColor(content)) return "border-color";
   }
   if (/^border-[trblxy]-\[(.+)\]$/.test(utility)) {
      const side = utility.split("-")[1];
      const content = utility.slice(`border-${side}-[`.length, -1);
      if (isArbitraryLength(content)) return `border-width-${side}`;
      if (isArbitraryColor(content)) return `border-color-${side}`;
   }

   // border style / color
   if (/^border-(solid|dashed|dotted|double|none)$/.test(utility)) return "border-style";
   if (/^border-[trblxy]-(solid|dashed|dotted|double|none)$/.test(utility))
      return `border-style-${utility.split("-")[1]}`;
   if (/^border-(?![trblxy](?:-|$))(?!solid$|dashed$|dotted$|double$|none$).+/.test(utility))
      return "border-color";
   if (/^border-[trblxy]-(?!solid$|dashed$|dotted$|double$|none$).+/.test(utility))
      return `border-color-${utility.split("-")[1]}`;

   // ring groups
   if (utility === "ring" || /^ring-(0|1|2|4|8)$/.test(utility)) return "ring-width";
   if (/^ring-\[(.+)\]$/.test(utility)) {
      const content = utility.slice("ring-[".length, -1);
      return isArbitraryColor(content) ? "ring-color" : "ring-width";
   }
   if (utility === "ring-inset") return "ring-inset";
   if (/^ring-opacity-/.test(utility)) return "ring-opacity";
   if (/^ring-offset-(0|1|2|4|8)$/.test(utility)) return "ring-offset-width";
   if (/^ring-offset-\[(.+)\]$/.test(utility)) {
      const content = utility.slice("ring-offset-[".length, -1);
      return isArbitraryColor(content) ? "ring-offset-color" : "ring-offset-width";
   }
   if (/^ring-offset-/.test(utility)) return "ring-offset-color";
   if (/^ring-(?!offset-|inset|opacity-).+/.test(utility)) return "ring-color";

   // shadow groups (size + color coexist)
   if (utility === "shadow" || /^shadow-(sm|md|lg|xl|2xl|inner|none)$/.test(utility))
      return "shadow-size";
   if (/^shadow-\[(.+)\]$/.test(utility)) {
      const content = utility.slice("shadow-[".length, -1);
      return isArbitraryColor(content) ? "shadow-color" : "shadow-size";
   }

   return null;
}

export function cleanClassTokens(tokens: string[]): string[] {
   const slots: string[] = [];
   const exactIndex = new Map<string, number>();
   const groupIndex = new Map<string, number>();

   for (const raw of tokens) {
      const token = raw.trim();
      if (!token) continue;

      const parsed = splitVariantToken(token);
      const group = getUtilityGroup(parsed.utility);
      const groupKey = group ? `${parsed.variant}|${group}` : null;

      if (exactIndex.has(token)) {
         const prev = exactIndex.get(token)!;
         slots[prev] = "";
      }
      if (groupKey && groupIndex.has(groupKey)) {
         const prev = groupIndex.get(groupKey)!;
         slots[prev] = "";
      }

      const idx = slots.length;
      slots.push(token);
      exactIndex.set(token, idx);
      if (groupKey) groupIndex.set(groupKey, idx);
   }

   return slots.filter(Boolean);
}

export function cleanClassString(input: string): string {
   return cleanClassTokens(input.split(/\s+/)).join(" ");
}
