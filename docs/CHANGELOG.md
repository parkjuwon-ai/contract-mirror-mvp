# Changelog

## v34-route-render-bugfix

- v31 화면 이동 안정화 기준 위에서 프론트엔드 상태 관리 기준을 정리했습니다.
- `BASE_STATE`, `createDefaultState()`, `normalizeSavedState()`를 추가해 기본 상태와 복원 상태의 책임을 분리했습니다.
- `PERSISTED_STATE_KEYS`와 `createPersistedSnapshot()`을 추가해 localStorage에 저장되는 상태를 명시적으로 제한했습니다.
- `replaceState()`, `resetDemoState()`, `resetConsentState()`를 추가해 전체 초기화와 동의 초기화 책임을 분리했습니다.
- localStorage 복원/동기화 시 화면·기기·모드 유효성을 검증하고, 토스트·모달·타이머 같은 임시 상태가 저장되지 않도록 정리했습니다.
- `docs/STATE_LOCK.md`를 추가해 v32 이후 상태값 추가/저장/초기화 원칙을 고정했습니다.

## v31-navigation-baseline

- v30 안정화 기준 위에서 화면 이동을 `goTo()` 중심으로 정리했습니다.
- `NAVIGATION_TARGETS`를 추가해 버튼 이동 대상 문자열을 한곳에서 관리합니다.
- `goTo()`가 화면 전환, 처리 타이머 정리, processing 진입 처리, 스크롤 초기화 여부를 담당하도록 했습니다.
- `render()`가 `forceScrollToTop` 옵션을 받아 같은 화면 내부 업데이트에서는 스크롤을 유지할 수 있게 했습니다.
- 버튼 액션 라우트의 주요 `setStep()` 호출을 `goTo(NAVIGATION_TARGETS.XXX)`로 바꿔 화면 이동 책임을 분리했습니다.
- `docs/FLOW_LOCK.md`를 v31 기준으로 업데이트했습니다.

## v30-stability-baseline

- 디자인 추가를 멈추고 해커톤 전 안정화 기준 버전으로 고정했습니다.
- `APP_VERSION`과 `localStorage` 키를 v30 기준으로 갱신해 이전 캐시와 섞일 가능성을 줄였습니다.
- `SCREEN_STEPS`, `DEVICE_TYPES`, `MODE_TYPES`, `WORKSPACE_STEPS`를 상수화해 화면/기기/모드 책임을 더 명확히 했습니다.
- 화면 이동 기준과 핵심 플로우를 `docs/FLOW_LOCK.md`로 문서화했습니다.
- 사용하지 않는 `handleAction()` 라우트 일부를 제거해 버튼 액션 표면적을 줄였습니다.
- `tools/check_frontend_actions.py`를 추가하고 `tools/health_check.sh`에 JS 문법/프론트 액션 점검을 포함했습니다.

## v29-addendum-step-polish

- 추가 확인 문서 선택 단계의 라벨을 `선택 단계 · 사후 확인 문서`로 정리했습니다.
- `원 분석 세션` 표현을 `분석 결과`로 바꾸어 사용자에게 더 자연스럽게 보이도록 했습니다.
- 첨부 전 상태를 `선택`이 아니라 `미첨부`로 표시해 현재 상태가 명확히 보이도록 했습니다.
- 사후 문서 안내 문구를 짧게 정리해 기존 AI 분석 결과는 유지되고, 답변서·확약서 같은 사후 근거만 함께 보관된다는 점을 분명히 했습니다.


## v24-recording-processing-polish

- 녹취 화면의 양측 참여자 카드를 모바일에서도 좌우 배치로 유지했습니다.
- `녹취 길이` 문구를 `녹취 시간`으로 정리했습니다.
- 녹취 종료 CTA를 `녹취 종료 후 AI 분석 시작하기`로 자연스럽게 변경했습니다.
- AI 분석 화면 진입 이후 상태 업데이트 중 스크롤이 자동으로 위로 튀지 않도록 수정했습니다.
- AI 분석 화면 상단 여백을 줄여 핵심 내용이 더 빨리 보이도록 조정했습니다.

## v23-participant-flow-polish

- 사용자 화면에 노출되던 `데모: 설명자 입장 완료 처리` 버튼을 제거했습니다.
- 초대 화면의 상태 안내문을 짧고 실제 서비스처럼 보이도록 정리했습니다.
- 설명자/계약자 본인확인 화면의 문구를 검증 기록 연결 중심으로 개선했습니다.
- 초대 참여 플로우에서 `데모` 표현을 제거했습니다.

## v22-contract-file-support
- Step 1 등록 화면에서 `이후 버전`, `시연`, `PDF 고정`처럼 미완성으로 보일 수 있는 안내 문구를 제거했습니다.
- `PDF 계약서 불러오기`를 `계약서 파일 불러오기`로 바꾸고, 지원 형식을 `PDF · JPG · PNG`로 표시했습니다.
- 기존 구조를 유지한 채 `app.js` 문구와 `style.css`의 사용하지 않는 보조 안내 스타일만 정리했습니다.


## v21-contract-step-cleanup

- Step 1 계약서 등록 화면에서 PDF 업로드를 단일 메인 액션으로 정리했습니다.
- 링크 불러오기/카메라 스캔은 시연 핵심 흐름을 흐리지 않도록 보조 안내로 낮췄습니다.
- 등록된 계약서 확인 화면의 `X` 버튼을 `다른 파일로 변경` 버튼으로 바꿔 의미를 명확히 했습니다.
- 사후 확인 문서 안내 문구를 현재 단계에 맞게 `추가 문서는 나중에 첨부` 흐름으로 정리했습니다.

## v18-codebase-cleanup

- `__pycache__`, `*.pyc`를 배포 ZIP에서 제거했습니다.
- README의 오래된 `styles.css` 안내를 현재 구조에 맞게 수정했습니다.
- 과거 UI 가이드 문서를 `docs/history/ui-guides/`로 이동했습니다.
- `app/main.py`에 `APP_VERSION`과 `/health` 엔드포인트를 추가했습니다.
- HTML/CSS/JS 캐시 버전을 `v18-codebase-cleanup` 기준으로 갱신했습니다.
- 로컬 중복 폴더 정리 스크립트와 프로젝트 상태 점검 스크립트를 추가했습니다.

## v17-cleanup

- CSS 진입점을 `style.css`로 고정했습니다.
- 과거 누적 CSS를 `legacy-ui.css`로 분리했습니다.
- 로컬 중복 폴더를 `_archive/`로 보관 이동하는 정리 방식을 도입했습니다.


## v19-ux-flow-fix

- 양측 준비 상태 화면에서 대형 체크/스피너가 카드 위에 겹치던 문제를 제거하고 상태판 형태로 정리했습니다.
- 설명자 입장 전에도 초대 화면에서 양측 준비 상태 화면으로 이동할 수 있게 하여, 사용자가 대기 중 진행 상황을 이해할 수 있도록 했습니다.
- 리포트 화면의 CTA를 `추가확인문서 첨부하기`와 `현재 리포트로 확인 카드 만들기`로 분리했습니다.

## v20-home-clarity-fix

- 첫 화면의 메인 문구를 더 직관적인 표현으로 조정했습니다.
- 첫 화면 보조 CTA를 실제 이동 결과에 맞춰 `설명자로 참여하기`로 변경했습니다.
- 데스크톱 심사 화면에서 시작 버튼이 더 빨리 보이도록 목업 높이와 상단 여백을 소폭 조정했습니다.
- 새 CSS 파일을 추가하지 않고 기존 `style.css`의 안정화 레이어 안에서만 수정했습니다.

## v28-verify-card-clarity

- 최종 확인 카드 화면의 완료 문구를 검증 기록 중심으로 정리했습니다.
- 확인 기록 ID를 검증 기록 ID로 통일했습니다.
- 대표 확인 지점 카드로 녹취 발언, 계약서 조항, 확인 질문을 함께 보여줍니다.
- 기술 검증 정보 큰 카드를 제거하고 고급 검증 정보 보기 링크로 축소했습니다.
- 오른쪽 버튼 위계를 확인 링크 복사, 리포트로 돌아가기, 새 계약 검증하기 순서로 정리했습니다.
- 모바일에서 QR이 완전히 아래에 묻히지 않도록 QR 보기 진입점을 추가했습니다.

## v27-report-banner-contrast

- 리포트 상단 남색 배너에 `녹취`와 `계약서` 미니 대비를 추가해, 대표 충돌 지점이 스크롤 없이 먼저 보이도록 했습니다.
- `가장 먼저 확인할 질문` 문구를 `가장 먼저 확인할 충돌 지점`으로 바꾸어 질문보다 불일치 장면이 먼저 인식되도록 정리했습니다.
- 메인 CTA는 `이 리포트로 확인 카드 만들기`를 유지해 서비스가 질문 생성기가 아니라 검증 기록 서비스처럼 보이도록 했습니다.

## v26-report-collision-spotlight

- 리포트 상단 제목을 `계약 전 확인할 설명-계약서 충돌 3건`으로 변경했습니다.
- 남색 배너를 일반 안내가 아니라 `가장 먼저 확인할 질문`으로 바꿔 핵심 질문이 즉시 보이게 했습니다.
- 첫 번째 질문 카드를 `충돌 지점 1` 대표 카드로 확장해 녹취 발언, 계약서 조항, AI 판단, 확인 질문을 한 카드에서 보여줍니다.
- 나머지 질문은 요약형 카드로 유지해 리포트가 다시 복잡해지지 않도록 했습니다.
- CTA는 `이 리포트로 확인 카드 만들기`를 메인으로 유지하고, 질문 복사와 추가 문서 첨부는 보조 행동으로 정리했습니다.


## v33 Flow Bugfix
- UI step is now treated as route/tab-local state to prevent participant tabs from resetting the host flow.
- `go-mobile-report` and `go-report` now mark AI processing complete before navigating to the report.
- Storage sync updates shared consent/report data without forcing the current tab to another screen.
