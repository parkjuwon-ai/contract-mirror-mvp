# Contract Mirror UI Prototype

계약미러 MVP의 UI/UX 흐름을 HTML/CSS/JavaScript로 구현한 정적 프론트 프로토타입입니다.
FastAPI 프로젝트에 바로 붙일 수 있도록 `app/templates`, `app/static` 구조로 구성했습니다.

## 포함된 화면

- 시작 화면
- 계약 설명방 만들기
- 초대번호 / QR 화면
- 초대받은 사람 입장 화면
- 역할 확인 화면
- 모바일 신분증 Mock 본인확인 화면
- 녹취·AI 분석·검증 기록 동의 화면
- 동의 영수증 화면
- 양쪽 본인확인/동의 대기실
- 실패 시나리오 화면
- 녹취 시작/진행/종료 화면
- 계약서 업로드 화면
- AI 분석 중 화면
- AI 분석 결과 3단 비교 화면
- AI 면책 확인 화면
- 리포트 완료 화면
- QR 검증 화면
- 심사위원용 신뢰 로그 패널

## 실행 방법

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

브라우저에서 아래 주소로 접속합니다.

```text
http://127.0.0.1:8000
```

## 기존 GitHub 저장소에 넣는 방법

기존 저장소 루트에서 압축을 풀고 아래 파일을 추가/교체하세요.

```text
app/main.py
app/templates/index.html
app/static/css/styles.css
app/static/js/app.js
requirements.txt
```

그 다음 커밋합니다.

```bash
git add app/main.py app/templates/index.html app/static/css/styles.css app/static/js/app.js requirements.txt README.md docs/ui_integration_guide.md
git commit -m "Add Contract Mirror UI prototype"
git push origin main
```

## 나중에 기능 붙일 지점

현재 JavaScript의 `state` 객체가 Mock DB 역할을 합니다.
나중에는 아래 API로 분리하면 됩니다.

- `POST /api/sessions` : 계약 설명방 생성
- `POST /api/sessions/{session_id}/participants` : 참여자 입장
- `POST /api/sessions/{session_id}/identity/verify` : 모바일 신분증 인증 결과 저장
- `POST /api/sessions/{session_id}/consents` : 녹취/AI/해시 기록 동의 저장
- `POST /api/sessions/{session_id}/recordings` : 녹취 파일 저장 및 해시 생성
- `POST /api/sessions/{session_id}/documents` : 계약서 업로드
- `POST /api/sessions/{session_id}/analysis` : AI 분석 실행
- `POST /api/sessions/{session_id}/reports` : 리포트 생성
- `GET /api/sessions/{session_id}/trust-log` : 심사위원용 신뢰 로그 조회
- `GET /verify/{report_id}` : QR 검증 화면

## 중요한 표기 원칙

아직 실제 연동이 아닌 기능은 완료처럼 보이지 않도록 아래 상태값을 사용했습니다.

- `identity_verified_mock`
- `hash_generated_local`
- `chain_anchor_simulated`
- `ready_to_integrate_omnione`

