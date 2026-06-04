# Contract Mirror DB-backed MVP Status

## 1. 현재 상태 요약

Contract Mirror MVP는 기존 JSON 기반 임시 저장 구조에서 SQLite 기반 DB 저장 구조로 전환 중이다.

현재 핵심 API 플로우는 대부분 DB-backed로 동작한다.

완료된 DB-backed 범위:

- 세션 생성
- 세션 조회
- 계약서 업로드 메타데이터 저장
- 계약서 고정 상태 저장
- 참여자 본인확인/동의 상태 저장
- 녹취 업로드 메타데이터 저장
- 분석 job 저장
- 리포트 저장
- 불일치 후보 저장
- 확인 질문 저장
- 검증 카드 저장
- 리포트 조회
- 검증 카드 조회
- 브라우저 새로고침 후 세션 복구

현재 저장소:

- SQLite DB: `storage/contract_mirror.sqlite3`
- DB schema: `app/models.py`
- DB 연결: `app/db.py`
- Repository: `app/repositories/`
- API facade: `app/services/session_store.py`

---

## 2. DB-backed로 확인된 API

### 2.1 Session

- `POST /api/sessions`
- `GET /api/sessions/{session_id}`

DB 저장 테이블:

- `sessions`
- `participants`

### 2.2 Contract

- `POST /api/sessions/{session_id}/contract`
- `POST /api/sessions/{session_id}/contract/lock`

DB 저장 테이블:

- `files`
- `sessions`

### 2.3 Participants

- `PATCH /api/sessions/{session_id}/participants/contractor`
- `PATCH /api/sessions/{session_id}/participants/explainer`

DB 저장 테이블:

- `participants`
- `sessions`

상태 전이:

- 한 명만 완료: `participants_pending`
- 양측 완료: `participants_ready`

### 2.4 Recording

- `POST /api/sessions/{session_id}/recording`

DB 저장 테이블:

- `files`
- `sessions`

상태 전이:

- `recording_uploaded`

### 2.5 Analysis / Report / Verification

- `POST /api/sessions/{session_id}/analysis`
- `GET /api/sessions/{session_id}/analysis/status`
- `GET /api/reports/{report_id}`
- `GET /api/verifications/{verification_id}`

DB 저장 테이블:

- `analysis_jobs`
- `reports`
- `report_mismatches`
- `report_questions`
- `verifications`
- `sessions`

상태 전이:

- `report_ready`

---

## 3. 현재 남아 있는 JSON fallback

현재 `app/services/session_store.py`에는 JSON fallback이 아직 남아 있다.

남아 있는 이유:

- DB 전환 중 안전장치
- 기존 API 응답 구조 유지
- 전환 중 회귀 리스크 완화

JSON fallback 대상:

- `_SESSIONS`
- `_REPORTS`
- `_VERIFICATIONS`
- `storage/api_store.json`

주의:

- 현재 핵심 플로우는 DB-backed로 통과했다.
- 하지만 fallback이 남아 있으므로 완전 DB-only 구조는 아니다.
- JSON 제거는 별도 단계에서 진행한다.

---

## 4. 파일 중복 저장 방지

같은 세션에서 같은 파일이 중복 업로드될 경우 새 row를 만들지 않고 기존 row를 재사용한다.

중복 판단 기준:

- `session_id`
- `file_type`
- `original_name`
- `sha256_hash`

검증 완료:

- `tools/test_file_idempotency.py`
- 실제 API에서 같은 계약서 2회 업로드 후 `files` row 1개 유지 확인

---

## 5. 브라우저 회귀 테스트 결과

브라우저 전체 플로우 통과.

확인된 흐름:

1. 계약 설명 검증 시작
2. 계약서 업로드
3. 계약서 고정
4. 참여자 본인확인/동의
5. 녹취 업로드
6. AI 분석 시작
7. 리포트 생성
8. 검증 카드 생성
9. 새로고침 후 상태 복구

브라우저 콘솔 성공 기준:

- `serviceStatus`: `report_ready`
- `contractHash`: `sha256:...`
- `recordingHash`: `sha256:...`
- `reportId`: `RPT-...`
- `verificationId`: `VER-...`
- `serviceReport` 존재
- `serviceVerification` 존재

---

## 6. 핵심 점검 명령

### 6.1 DB 초기화

    python tools/init_db.py

### 6.2 Repository 단위 테스트

    python tools/test_session_repository.py
    python tools/test_file_audit_repositories.py
    python tools/test_analysis_report_verification_repositories.py
    python tools/test_full_session_aggregate.py
    python tools/test_file_idempotency.py

### 6.3 Health check

    bash tools/apply_v18_cleanup_local.sh
    bash tools/health_check.sh

### 6.4 DB 직접 확인

    python - <<'PY'
    import sqlite3

    conn = sqlite3.connect("storage/contract_mirror.sqlite3")

    print("sessions:")
    for row in conn.execute("SELECT id, status FROM sessions WHERE id LIKE 'CM-%' ORDER BY updated_at DESC LIMIT 5"):
        print(row)

    print("\nfiles:")
    for row in conn.execute("SELECT session_id, file_type, original_name, sha256_hash FROM files WHERE session_id LIKE 'CM-%' ORDER BY uploaded_at DESC LIMIT 10"):
        print(row)

    print("\nanalysis_jobs:")
    for row in conn.execute("SELECT session_id, id, status, progress FROM analysis_jobs WHERE session_id LIKE 'CM-%' ORDER BY created_at DESC LIMIT 5"):
        print(row)

    print("\nreports:")
    for row in conn.execute("SELECT session_id, id, risk_level, hash FROM reports WHERE session_id LIKE 'CM-%' ORDER BY created_at DESC LIMIT 5"):
        print(row)

    print("\nverifications:")
    for row in conn.execute("SELECT session_id, id, status, report_hash FROM verifications WHERE session_id LIKE 'CM-%' ORDER BY created_at DESC LIMIT 5"):
        print(row)

    conn.close()
    PY

---

## 7. 현재 구조 평가

현재 구조는 더 이상 단순 데모 JSON 저장소만 사용하는 상태가 아니다.

현재 상태:

- 프론트는 기존 API 계약을 유지한다.
- 백엔드는 DB repository를 통해 핵심 데이터를 저장한다.
- API 응답은 여전히 프론트 친화적인 aggregate session 객체로 반환된다.
- SQLite 기반이므로 로컬 MVP와 심사용 데모에 적합하다.
- PostgreSQL 전환 가능성을 열어둔 구조다.

---

## 8. 다음 단계 후보

### 8.1 우선순위 높음

- DB smoke test script 작성
- JSON fallback 제거 전 체크리스트 작성
- 파일 원본 저장소 `storage/uploads/` 실제 저장 연결
- DB-only 모드 전환 옵션 추가

### 8.2 이후 단계

- Alembic migration 도입
- PostgreSQL 전환 준비
- 사용자/세션 권한 토큰 도입
- 실제 STT/AI 분석 파이프라인 연결
- 관리자용 세션 조회 API 추가

---

## 9. 완료 기준

이 문서 기준으로 현재 DB-backed MVP 안정화 1차 완료 기준은 다음과 같다.

- 전체 브라우저 플로우가 통과한다.
- API 전체 플로우가 통과한다.
- DB에 session, file, participant, analysis, report, verification이 저장된다.
- 새로고침 후 session/report/verification 상태가 유지된다.
- 동일 파일 중복 업로드 시 파일 메타데이터가 중복 저장되지 않는다.
- health check가 통과한다.
- working tree가 clean 상태다.

