# CSS 정리 후보 문서

## 목적

이 문서는 Contract Mirror MVP의 CSS 정리 후보를 기록하기 위한 문서다.

현재 CSS는 `legacy-ui.css`를 기준 파일로 유지하고, `style.css`에서 최신 MVP 화면을 덮어쓰는 구조다.  
따라서 이번 안정화 단계에서는 CSS를 바로 삭제하지 않고, 위험도가 낮은 정리 후보와 높은 정리 후보를 분리해서 기록한다.

## 현재 CSS 구조

    index.html
      └── style.css
            └── legacy-ui.css

## 현재 확인 수치

### `!important` 사용량

| 파일 | `!important` 개수 |
|---|---:|
| `app/static/css/style.css` | 179 |
| `app/static/css/legacy-ui.css` | 611 |
| 합계 | 790 |

### `@media` 사용 위치

`style.css`에는 다음 위치에 반응형 규칙이 있다.

    38:@media (min-width: 768px)
    140:@media (max-width: 767px)
    294:@media (max-width: 767px)
    337:@media (max-width: 420px)
    399:@media (max-width: 767px)
    585:@media (max-width: 980px)
    595:@media (max-width: 767px)
    759:@media (max-width: 767px)
    814:@media (max-width: 767px)
    938:@media (max-width: 767px)

`legacy-ui.css`에도 다수의 반응형 규칙이 존재한다.  
따라서 모바일 화면과 발표용 데스크톱 목업을 모두 확인하기 전에는 `@media` 규칙을 재배치하거나 삭제하지 않는다.

## 현재 판단

`legacy-ui.css`는 기존 UI 스타일이 누적된 기준 파일이다.  
`style.css`는 service-ready MVP 화면을 위한 active override layer다.

따라서 CSS 정리는 다음 순서로 진행해야 한다.

    구조 파악
      → 정리 후보 기록
      → 화면 단위 회귀 확인
      → 안전한 미세 정리
      → 나중에 대규모 정리

## 삭제 금지 후보

아래 항목은 대회/시연 전에는 삭제하지 않는다.

### 1. `legacy-ui.css` 전체

`legacy-ui.css`는 현재 화면의 기준 스타일 역할을 한다.  
현재는 `style.css`가 이 파일 위에 최신 스타일을 덮어쓰고 있으므로, 전체 삭제나 import 제거는 위험하다.

### 2. JavaScript 렌더링 class

JS 화면 파일 안에서 생성되는 class는 사용 여부를 CSS 파일만 보고 판단하기 어렵다.

특히 다음 경로의 class는 삭제 전 검색과 화면 확인이 필요하다.

- `app/static/js/screens/supportScreens.js`
- `app/static/js/screens/judgeScreens.js`
- `app/static/js/screens/resultScreens.js`
- `app/static/js/screens/contractFlowScreens.js`
- `app/static/js/screens/recordingScreens.js`
- `app/static/js/screens/analysisScreens.js`

### 3. 버전형 class

아래 유형의 class는 오래되어 보여도 현재 화면에서 사용 중일 수 있다.

    *-v12
    *-v13
    *-v15
    *-v612
    *-v23
    *-v24
    *-v25
    *-v26
    *-v27
    *-v28

### 4. 대회 시연 핵심 화면 class

아래 화면 관련 CSS는 삭제 전 반드시 브라우저에서 확인한다.

- 첫 화면
- 계약자/설명자 역할 선택 화면
- 계약서 업로드 화면
- 양측 동의 화면
- 녹취 진행 화면
- AI 분석 중 화면
- 결과 리포트 화면
- 사후 확인 문서 화면
- QR / 최종 확인 카드 화면
- 심사위원 검증 콘솔

## 정리 가능 후보

아래 항목은 향후 정리 후보로 기록한다.  
단, 이번 MVP 안정화 단계에서는 바로 삭제하지 않는다.

### 1. 반복되는 `!important`

현재 CSS에는 legacy override를 위해 `!important`가 많이 사용되어 있다.  
대회 전에는 대량 제거하지 않고, 화면 단위 리팩터링 시 점진적으로 줄인다.

### 2. 반복되는 반응형 `@media` 규칙

`style.css`와 `legacy-ui.css` 모두에 반응형 규칙이 존재한다.  
모바일 화면과 발표용 데스크톱 목업이 모두 중요하므로, `@media` 규칙은 삭제 전 실제 화면 확인이 필요하다.

### 3. 중복 카드 스타일

다음 계열은 중복 가능성이 있다.

- card
- panel
- report
- verify
- judge
- action
- button
- badge

하지만 이름이 유사해도 화면별 역할이 다를 수 있으므로, 일괄 병합하지 않는다.

### 4. 오래된 UX 패치 섹션

`style.css`에는 v-numbered override 섹션이 존재한다.  
이 섹션들은 과거 패치 흔적이지만, 현재 최신 화면을 유지하는 데 필요할 수 있다.

따라서 섹션 자체는 유지하고, 나중에 화면 단위로 검증한 뒤 정리한다.

## 이번 브랜치에서 허용하는 작업

이번 `stabilize/service-ready-mvp` 브랜치에서는 아래 작업까지만 허용한다.

- CSS 현황 문서화
- CSS class 사용 위치 문서화
- override layer 구조 문서화
- 정리 후보 문서화
- 주석 추가
- 빈 블록 제거
- 명백한 오타 수정
- 화면 변경 없는 공백 정리

## 이번 브랜치에서 하지 않는 작업

대회/시연 안정성을 위해 아래 작업은 하지 않는다.

- `legacy-ui.css` 삭제
- `@import` 제거
- CSS 파일 대규모 분리
- class 이름 변경
- v-numbered class 삭제
- `!important` 대량 제거
- `@media` 규칙 재배치
- 시각 변경이 큰 디자인 리팩터링

## 최종 판단

현재 CSS는 지저분하지만, MVP 화면을 유지하기 위한 실제 기능적 역할을 하고 있다.  
따라서 이번 단계의 목표는 “깨끗한 CSS”가 아니라 “깨지지 않는 CSS 정리 기준”을 만드는 것이다.
