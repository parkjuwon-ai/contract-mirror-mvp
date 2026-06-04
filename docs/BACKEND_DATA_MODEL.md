# Contract Mirror Backend Data Model

## 1. 목적

이 문서는 Contract Mirror MVP를 JSON 기반 임시 저장소에서 서비스형 데이터 저장 구조로 전환하기 위한 기준을 정의한다.

현재 백엔드는 `storage/api_store.json`을 사용하여 세션, 리포트, 검증 정보를 저장한다.

이 구조는 API 흐름 검증과 프론트 연동 테스트에는 충분하지만, 실제 서비스 단계에서는 동시성, 검색성, 정합성, 보안성 측면에서 한계가 있다.

따라서 다음 단계에서는 SQLite 기반 DB 구조를 먼저 도입하고, 이후 PostgreSQL로 전환 가능한 형태로 설계한다.

---

## 2. 현재 JSON 저장소의 한계

현재 JSON 저장소는 다음 데이터를 저장한다.

- sessions
- reports
- verifications

장점:

- 구현이 빠르다.
- API 흐름 검증이 쉽다.
- 서버 reload 후에도 최소한의 데이터 유지가 가능하다.

한계:

- 동시에 여러 요청이 들어오면 파일 write 충돌 가능성이 있다.
- 특정 세션, 리포트, 검증 정보를 검색하기 어렵다.
- 데이터 정합성 제약을 걸기 어렵다.
- JSON 파일이 깨지면 전체 저장소가 위험하다.
- 파일 메타데이터, 참여자 상태, 분석 작업, 감사 로그를 체계적으로 관리하기 어렵다.
- 사용자 계정, 권한, 관리자 화면, 기관용 대시보드로 확장하기 어렵다.

결론적으로 JSON 저장소는 개발용 임시 저장소로만 사용한다.

---

## 3. DB 도입 원칙

### 3.1 1차 목표는 SQLite

초기 서비스형 MVP에서는 SQLite를 사용한다.

이유:

- 별도 DB 서버가 필요 없다.
- 로컬 개발과 배포 테스트가 쉽다.
- 현재 JSON 저장소보다 데이터 정합성과 검색성이 좋다.
- SQLAlchemy 기반으로 설계하면 이후 PostgreSQL 전환이 가능하다.

### 3.2 2차 목표는 PostgreSQL

운영 배포 또는 다중 사용자 테스트 단계에서는 PostgreSQL로 전환한다.

전환 기준:

- 동시 접속자 증가
- 관리자 대시보드 필요
- 세션 검색/관리 기능 필요
- 사용자 계정/권한 필요
- 분석 작업 큐 필요
- 감사 로그 장기 보존 필요

### 3.3 API 응답 구조는 유지한다

DB를 도입하더라도 프론트엔드와의 API 계약은 최대한 유지한다.

현재 응답 구조:

    {
      "ok": true,
      "data": {
        "session": {}
      }
    }

DB 도입 후에도 프론트는 동일한 `session` 객체를 받는다.

즉, 변경 대상은 프론트가 아니라 백엔드 저장소 계층이다.

---

## 4. 저장 책임 분리

| 대상 | 저장 위치 |
|---|---|
| 세션 상태 | DB |
| 참여자 상태 | DB |
| 계약서 파일 메타데이터 | DB |
| 녹취 파일 메타데이터 | DB |
| 파일 원본 | file storage 또는 object storage |
| 분석 job 상태 | DB |
| 리포트 요약 | DB |
| 불일치 후보 | DB |
| 질문 목록 | DB |
| 검증 카드 정보 | DB |
| 감사 로그 | DB |
| 계약서 원문 | DB 직접 저장 금지 |
| 녹취 원본 | DB 직접 저장 금지 |
| STT 전문 | 별도 보안 정책 필요 |

---

## 5. 파일 저장 정책

### 5.1 DB에 파일 원본을 직접 저장하지 않는다

계약서, 녹취 파일, 추가확인문서 원본은 DB에 직접 저장하지 않는다.

DB에는 다음 메타데이터만 저장한다.

- file_id
- session_id
- file_type
- original_name
- mime_type
- size_bytes
- sha256_hash
- storage_path
- uploaded_at

### 5.2 파일 원본 저장 위치

초기 MVP:

    storage/uploads/

향후 서비스:

    S3 또는 S3 호환 object storage

### 5.3 파일 유형

파일 유형은 다음과 같이 구분한다.

- contract
- recording
- addendum
- transcript
- report_export

### 5.4 해시 정책

모든 파일은 저장 시 SHA-256 해시를 생성한다.

해시 사용 목적:

- 파일 위변조 검증
- 검증 카드 생성
- 리포트 무결성 확인
- DID/Chain 확장 시 기록 기준값으로 사용

---

## 6. 최소 테이블 설계

초기 MVP에서는 다음 테이블을 우선 사용한다.

- sessions
- participants
- files
- analysis_jobs
- reports
- report_mismatches
- report_questions
- verifications
- audit_events


---

## 7. sessions

세션 전체 생명주기를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 세션 ID |
| contract_type | 계약 유형 |
| status | 세션 상태 |
| created_at | 생성 시각 |
| updated_at | 수정 시각 |
| expires_at | 만료 시각 |

status 후보:

- created
- contract_uploaded
- contract_locked
- participants_pending
- participants_ready
- recording_uploaded
- analysis_pending
- analysis_processing
- analysis_completed
- report_ready
- verified
- expired
- failed

---

## 8. participants

계약자와 설명자의 본인확인 및 동의 상태를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 내부 ID |
| session_id | 세션 ID |
| role | contractor 또는 explainer |
| name | 표시 이름 |
| verified | 본인확인 여부 |
| consent | 동의 여부 |
| rejected | 거절 여부 |
| verified_at | 본인확인 시각 |
| consented_at | 동의 시각 |
| created_at | 생성 시각 |
| updated_at | 수정 시각 |

role 후보:

- contractor
- explainer

---

## 9. files

계약서, 녹취, 추가확인문서 등 파일 메타데이터를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 파일 ID |
| session_id | 세션 ID |
| file_type | contract, recording 등 |
| original_name | 원본 파일명 |
| mime_type | MIME 타입 |
| size_bytes | 파일 크기 |
| sha256_hash | SHA-256 해시 |
| storage_path | 파일 저장 경로 |
| uploaded_at | 업로드 시각 |

file_type 후보:

- contract
- recording
- addendum
- transcript
- report_export

주의:

- 파일 원본은 DB에 직접 저장하지 않는다.
- DB에는 파일을 찾기 위한 경로와 해시만 저장한다.
- 공개 검증 화면에는 원본 파일 경로를 노출하지 않는다.

---

## 10. analysis_jobs

AI 분석 작업 상태를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 분석 job ID |
| session_id | 세션 ID |
| status | 분석 상태 |
| progress | 진행률 |
| started_at | 시작 시각 |
| completed_at | 완료 시각 |
| error_message | 실패 사유 |
| created_at | 생성 시각 |
| updated_at | 수정 시각 |

status 후보:

- idle
- pending
- processing
- completed
- failed

현재 MVP에서는 분석이 즉시 완료되는 mock 구조이지만, 향후 실제 STT/AI 분석이 붙으면 이 테이블이 비동기 작업 상태를 관리한다.

---

## 11. reports

AI 분석 리포트의 상위 정보를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 리포트 ID |
| session_id | 세션 ID |
| analysis_job_id | 분석 job ID |
| hash | 리포트 해시 |
| risk_level | 위험도 |
| summary | 요약 |
| created_at | 생성 시각 |

risk_level 후보:

- low
- medium
- high
- critical

리포트는 계약서와 녹취의 원문 전체를 저장하는 곳이 아니다.  
리포트에는 사용자에게 보여줄 요약, 위험도, 불일치 후보, 확인 질문만 저장한다.


---

## 12. report_mismatches

설명 내용과 계약 조항 사이의 불일치 후보를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 불일치 후보 ID |
| report_id | 리포트 ID |
| title | 제목 |
| risk_level | 위험도 |
| transcript_text | 녹취 발언 후보 |
| contract_text | 계약 조항 후보 |
| basis | 근거 |
| display_order | 표시 순서 |

주의:

- 계약서 원문 전문 전체를 저장하지 않는다.
- 녹취 전문 전체를 저장하지 않는다.
- 필요한 경우 짧은 근거 문장 또는 마스킹된 요약만 저장한다.
- 원문 대조가 필요한 경우 원본 파일의 해시와 저장 경로를 별도로 참조한다.

---

## 13. report_questions

사용자에게 제시할 확인 질문을 관리한다.

| 필드 | 설명 |
|---|---|
| id | 질문 ID |
| report_id | 리포트 ID |
| text | 질문 문장 |
| target | contractor 또는 explainer |
| display_order | 표시 순서 |

질문은 사용자가 설명자에게 다시 확인해야 할 핵심 쟁점을 짧고 명확하게 제시하기 위한 데이터다.

---

## 14. verifications

공개 검증 카드 정보를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 검증 ID |
| session_id | 세션 ID |
| report_id | 리포트 ID |
| status | 검증 상태 |
| contract_hash | 계약서 해시 |
| recording_hash | 녹취 해시 |
| report_hash | 리포트 해시 |
| risk_summary | 위험 요약 |
| tampered | 위변조 여부 |
| created_at | 생성 시각 |
| verified_at | 검증 시각 |

공개 검증 화면 노출 가능 정보:

- 검증 상태
- 계약서 해시
- 녹취 해시
- 리포트 해시
- 생성 시각
- 위험 요약
- 위변조 여부

공개 검증 화면 노출 금지 정보:

- 계약서 원문
- 녹취 원본
- STT 전문
- 신분확인 정보
- 개인정보
- 내부 분석 프롬프트
- 내부 판단 로그

검증 카드는 원문 열람 페이지가 아니라, 특정 시점의 계약서/녹취/리포트가 같은 세션에서 생성되었고 위변조되지 않았음을 확인하는 공개 증명 페이지다.

---

## 15. audit_events

세션 내 주요 이벤트를 관리한다.

| 필드 | 설명 |
|---|---|
| id | 내부 ID |
| session_id | 세션 ID |
| event_type | 이벤트 유형 |
| message | 이벤트 메시지 |
| created_at | 발생 시각 |

event_type 예시:

- SESSION_CREATED
- CONTRACT_UPLOADED
- CONTRACT_LOCKED
- PARTICIPANT_VERIFIED
- CONSENT_COMPLETED
- CONSENT_REJECTED
- RECORDING_HASH_CREATED
- ANALYSIS_STARTED
- ANALYSIS_STATUS_SYNCED
- REPORT_VIEWED
- VERIFY_CARD_CREATED
- VERIFY_SHARE_LINK_COPIED

감사 로그는 사용자의 화면 이벤트 전체를 무제한 저장하기 위한 것이 아니라, 세션의 핵심 상태 전이를 추적하기 위한 최소 이벤트 기록이다.

---

## 16. 기존 session 객체와 DB 매핑

프론트는 여전히 `session` 객체를 기준으로 동작한다.

DB 도입 후 백엔드는 여러 테이블을 조회하여 다음 구조로 조립한다.

    {
      "id": "CM-20260604-000001",
      "status": "report_ready",
      "contractType": "real_estate_sale",
      "createdAt": "2026-06-04T10:00:00+09:00",
      "updatedAt": "2026-06-04T10:05:00+09:00",
      "contract": {},
      "recording": {},
      "participants": {},
      "analysis": {},
      "report": {},
      "verification": {}
    }

즉, DB 구조는 정규화하되 API 응답은 프론트 친화적인 aggregate 객체로 반환한다.

중요 원칙:

- API endpoint는 유지한다.
- API 응답의 최상위 구조는 유지한다.
- 프론트는 DB 도입으로 인해 큰 변경을 하지 않는다.
- 저장소 구현만 JSON에서 DB로 교체한다.


---

## 17. repository 전환 전략

현재 구조:

    app/services/session_store.py

현재 `session_store.py`의 역할:

- 세션 생성
- 세션 조회
- 계약서 업로드
- 계약서 고정
- 참여자 상태 변경
- 녹취 업로드
- 분석 시작
- 리포트 조회
- 검증 조회

DB 전환 후 초기 구조:

    app/db.py
    app/models.py
    app/repositories/session_repository.py
    app/services/session_service.py

초기에는 너무 많이 나누지 않는다.

1차 목표는 다음이다.

- 기존 API 라우터는 유지한다.
- 프론트 API 경로는 유지한다.
- API 응답 구조는 유지한다.
- `session_store.py` 내부 구현을 JSON 저장 방식에서 DB repository/service 호출 방식으로 교체한다.

이후 기능이 커질 때 repository를 세분화한다.

후보 구조:

    app/repositories/
      session_repository.py
      file_repository.py
      participant_repository.py
      analysis_repository.py
      report_repository.py
      verification_repository.py
      audit_repository.py

---

## 18. 단계별 구현 계획

### 18.1 1단계: SQLite 연결 추가

- `app/db.py` 생성
- SQLite database 파일 생성
- SQLAlchemy 2.x 도입
- 테이블 생성 함수 추가
- DB 파일은 `storage/contract_mirror.sqlite3`에 생성한다.
- `storage/`는 git에 커밋하지 않는다.

### 18.2 2단계: models 정의

초기 모델 후보:

- SessionModel
- ParticipantModel
- FileModel
- AnalysisJobModel
- ReportModel
- ReportMismatchModel
- ReportQuestionModel
- VerificationModel
- AuditEventModel

### 18.3 3단계: repository 작성

초기 repository 함수 후보:

- create_session
- get_session
- update_session_status
- upsert_participant
- create_file
- create_analysis_job
- create_report
- create_report_mismatch
- create_report_question
- create_verification
- create_audit_event

### 18.4 4단계: 기존 session_store 대체

기존 API 라우터는 유지한다.

교체 대상:

    session_store.py JSON 저장 로직
    → DB repository/service 호출

프론트 API 경로는 유지한다.

### 18.5 5단계: 파일 저장소 분리

- `storage/uploads/` 생성
- 업로드 파일 저장
- DB에는 storage_path와 hash만 저장
- 공개 검증 화면에는 원문 파일 경로를 노출하지 않는다.

### 18.6 6단계: PostgreSQL 전환 준비

- DB URL 환경변수화
- migration 도구 도입 검토
- 개발 SQLite / 운영 PostgreSQL 분리
- PostgreSQL 전환 시에도 API 응답 구조는 유지한다.

---

## 19. 보안 및 개인정보 원칙

### 19.1 최소 저장 원칙

서비스는 계약서와 녹취를 다루므로 민감정보 저장을 최소화한다.

원칙:

- 필요한 데이터만 저장한다.
- 원문 전문은 가능하면 저장하지 않는다.
- 공개 검증 페이지에는 해시와 요약만 표시한다.
- 개인정보는 마스킹한다.
- 파일 접근 권한을 세션/토큰 기반으로 제한한다.

### 19.2 공개 검증 페이지 원칙

공개 검증 페이지는 검증 상태를 보여주는 페이지이지, 원문 자료 열람 페이지가 아니다.

노출 가능:

- hash
- status
- createdAt
- verifiedAt
- riskSummary
- tampered

노출 금지:

- 계약서 원문
- 녹취 원본
- 신분확인 자료
- 참여자 개인정보
- 내부 분석 전체 로그
- 내부 프롬프트
- STT 전문

---

## 20. 완료 기준

DB 도입 완료 기준은 다음과 같다.

- SQLite DB 파일이 생성된다.
- 세션 생성 API가 DB에 기록된다.
- 계약서 업로드 API가 파일 메타데이터를 DB에 기록한다.
- 참여자 상태가 DB에 기록된다.
- 녹취 업로드 상태가 DB에 기록된다.
- 분석 job이 DB에 기록된다.
- report가 DB에 기록된다.
- report_mismatches가 DB에 기록된다.
- report_questions가 DB에 기록된다.
- verification이 DB에 기록된다.
- audit_events가 DB에 기록된다.
- 서버 reload 후에도 DB에서 세션, 리포트, 검증 정보를 조회할 수 있다.
- 기존 프론트 API 응답 구조가 깨지지 않는다.
- `storage/api_store.json` 없이도 핵심 플로우가 동작한다.

---

## 21. 현재 결정 사항

현재 결정:

- JSON 저장소는 임시 개발용으로만 유지한다.
- 다음 저장소는 SQLite로 도입한다.
- SQLAlchemy 2.x를 우선 사용한다.
- PostgreSQL 전환을 염두에 두고 repository 계층을 만든다.
- 파일 원본은 DB에 직접 저장하지 않는다.
- DB에는 파일 메타데이터와 해시를 저장한다.
- API 응답 구조는 유지한다.
- 프론트는 DB 도입으로 인해 변경되지 않는 것을 목표로 한다.
- 공개 검증 화면은 원문 열람 화면이 아니라 해시 기반 검증 화면으로 유지한다.

