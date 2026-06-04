# Contract Mirror API Contract

## 1. 목적

이 문서는 Contract Mirror 서비스형 MVP에서 프론트엔드와 FastAPI 백엔드가 주고받을 API 계약을 정의한다.

현재 프론트엔드는 데모 state 기반으로 화면을 전환하지만, 서비스 단계에서는 서버 상태를 기준으로 화면이 렌더링되어야 한다.

핵심 원칙:

- DB가 실제 상태의 기준이다.
- 프론트 state는 서버 응답을 화면에 반영하는 용도다.
- 버튼 클릭은 직접 state를 바꾸지 않고 API 요청을 먼저 보낸다.
- API 응답은 가능한 한 session 객체를 반환하여 프론트 상태 동기화를 쉽게 한다.

---

## 2. 공통 응답 원칙

### 2.1 성공 응답

성공 응답은 가능한 한 아래 구조를 따른다.

{
  "ok": true,
  "data": {}
}

단, 세션 상태를 변경하는 API는 data 안에 최신 session 객체를 포함한다.

예시:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

### 2.2 실패 응답

실패 응답은 아래 구조를 따른다.

{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 보여줄 수 있는 오류 메시지"
  }
}

### 2.3 시간 형식

모든 시간은 ISO 8601 문자열로 반환한다.

예시:

2026-06-04T15:30:00+09:00

---

## 3. Session 객체

프론트는 Session 객체를 기준으로 화면 상태를 갱신한다.

Session 기본 구조:

{
  "id": "CM-20260604-001",
  "status": "created",
  "createdAt": "2026-06-04T15:30:00+09:00",
  "updatedAt": "2026-06-04T15:30:00+09:00",
  "expiresAt": null,

  "contract": {
    "fileName": null,
    "fileSize": null,
    "mimeType": null,
    "hash": null,
    "uploadedAt": null,
    "locked": false
  },

  "recording": {
    "fileName": null,
    "fileSize": null,
    "mimeType": null,
    "hash": null,
    "durationSec": null,
    "uploadedAt": null,
    "status": "idle"
  },

  "participants": {
    "contractor": {
      "role": "contractor",
      "name": null,
      "verified": false,
      "consent": false,
      "rejected": false,
      "verifiedAt": null,
      "consentedAt": null
    },
    "explainer": {
      "role": "explainer",
      "name": null,
      "verified": false,
      "consent": false,
      "rejected": false,
      "verifiedAt": null,
      "consentedAt": null
    }
  },

  "analysis": {
    "jobId": null,
    "status": "idle",
    "progress": 0,
    "startedAt": null,
    "completedAt": null,
    "error": null
  },

  "report": {
    "id": null,
    "hash": null,
    "riskLevel": null,
    "summary": null,
    "mismatches": [],
    "questions": [],
    "createdAt": null
  },

  "verification": {
    "id": null,
    "status": null,
    "qrUrl": null,
    "publicUrl": null,
    "verifiedAt": null
  }
}

---

## 4. 세션 API

### 4.1 세션 생성

Method:

POST

Path:

/api/sessions

Request body:

{
  "contractType": "real_estate_sale"
}

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

프론트 동작:

- create-session 액션에서 호출한다.
- 응답받은 session을 Store.applySession(session)에 반영한다.
- 이후 upload 화면으로 이동한다.

---

### 4.2 세션 조회

Method:

GET

Path:

/api/sessions/{session_id}

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

프론트 동작:

- 새로고침 후 상태 복구에 사용한다.
- report, verify, participant 화면 진입 시 서버 상태를 다시 불러오는 데 사용한다.

---

## 5. 계약서 API

### 5.1 계약서 업로드

Method:

POST

Path:

/api/sessions/{session_id}/contract

Request:

multipart/form-data

Fields:

- file: 계약서 파일

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

백엔드 처리:

- 파일 확장자 검사
- 파일 크기 검사
- 파일 저장
- SHA-256 해시 생성
- session.contract 업데이트
- session.status를 contract_uploaded로 변경

프론트 동작:

- upload-contract 액션에서 호출한다.
- 성공 시 계약서 파일명과 해시를 화면에 표시한다.

---

### 5.2 계약서 고정

Method:

POST

Path:

/api/sessions/{session_id}/contract/lock

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

백엔드 처리:

- 계약서가 업로드되어 있는지 확인한다.
- contract.locked를 true로 변경한다.
- session.status를 contract_locked로 변경한다.

프론트 동작:

- lock-contract 액션에서 호출한다.
- 성공 시 참여자 초대 또는 대기 화면으로 이동한다.

---

## 6. 참여자 API

### 6.1 참여자 본인확인 상태 변경

Method:

PATCH

Path:

/api/sessions/{session_id}/participants/{role}

role 값:

- contractor
- explainer

Request body:

{
  "verified": true
}

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

프론트 동작:

- verify-contractor 또는 verify-explainer 액션에서 호출한다.
- 응답받은 session으로 참여자 상태를 갱신한다.

---

### 6.2 참여자 동의 상태 변경

Method:

PATCH

Path:

/api/sessions/{session_id}/participants/{role}

Request body:

{
  "consent": true
}

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

프론트 동작:

- consent-contractor 또는 consent-explainer 액션에서 호출한다.
- 양쪽 참여자가 모두 verified, consent 상태가 되면 recording 단계로 이동할 수 있다.

---

## 7. 녹취 API

### 7.1 녹취 파일 업로드

Method:

POST

Path:

/api/sessions/{session_id}/recording

Request:

multipart/form-data

Fields:

- file: 녹취 파일

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

백엔드 처리:

- 파일 확장자 검사
- 파일 크기 검사
- 파일 저장
- SHA-256 해시 생성
- session.recording 업데이트
- session.status를 recording_uploaded로 변경

프론트 동작:

- upload-recording 또는 stop-recording 후 업로드 액션에서 호출한다.
- 성공 시 분석 시작 버튼을 활성화한다.

---

## 8. 분석 API

### 8.1 분석 시작

Method:

POST

Path:

/api/sessions/{session_id}/analysis

Response:

{
  "ok": true,
  "data": {
    "session": {}
  }
}

백엔드 처리:

- 계약서와 녹취가 모두 존재하는지 확인한다.
- 분석 job을 생성한다.
- analysis.status를 pending 또는 processing으로 변경한다.
- session.status를 analysis_processing으로 변경한다.

프론트 동작:

- start-analysis 액션에서 호출한다.
- 이후 analysis status polling을 시작한다.

---

### 8.2 분석 상태 조회

Method:

GET

Path:

/api/sessions/{session_id}/analysis/status

Response:

{
  "ok": true,
  "data": {
    "analysis": {
      "jobId": "JOB-001",
      "status": "processing",
      "progress": 45,
      "startedAt": "2026-06-04T15:40:00+09:00",
      "completedAt": null,
      "error": null
    }
  }
}

프론트 동작:

- processing 화면에서 1~2초 간격으로 polling한다.
- status가 completed이면 report 화면으로 이동한다.
- status가 failed이면 에러와 재시도 버튼을 표시한다.

---

## 9. 리포트 API

### 9.1 리포트 조회

Method:

GET

Path:

/api/reports/{report_id}

Response:

{
  "ok": true,
  "data": {
    "report": {
      "id": "RPT-001",
      "hash": "sha256:...",
      "riskLevel": "high",
      "summary": "설명 내용과 계약 조항 사이에 중요한 불일치 후보가 발견되었습니다.",
      "mismatches": [],
      "questions": [],
      "createdAt": "2026-06-04T15:45:00+09:00"
    }
  }
}

프론트 동작:

- report 화면 진입 시 호출한다.
- report.mismatches와 report.questions를 화면에 렌더링한다.
- 외부 입력 문자열은 반드시 escapeHTML을 거친다.

---

## 10. 검증 API

### 10.1 공개 검증 정보 조회

Method:

GET

Path:

/api/verifications/{verification_id}

Response:

{
  "ok": true,
  "data": {
    "verification": {
      "id": "VER-001",
      "status": "valid",
      "contractHash": "sha256:...",
      "recordingHash": "sha256:...",
      "reportHash": "sha256:...",
      "createdAt": "2026-06-04T15:45:00+09:00",
      "verifiedAt": "2026-06-04T15:46:00+09:00",
      "riskSummary": "높음",
      "tampered": false
    }
  }
}

프론트 동작:

- /verify/{verification_id} 화면 진입 시 호출한다.
- 원문 계약서, 녹취 원본, 개인정보는 공개 검증 화면에 표시하지 않는다.

---

## 11. 프론트 액션과 API 매핑

| 프론트 액션 | API |
|---|---|
| create-session | POST /api/sessions |
| upload-contract | POST /api/sessions/{session_id}/contract |
| lock-contract | POST /api/sessions/{session_id}/contract/lock |
| verify-contractor | PATCH /api/sessions/{session_id}/participants/contractor |
| verify-explainer | PATCH /api/sessions/{session_id}/participants/explainer |
| consent-contractor | PATCH /api/sessions/{session_id}/participants/contractor |
| consent-explainer | PATCH /api/sessions/{session_id}/participants/explainer |
| upload-recording | POST /api/sessions/{session_id}/recording |
| start-analysis | POST /api/sessions/{session_id}/analysis |
| load-report | GET /api/reports/{report_id} |
| load-verification | GET /api/verifications/{verification_id} |

---

## 12. 구현 순서

1. POST /api/sessions
2. GET /api/sessions/{session_id}
3. apiClient.js createSession, getSession 실제 연결 확인
4. actions.js create-session만 API 기반으로 교체
5. 계약서 업로드 API 추가
6. 참여자 API 추가
7. 녹취 API 추가
8. 분석 API 추가
9. 리포트 API 추가
10. 검증 API 추가

---

## 13. 완료 기준

3단계 완료 기준:

- API_CONTRACT.md 문서가 존재한다.
- 핵심 endpoint 목록이 정리되어 있다.
- session 객체 구조가 정의되어 있다.
- 프론트 액션과 API 매핑이 정리되어 있다.
- 다음 단계에서 FastAPI API 뼈대를 만들 수 있다.
