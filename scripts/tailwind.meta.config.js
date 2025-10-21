import full from "../src/tw-meta.full.json" assert { type: "json" };

const baseNames = full
   .map((i) => i?.name)
   .filter((n) => typeof n === "string" && n.trim().length > 0);

// ✅ prefix 붙인 전체 클래스 이름 만들기
const prefixedNames = baseNames.map((n) => `ex-tw-tester-${n.replace(/^ex-tw-tester-/, "")}`);

export default {
   prefix: "ex-tw-tester-", // 유지
   content: ["./src/tw-meta.tokens.html"],
   important: true, // ✅ 모든 유틸리티 규칙에 !important 추가
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
