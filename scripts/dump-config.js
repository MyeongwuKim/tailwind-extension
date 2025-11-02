import fs from "fs";
import resolveConfig from "tailwindcss/resolveConfig.js";
import tailwindConfig from "../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);

const minimalTheme = {
   theme: {
      spacing: fullConfig.theme.spacing,
      fontSize: fullConfig.theme.fontSize,
      borderRadius: fullConfig.theme.borderRadius,
      boxShadow: fullConfig.theme.boxShadow,
      borderWidth: fullConfig.theme.borderWidth,
      padding: fullConfig.theme.padding,
   },
};

fs.writeFileSync("./src/full-config.json", JSON.stringify(minimalTheme, null, 2));
console.log("✅ Minimal Tailwind config dumped (no color data)");
