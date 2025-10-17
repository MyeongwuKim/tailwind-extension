import full from "../src/tw-meta.full.json" assert { type: "json" };

const baseNames = full
   .map((i) => i?.name)
   .filter((n) => typeof n === "string" && n.trim().length > 0);

// ✅ prefix 붙인 전체 클래스 이름 만들기
const prefixedNames = baseNames.map((n) => `ex-tw-${n.replace(/^ex-tw-/, "")}`);

export default {
   prefix: "ex-tw-", // 유지
   content: ["./src/tw-meta.tokens.html"],

   safelist: [
      // 기본 클래스
      ...prefixedNames,
      // ✅ variant 강제 safelist
      ...["hover", "focus", "active", "disabled", "dark"].flatMap((v) =>
         prefixedNames.map((name) => `${v}:${name}`)
      ),
   ],

   corePlugins: { preflight: false },
};
