# CSS override layer 구조 문서

## 목적

이 문서는 `app/static/css/style.css`의 현재 override 구조를 기록하기 위한 문서다.

현재 `style.css`는 `legacy-ui.css`를 import한 뒤, service-ready MVP 화면을 안정화하기 위한 최신 CSS 패치들을 순서대로 덮어쓰는 역할을 한다.

## 현재 구조

`style.css`의 기본 구조는 다음과 같다.

    style.css
      ├── CSS entrypoint 주석
      ├── legacy-ui.css import
      ├── v23 Stable Override Layer
      ├── v16-v18 Phone Frame Consistency + Real Mobile Responsive Fix
      ├── v19-v23 UX Flow Fix
      ├── v21-v23 Contract Step Cleanup
      ├── v24 Recording + Processing Polish
      ├── v25 Report Action Clarity
      ├── v26 Report Collision Spotlight
      ├── v27 Report Banner Contrast
      └── v28 Verify Card Clarity

## 중요한 판단

현재 `style.css`는 단순한 스타일 파일이 아니라, 과거 UI 위에 최신 MVP 화면을 맞추기 위한 override layer다.

따라서 CSS 규칙의 순서는 중요하다.  
나중에 작성된 규칙이 이전 규칙을 덮어쓸 수 있으므로, 섹션을 보기 좋게 재배치하는 작업도 화면 변경을 일으킬 수 있다.

## 정리 원칙

- 이번 안정화 단계에서는 `style.css`의 규칙 순서를 임의로 바꾸지 않는다.
- 섹션 이동보다 현재 구조 문서화를 우선한다.
- `@import`는 반드시 파일 상단 근처에 유지한다.
- `legacy-ui.css`는 frozen baseline으로 유지한다.
- `style.css`는 active override layer로 유지한다.
- v-numbered 섹션은 오래되어 보여도 즉시 삭제하지 않는다.
- 삭제나 재배치는 화면 단위 회귀 확인 이후에만 진행한다.

## 향후 정리 방향

대회/시연 전에는 다음 정도까지만 허용한다.

- 섹션 설명 주석 보강
- 명백한 빈 블록 제거
- 중복 후보 문서화
- 화면별 위험도 기록

대회/시연 전에는 다음 작업을 하지 않는다.

- `legacy-ui.css` 삭제
- `@import` 제거
- CSS 파일 대규모 분리
- v-numbered class 삭제
- `!important` 대량 제거
- 섹션 순서 재배치

## 현재 판단

현재 CSS 정리의 다음 목표는 “더 예쁜 파일 구조”가 아니라 “깨지지 않는 MVP 구조”다.

따라서 `style.css`는 현재 순서를 유지하고, 중복/삭제 후보는 별도 문서에 기록한 뒤 나중에 화면 단위로 정리한다.
