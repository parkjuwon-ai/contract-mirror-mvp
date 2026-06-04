# Contract Mirror MVP

Contract Mirror는 계약 현장에서 설명된 녹취 내용과 실제 계약서 조항을 비교해 **불일치 후보**, **확인 질문**, **분석 리포트**, **QR 검증 카드**를 생성하는 AI + DID/Chain 기반 계약 설명 검증 MVP입니다.

이 MVP는 해커톤 시연을 위해 모바일 현장 플로우, 심사위원 검증 콘솔, DB-backed 세션/리포트/검증 흐름을 하나의 FastAPI 웹앱으로 구현한 버전입니다.

## Current MVP Status

- FastAPI 기반 웹앱
- SQLite DB-backed session/report/verification flow
- 계약서/녹취 파일 메타데이터 저장
- AI 분석 결과 및 검증 카드 생성
- 심사위원용 검증 콘솔 제공
- 일반 사용자 모바일 플로우와 발표자/심사위원 검증 화면 분리
- CSS legacy baseline + service-ready override layer 정리 완료

## Quick Start

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

## 주요 구현 범위

### 사용자 플로우

- 계약자 / 설명자 역할 분리
- 계약서 업로드
- 양측 본인확인 및 동의 상태 관리
- 녹취 업로드 및 처리 흐름
- AI 분석 결과 화면
- 사후 확인 문서 선택 흐름
- 최종 QR 검증 카드 생성

### DB-backed MVP Flow

현재 MVP는 SQLite 기반으로 다음 데이터를 저장하고 조회합니다.

- 세션 상태
- 계약서 파일 메타데이터
- 녹취 파일 메타데이터
- 분석 작업 상태
- 리포트 데이터
- 검증 카드 데이터
- 감사 로그성 이벤트

### 심사위원 검증 화면

`/judge` 화면에서는 발표 및 심사용으로 다음 상태를 한 화면에서 확인할 수 있습니다.

- 세션 진행 상태
- 계약서/녹취/리포트 해시 상태
- AI 분석 결과
- 위험도 요약
- QR 검증 카드 상태
- DB-backed 검증 흐름

## 현재 파일 구조

```text
app/
  main.py                     # FastAPI app entrypoint
  api/                        # session/report/verification API routes
  repositories/               # SQLite repository layer
  services/                   # session store and service helpers
  models.py                   # DB models
  db.py                       # SQLite DB setup
  templates/index.html         # single-page template shell
  static/css/legacy-ui.css     # frozen legacy UI baseline
  static/css/style.css         # service-ready MVP override layer
  static/js/                   # modular frontend scripts

docs/
  CSS 관련 정리 문서
  service-ready MVP 상태 문서
  기존 UI/플로우 안정화 기록

tools/
  health_check.sh
  smoke_test_db_flow.py
  test_session_repository.py
  test_file_idempotency.py
  test_file_audit_repositories.py
  test_analysis_report_verification_repositories.py
  test_full_session_aggregate.py
```

## CSS 정리 상태

현재 CSS는 다음 구조로 동작합니다.

```text
index.html
  └── style.css
        └── legacy-ui.css
```

- `legacy-ui.css`는 이전 MVP 개발 과정에서 누적된 기존 UI 스타일 기준 파일입니다.
- `style.css`는 service-ready MVP 화면을 위한 active override layer입니다.
- 대회/시연 전 안정성을 위해 `legacy-ui.css`는 삭제하지 않고 frozen baseline으로 유지합니다.
- JS에서 렌더링되는 class가 많기 때문에 class rename이나 대량 삭제는 하지 않습니다.

관련 문서:

| 문서 | 용도 |
|---|---|
| `docs/css_inventory.md` | CSS 파일 구조 및 진입점 정리 |
| `docs/css_class_usage_map.md` | JS/템플릿 class 사용 위치 정리 |
| `docs/css_override_layer_map.md` | style.css override layer 구조 정리 |
| `docs/css_cleanup_candidates.md` | 향후 CSS 정리 후보 기록 |

## 검증 방법

### Health Check

```bash
bash tools/health_check.sh
```

이 스크립트는 주요 파일 존재 여부, 중복 CSS 파일, 캐시 파일, JS 액션 누락, 필수 심볼 등을 확인합니다.

### DB-backed Smoke Test

서버를 먼저 실행합니다.

```bash
uvicorn app.main:app --reload
```

다른 터미널에서 smoke test를 실행합니다.

```bash
python tools/smoke_test_db_flow.py
```

성공 시 다음 흐름이 확인됩니다.

```text
session: report_ready
analysis: completed
verification: valid
```

### Repository Test Scripts

```bash
python tools/test_session_repository.py
python tools/test_file_idempotency.py
python tools/test_file_audit_repositories.py
python tools/test_analysis_report_verification_repositories.py
python tools/test_full_session_aggregate.py
```

## 개발 및 수정 원칙

1. 대회/시연 전에는 `legacy-ui.css`를 삭제하지 않습니다.
2. 급한 UI 수정은 `style.css`에서만 진행합니다.
3. JavaScript에서 렌더링하는 class 이름은 함부로 변경하지 않습니다.
4. DB-backed flow는 `tools/smoke_test_db_flow.py`로 확인합니다.
5. 로컬 캐시나 `__pycache__`는 커밋하지 않습니다.
6. 큰 리팩터링은 별도 브랜치에서 진행합니다.

## Local Cleanup

로컬 캐시나 런타임 산출물을 정리할 때는 아래 명령을 사용합니다.

```bash
bash tools/apply_v18_cleanup_local.sh
```

## MVP Scope

이 저장소는 해커톤 제출 및 시연을 위한 service-ready MVP입니다.

실제 서비스화를 위해서는 향후 다음 작업이 필요합니다.

- PostgreSQL 등 운영 DB 전환
- 파일 업로드 보안 강화
- 인증/권한 체계 보강
- 실제 AI 분석 모델 또는 외부 API 연동
- DID/Chain 검증 로직 고도화
- 배포 환경 구성
- 자동화 테스트 및 CI 구성
