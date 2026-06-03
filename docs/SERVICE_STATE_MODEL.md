# Contract Mirror Service State Model

## 1. 목적

이 문서는 Contract Mirror 프론트엔드 상태 구조를 데모 중심 구조에서 실제 서비스형 구조로 전환하기 위한 기준 문서다.

현재 프론트엔드는 BASE_STATE와 localStorage 중심으로 데모 상태를 유지한다.  
서비스 단계에서는 서버 DB가 실제 상태의 기준이 되어야 하며, 프론트엔드 state는 서버 응답을 화면에 표시하기 위한 클라이언트 상태로 사용한다.

---

## 2. 핵심 원칙

### 2.1 서버 데이터와 UI 상태를 분리한다

서버 데이터:

- session
- contract
- recording
- participants
- analysis
- report
- verification

UI 상태:

- 현재 화면 step
- 현재 device/mode
- loading 여부
- toast 메시지
- error 메시지
- modal 상태

### 2.2 DB가 진실의 원천이다

서비스 단계에서는 localStorage가 진짜 상태가 아니다.

역할 구분:

| 저장 위치 | 역할 |
|---|---|
| DB | 실제 세션, 계약서, 분석, 리포트 상태 저장 |
| FastAPI | DB 상태를 API 응답으로 제공 |
| 프론트 state | 서버 응답을 기반으로 화면 렌더링 |
| localStorage | 마지막 session_id, UI 보조 상태 캐시 |

### 2.3 버튼 클릭은 state를 직접 바꾸지 않는다

기존 데모 구조에서는 버튼 클릭 시 프론트 state를 직접 변경했다.

예시:

- state.contractor.verified = true
- goTo("waiting")

서비스 구조에서는 API 요청 후 서버 응답을 state에 반영해야 한다.

예시:

- const session = await SessionApi.verifyParticipant(sessionId, "contractor")
- Store.applySession(session)
- render()

---

## 3. 목표 state 구조

최종 목표 구조는 다음과 같다.

- state.session
- state.contract
- state.recording
- state.participants
- state.analysis
- state.report
- state.verification
- state.ui

### 3.1 session

세션 전체 생명주기를 관리한다.

필드:

- id
- status
- createdAt
- updatedAt
- expiresAt

예상 status:

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

### 3.2 contract

계약서 파일 상태를 관리한다.

필드:

- fileName
- fileSize
- mimeType
- hash
- uploadedAt
- locked

### 3.3 recording

녹취 파일 또는 녹취 결과 상태를 관리한다.

필드:

- fileName
- fileSize
- mimeType
- hash
- durationSec
- uploadedAt
- status

### 3.4 participants

계약자와 설명자의 본인확인 및 동의 상태를 관리한다.

역할:

- contractor
- explainer

각 참여자 필드:

- role
- name
- verified
- consent
- rejected
- verifiedAt
- consentedAt

### 3.5 analysis

AI 분석 작업 상태를 관리한다.

필드:

- jobId
- status
- progress
- startedAt
- completedAt
- error

예상 status:

- idle
- pending
- processing
- completed
- failed

### 3.6 report

AI 분석 결과 리포트 상태를 관리한다.

필드:

- id
- hash
- riskLevel
- summary
- mismatches
- questions
- createdAt

### 3.7 verification

QR 검증 및 공개 검증 페이지 상태를 관리한다.

필드:

- id
- status
- qrUrl
- publicUrl
- verifiedAt

공개 검증 페이지에는 개인정보와 원문 파일을 노출하지 않는다.

노출 가능 정보:

- 검증 상태
- 계약서 해시
- 녹취 해시
- 리포트 해시
- 생성 시각
- 위변조 여부
- 핵심 위험 요약

### 3.8 ui

화면 표시만을 위한 상태다.

필드:

- step
- mode
- device
- loading
- toastText
- error
- activeModal

---

## 4. 기존 상태에서 신규 상태로의 매핑

| 기존 state | 신규 state |
|---|---|
| state.sessionId | state.session.id |
| state.contractFile | state.contract.fileName |
| state.contractHash | state.contract.hash |
| state.recordingHash | state.recording.hash |
| state.transcriptHash | 추후 transcript 모델 또는 report 내부로 분리 |
| state.reportHash | state.report.hash |
| state.contractor | state.participants.contractor |
| state.explainer | state.participants.explainer |
| state.mismatches | state.report.mismatches |
| state.questions | state.report.questions |
| state.events | 추후 auditLog 또는 timeline 모델로 분리 |
| state.step | state.ui.step |
| state.mode | state.ui.mode |
| state.device | state.ui.device |
| state.toastText | state.ui.toastText |

---

## 5. localStorage 정책

서비스 단계에서 localStorage에는 민감한 원문 데이터를 저장하지 않는다.

저장 가능:

- 마지막 session_id
- 마지막 접근 step
- UI mode/device
- 비민감한 사용자 설정

저장 금지:

- 계약서 원문
- 녹취 원문
- STT 전문
- 개인정보
- 신분확인 정보
- 전체 AI 분석 원문

---

## 6. 리팩터링 순서

1. 기존 BASE_STATE를 바로 삭제하지 않는다.
2. 신규 state 구조를 문서 기준으로 추가한다.
3. API 응답을 신규 state 구조로 변환하는 adapter를 만든다.
4. actions.js에서 직접 state 변경을 줄인다.
5. Store.applySession(), Store.setUiState() 같은 상태 변경 함수를 만든다.
6. 화면 렌더링 함수가 신규 state 구조를 읽도록 점진 전환한다.
7. 기존 state 필드는 마지막 단계에서 제거한다.

---

## 7. 완료 기준

2단계 완료 기준:

- 서비스형 state 구조가 문서화됨
- 기존 state와 신규 state의 매핑이 정리됨
- localStorage 사용 원칙이 정리됨
- 서버 데이터와 UI 상태의 책임이 분리됨
