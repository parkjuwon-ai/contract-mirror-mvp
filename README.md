# Contract Mirror MVP

계약미러는 계약 현장에서 녹취 발언과 계약서 조항을 비교해 **불일치 후보**, **확인 질문**, **검증 가능한 리포트**를 보여주는 해커톤용 MVP입니다.

현재 버전은 `v34-route-render-bugfix`입니다. v31 화면 이동 안정화 기준 위에서 상태 기본값, 저장/복원, 초기화 책임을 정리해 localStorage와 화면 상태 꼬임을 줄였습니다.

## 빠른 실행

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

브라우저에서 확인합니다.

```text
http://127.0.0.1:8000
```

## 주요 URL

| URL | 용도 |
|---|---|
| `/` | 일반 사용자 시작 화면 |
| `/judge` | 심사위원/발표자용 검증 화면 |
| `/participant/contractor` | 계약자 모바일 입장 화면 |
| `/participant/explainer` | 설명자 모바일 입장 화면 |
| `/report/demo` | 리포트 화면 |
| `/verify/demo` | QR 검증 화면 |
| `/health` | 서버 상태 확인 |


## 안정화 기준 문서

| 문서 | 용도 |
|---|---|
| `docs/FLOW_LOCK.md` | 발표용 핵심 플로우, 화면 목록, 버튼 이동 경로 고정 |
| `tools/check_frontend_actions.py` | 화면에 노출된 `data-action`과 JS 핸들러 누락 여부 점검 |
| `docs/STATE_LOCK.md` | v32 기준 기본 상태, 저장 상태, 초기화 원칙 고정 |

## 현재 파일 구조

```text
app/
  main.py                  # FastAPI 라우팅/부트 상태 주입
  templates/index.html      # 단일 화면 템플릿
  static/css/legacy-ui.css  # 기존 누적 UI 스타일, 가급적 수정 금지
  static/css/style.css      # 현재 최종 override CSS, 급한 UI 수정은 여기서만
  static/js/app.js          # 데모 상태/화면 렌더링/화면 이동 로직

docs/
  DEVELOPMENT_RULES.md      # 앞으로 수정할 때 지킬 기준
  PROJECT_STRUCTURE.md      # 코드 구조 설명
  history/                  # 과거 패치/가이드 기록

tools/
  apply_v18_cleanup_local.sh
  health_check.sh
```

## 수정 원칙

1. **급한 UI 수정은 `app/static/css/style.css` 하단에서만 합니다.**  
   `legacy-ui.css`는 과거 스타일이 누적된 기반 파일이라, 여기저기 수정하면 다시 꼬일 가능성이 큽니다.

2. **HTML 구조는 최대한 유지합니다.**  
   현재 JS가 `#screen`, `.phone-frame`, `.phone-screen`, `#trustPanel`, `#controlPanel`에 의존합니다.

3. **화면 이동은 `goTo(step)` 중심으로 처리합니다.**  
   버튼 핸들러에서 직접 `state.step`을 바꾸지 않고, `goTo()`가 타이머 정리·렌더링·스크롤 초기화를 맡도록 유지합니다.

4. **상태 기본값은 `BASE_STATE`와 `normalizeSavedState()`를 기준으로 관리합니다.**  
   localStorage에 저장할 값은 `PERSISTED_STATE_KEYS`에 포함된 값으로 제한하고, 토스트·모달·타이머 같은 임시 UI 상태는 저장하지 않습니다.

4. **로컬 중복 폴더는 삭제하지 말고 `_archive/`로 보관 이동합니다.**  
   아래 명령을 사용하세요.

```bash
bash tools/apply_v18_cleanup_local.sh
```

## 제출 전 체크

```bash
bash tools/health_check.sh
```

이 스크립트는 실행에 방해되는 캐시, 중복 CSS 파일, 주요 파일 누락 여부, JS 문법, 프론트엔드 액션 누락 여부를 빠르게 확인합니다.


## v33 Flow Bugfix
- UI step is now treated as route/tab-local state to prevent participant tabs from resetting the host flow.
- `go-mobile-report` and `go-report` now mark AI processing complete before navigating to the report.
- Storage sync updates shared consent/report data without forcing the current tab to another screen.
