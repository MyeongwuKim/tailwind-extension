# Tailwind Extension (크롬 익스텐션) — 1인 개발
> React + Tailwind + Vite 기반 스타일 변환 크롬 익스텐션

🔗 **Deployment URL**  
(등록 예정)

---

## 📌 Summary
- 웹 요소의 실제 스타일을 추출해 **Tailwind CSS 클래스 형태로 자동 변환**하는 크롬 익스텐션  
- **Vite + React + TypeScript** 기반 멀티 엔트리 구조(`content script`, `popup`, `background`)  
- DOM 요소 선택 → CSS → Tailwind 변환 + UI 테스트 기능 제공  
- **Fuse.js 기반 자동완성**, **Color Picker**, **Hover/Active 시뮬레이션** 제공  
- 사이트와 충돌하지 않도록 **iframe 기반 UI 격리 처리**

---

## 📖 Background
사이드 프로젝트를 진행할 때, 다른 웹사이트의 UI 스타일을 참고해  
Tailwind로 다시 구현하는 작업을 자주 했습니다.  
하지만 매번 개발자 도구를 열고, CSS 속성을 직접 확인하고  
Tailwind 스케일에 맞게 다시 변환하는 과정은  
불편하고 반복적이며 시간이 많이 들었습니다.

“이걸 자동으로 변환해주는 도구가 있다면 얼마나 편할까?”  
그 단순한 생각 하나로 이번 프로젝트를 시작했습니다.

제가 만들고자 한 익스텐션은:

- 원하는 DOM 요소를 클릭하면 CSS를 자동으로 추출하고  
- Tailwind 테마 스케일에 맞춰 **근사 매칭된 Tailwind 유틸리티 클래스**를 생성하며  
- 추가로 hover/focus/active 상태 전환을 테스트할 수 있는 UI 테스터까지 제공하는 기능  

이 프로젝트는 단순 편의 기능을 넘어,  
앞으로 개발 속도를 크게 높여줄 수 있는 실험적인 도구가 될 수 있었습니다.

---

## 💡 What I Learned
이번 프로젝트는 **크롬 익스텐션 구조**,  
그리고 웹 환경에서의 **CSS 처리 방식**을 깊이 이해한 경험이었습니다.

가장 먼저 마주한 문제는 **멀티 엔트리 Vite 설정**이었습니다.  
`content script`, `popup`, `background` 각각 번들 방식이 달라  
빌드 환경 충돌을 해결하기 위해 엔트리를 분리하고 경로를 재구성해야 했습니다.

또한 가장 핵심 기능인 **CSS → Tailwind 변환 로직**도 만만치 않았습니다.  
`getComputedStyle()`로 읽어온 실제 스타일 값은 매우 방대했고,  
이를 Tailwind 스케일에 맞춰 변환하려면  
정확도와 성능 사이에서 균형을 잡는 것이 중요했습니다.

이를 해결하기 위해 Tailwind 설정을 JSON 형태로 덤프하여 활용하고,  
정확한 매핑이 어려운 값은 Tailwind의 브라켓 표기법으로 안전하게 변환했습니다.  
또한 hover/active 같은 상태를 직접 시뮬레이션하는 기능도 구현하며  
UI 단위 테스트 환경을 브라우저에서 직접 구축할 수 있었습니다.

처음 진행하는 익스텐션 + Vite 프로젝트였지만  
꽤 재미있었고, 앞으로의 사이드 프로젝트에서도  
개발 효율을 높이는 중요한 경험이 되었습니다.

---

## 🔥 Challenges & Solutions

### 1) Tailwind Converter

Tailwind 변환 기능을 구현하면서, getComputedStyle()이 반환하는 스타일 속성이 너무 방대해
모든 스타일을 Tailwind로 전환하는 것은 불가능하다는 문제를 먼저 마주했습니다.

그리고 단순히 값을 그대로 변환한다고 해서
Tailwind 클래스와 1:1로 정확하게 매칭되는 구조가 아니라는 점도 큰 어려움이었습니다.
예를 들어 margin, padding, font-size처럼 Tailwind 스케일이 정해져 있는 값들은
실제 CSS 값과 미묘하게 다른 경우가 많아서
정확한 대응 관계를 찾는 것이 생각보다 훨씬 까다로웠습니다.

그래서 변환 가능한 속성만 제한해서 가져오고,
그 안에서도 Tailwind 스케일과 가장 가까운 값을 찾아 근사 매칭하는 방식으로 접근해야 했습니다.

#### ✔ 변환 가능한 속성만 추출하기 위한 `allowedProps`

```ts
const allowedProps = [
  "display",
  "color",
  "background-color",
  "width",
  "height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-size",
  "font-weight",
  "flex-direction",
  "justify-content",
  "align-items",
  "gap",
  "text-align",
  "line-height",
  "letter-spacing",
  "box-shadow",
  "text-overflow",
  "text-decoration",
  "border-radius",
];
```

이 리스트를 기준으로:

- `getComputedStyle`에서 **불필요한 값 제거**  
- Tailwind로 표현 가능한 속성만 **정확하게 변환**  
- 변환 과정 성능 개선 및 안정성 확보  

#### ✔ Tailwind 설정(fullConfig) 기반 근사값 매핑

Tailwind 테마 스케일은 특정 단위로 고정되어 있기 때문에  
CSS를 그대로 변환하면 어색한 경우가 많았습니다.  
예: `font-size: 15px` → Tailwind 기본 스케일에 없음.

이를 해결하기 위해 Tailwind 설정을 JSON으로 변환해 사용했습니다.

```ts
import fullConfig from "../full-config.json";

fullConfig.theme.fontSize;
fullConfig.theme.spacing;
fullConfig.theme.borderRadius;
```

매핑 방식은 다음과 같았습니다:

- Tailwind 스케일 중 가장 가까운 값으로 **근사 매핑**
- 스케일 밖의 값은 `text-[15px]` 같은 **브라켓 표기법**으로 처리
- 색상처럼 방대한 값은 대부분 **브라켓 표기법**으로 해결해 안정성 확보

#### ✔ fullConfig 사용을 위한 Vite 설정 구성

Tailwind 설정을 JSON으로 직접 불러오기 위해 다음을 구성했습니다:

1. **Tailwind config → JSON 변환 스크립트 자동화**

Tailwind 설정을 매번 수동으로 변환하는 대신,
package.json에 스크립트를 등록해 빌드 전에 자동으로 full-config.json이 생성되도록 구성했습니다.

```js
import fs from "fs";
import resolveConfig from "tailwindcss/resolveConfig.js";
import tailwindConfig from "../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
//필요한 css값만 가져와서 json파일을 생성하도록함 ( color 제외시킴)
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
```
그리고 package.json에서는 다음처럼 설정했습니다:

```ts
  "scripts": {
      "meta:generate": "tsx scripts/gen-tw-meta.ts full && tsx scripts/gen-tw-tokens.ts",
      "meta:fix": "node lib/fix-variant-order.js",
      "meta:build": "npm run meta:generate && npm run meta:fix && npx tailwindcss -c ./scripts/tailwind.meta.config.js -i ./src/tw-meta.entry.css -o ./src/tw-meta.built.css --minify",
      "dev:css": "tailwindcss -i ./src/global.css -o ./src/tailwind.css --watch",
      "dev:main": "vite build --config vite.config.ts --watch",
      "dev:content": "vite build --config vite.content.config.ts --watch",
      "dev": "npm run dump-config && npm run meta:build && npm-run-all --parallel dev:css dev:main dev:content",
      "build:css": "tailwindcss -i ./src/global.css -o ./src/tailwind.css --minify",
      "build:main": "vite build --config vite.config.ts",
      "build:content": "vite build --config vite.content.config.ts",
      "build": "npm run dump-config && npm run meta:build && npm run build:css && npm run build:main && npm run build:content",
      "lint": "eslint .",
      "dump-config": "tsx scripts/dump-config.js"
   },
```

이렇게 구성해두면 빌드 명령어만 실행해도:

```ts
npm run build
```

→ full-config.json 자동 생성
→ 이어 Vite 빌드 실행

이 흐름이 순차적으로 이루어져,
확장 프로그램 개발 과정에서 Tailwind 설정이 항상 최신 상태로 유지되도록 했습니다.

이를 통해 content script, popup 등 여러 엔트리에서  
동일한 Tailwind 설정을 안정적으로 사용할 수 있었습니다.

--- 

### 2) Tailwind Tester

Tailwind Tester 기능은 단순히 변환된 클래스를 보여주는 수준이 아니라,
사용자가 Tailwind 스타일을 직접 적용하고 상태 변화까지 테스트할 수 있는 환경을 만드는 것이 목표였습니다.

#### ✔ 아이디어 접근의 문제

처음에 생각했던 방식은 **원본 페이지의 실제 DOM 요소에 Tailwind를 바로 적용해서 테스트하는 방식** 이였습니다.
막상 구현을 시작하자마자 예상하지 못한 문제들이 연달아 발생했습니다.

- 사이트 기존 CSS가 Tailwind 상태 스타일을 계속 덮어써 테스트가 불가능함
- hover/active/focus 상태를 JS로 강제로 유지할 수 없어 즉시 풀려버림
- 원본 요소에 Tailwind를 적용하면 레이아웃이 깨져 페이지가 무너짐

그래서 다른 접근법이 필요 했습니다. 많은 고민끝에 선택한 방법은:

선택한 DOM 요소를 cloneNode(true)로 복사 →
이 클론을 별도의 iframe 내부 Preview 영역에 렌더링 →
Tailwind 상태 스타일은 이 Preview에만 적용하기.

이 구조로 전환하면서 문제들이 한 번에 해결됐습니다:

- 원본 사이트와 완전히 분리되어 CSS 충돌이 사라짐

- hover / active / focus 상태를 JS로 강제로 토글해도 안정적으로 유지

- Tailwind 클래스를 수정하면 Preview에 즉시 반영되어
Tailwind Playground처럼 실시간 테스트 환경 구현

####  ✔ 색상(color) 자동완성

Tailwind Tester에서 Tailwind 입력창을 만들면서
bg- 를 입력하면 bg-red-500, bg-blue-600 같은 Tailwind 컬러 목록이 자동완성되도록 구현하고 싶었습니다.
하지만 Tailwind 컬러 스케일이 종류도 너무 많고 단계도 방대해서,
자동완성만으로는 Tester라고 하기엔 기능이 너무 제한적이고 표현력도 부족하다는 문제가 있었습니다.

그래서 단순히 “목록에서 골라 쓰는 Tester”가 아니라
원하는 모든 색을 직접 선택하고 즉시 Tailwind 문법으로 적용할 수 있는 Tester가 필요하다고 판단했습니다.

이 문제를 해결하기 위해 Color Picker를 추가했고,
bg-[ 또는 text-[ 를 입력하면 Picker가 자동으로 열리도록 구성했습니다.
사용자가 색을 고르면 bg-[#xxxxxx]처럼 Tailwind의 브라켓 문법으로 자동 입력되도록 하여
Tailwind 색상 스케일의 한계를 넘어, 어떤 색이든 바로 Tailwind 형태로 테스트할 수 있게 만들었습니다.

---

### 3) 충돌문제

만들어낸 Tailwind css 파일을 웹페이지에 style에 삽입하여 사용할때
웹페이지가 Tailwind style에 덮혀져 깨지는 문제가 발생했었습니다.

#### ✔ 스타일 충돌 방지를 위한 prefix 설정

웹사이트의 기존 CSS와 충돌하지 않도록  
변환된 Tailwind 클래스에는 prefix를 적용했습니다.

- `ex-tw-*` : Tailwind 변환 클래스  
- `ex-ov-*` : Hover/Active 시뮬레이션 클래스  

이를 통해 원본 스타일에 영향을 주지 않고  
독립적으로 Tailwind 스타일을 적용할 수 있었습니다.

---

## 🛠 Technology Stack
- **Frontend:** React, Tailwind  
- **Bundler:** Vite  
- **Etc:** Fuse.js, Chrome Extensions API

---

## ⚙️ Setup & Usage

```bash
npm install
npm run build
```

익스텐션은 `dist/` 폴더를 Chrome 확장 프로그램에 로드하여 실행할 수 있습니다.
