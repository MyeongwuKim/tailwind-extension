import fs from "fs";
import resolveConfig from "tailwindcss/resolveConfig.js"; // ✅ .js 확장자 붙임
import tailwindConfig from "./tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);

fs.writeFileSync("full-config.json", JSON.stringify(fullConfig, null, 2));

console.log("✅ Tailwind config dumped to full-config.json");
