# Development Rules for Hackathon Stabilization

해커톤 전까지는 “완전한 리팩터링”보다 “깨지지 않는 업데이트”가 우선입니다.

## 1. CSS 수정 위치

- 기본값/과거 누적 스타일: `app/static/css/legacy-ui.css`
- 현재 수정/최종 보정 스타일: `app/static/css/style.css`

원칙적으로 `legacy-ui.css`는 읽기 전용처럼 다룹니다. 새로운 UI 보정은 `style.css`의 마지막 구역에 추가하세요.

## 2. HTML에서 유지해야 하는 핵심 ID/Class

JS가 아래 선택자에 의존합니다. 이름을 바꾸면 화면 렌더링이 깨질 수 있습니다.

- `#screen`
- `.phone-frame`
- `.phone-screen`
- `#workspace`
- `#trustPanel`
- `#controlPanel`
- `#phasePill`
- `#progressSummary`

## 3. 모바일/데스크톱 기준

- `min-width: 768px`: 심사위원이 보는 데스크톱 목업 모드
- `max-width: 767px`: 실제 모바일 웹앱 모드

모바일에서 목업 테두리가 다시 보이면 `style.css`의 모바일 override를 먼저 확인하세요.

## 4. 새 기능 추가 순서

1. `state`에 필요한 상태값 추가
2. 렌더 함수 추가 또는 기존 렌더 함수 분기 추가
3. 버튼 이벤트를 `bindEvents()` 계열에 연결
4. 필요한 스타일은 `style.css` 하단에 추가
5. `/`, `/judge`, `/participant/contractor`, `/participant/explainer`, `/report/demo`, `/verify/demo` 확인

## 5. 금지에 가까운 작업

- 제출 직전 `legacy-ui.css` 대규모 삭제
- `index.html`의 핵심 wrapper 구조 변경
- `app.js`를 여러 파일로 쪼개기
- 화면별 CSS 파일을 새로 계속 추가하기

이 작업들은 장기적으로는 맞지만, 현재 MVP 안정화 단계에서는 리스크가 큽니다.
