# Tailwind Extension (1인 개발)

> 웹 요소 스타일을 Tailwind 클래스로 변환하고, 상태별 UI를 테스트하는 Chrome Extension

---

## 📌 Overview

- **Chrome Extension (Manifest V3)** 기반 Tailwind 변환/테스트 도구
- 페이지 요소 선택 시 computed style을 읽어 **Tailwind 클래스 자동 변환**
- `hover / active / focus / disabled` 상태를 **UI Tester에서 실시간 시뮬레이션**
- 사이트 CSS 충돌을 줄이기 위해 **iframe 격리 UI**로 동작
- 최근 개선: **변환 정확도 개선 + 부모 체인 탐색 + 프리셋 저장/정렬/덮어쓰기**

---

## 🚀 Key Features

### 1) Tailwind Converter

- 선택 요소의 스타일을 Tailwind 클래스로 변환
- 카테고리(Typography/Color/Box Model/Layout/Effects)별 분류 제공
- 부모 체인 breadcrumb 탐색 지원 (`a > b > ... > z`)
- 부모 클릭 시 타겟/변환 결과/하이라이트 박스 동기 갱신

### 2) Tailwind UI Tester

- 선택 요소를 복제해 상태별 클래스 입력 및 실시간 미리보기
- `Active / Hover / Disabled / Focus` 별도 입력 가능
- 부모 체인 이동 시 입력 상태 초기화로 테스트 오염 방지

### 3) Preset Workflow

- 상태 입력값 프리셋 **Save / Update / Delete / Apply**
- `chrome.storage.local` 저장
- 중복 이름 방지, 최신순/이름순 정렬 지원
- 버튼 액션 피드백(`Saved! / Updated! / Deleted!`) 제공

---

## 🔧 Recent Improvements (2026.03.21 ~ 2026.03.22)

- Converter 수치 매핑에 임계값(tolerance) 적용  
  (오차 큰 값은 스케일 강제 매핑 대신 arbitrary value fallback)
- 색상 거리 기반 Tailwind 토큰 매칭 추가 (`text-*`, `bg-*`, `border-*`)
- content 빌드 시 `dist` 산출물 유실 문제 수정 (`emptyOutDir: false`)
- Tester 프리셋 패널을 플로팅 형태로 분리 + 스크롤/클리핑 이슈 수정
- Converter/Tester/Popup 컨테이너 다크모드 컬러 톤 통일

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, TailwindCSS
- **Build:** Vite 7 (multi entry: popup/background/content)
- **Extension:** Chrome Extension Manifest V3
- **Etc:** Fuse.js, react-colorful

---

## 📁 Project Structure

- `src/background.ts`: context menu / toggle / message routing
- `src/content/index.tsx`: iframe UI mount, inspector popup lifecycle
- `src/content/inspector.ts`: 요소 하이라이트 overlay/label
- `src/content/apps/converter.tsx`: 변환 UI + 부모 체인 탐색
- `src/content/apps/tester.tsx`: 상태 테스트 UI + 프리셋 관리
- `src/hooks/useConverter.ts`: CSS -> Tailwind 변환 핵심 로직

---

## ⚙️ Setup & Usage

```bash
# install
npm install

# dev (watch)
npm run dev

# production build
npm run build

# lint
npm run lint
```

빌드 후 `dist/`를 Chrome 확장 프로그램 개발자 모드에서 로드해 사용합니다.
