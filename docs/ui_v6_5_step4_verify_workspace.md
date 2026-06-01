# Contract Mirror UI v6.5 Step 4 — Verify Workspace

## 목적

v6.5는 v6 Responsive MVP의 4단계로, `/verify/{session_id}` 검증 카드 화면을 독립 사후 검증 화면처럼 정리한 버전입니다.

## 핵심 변경

- `/report/{session_id}` 라우트 추가
- `/verify/{session_id}` 라우트 정리
- 검증 카드 화면을 독립 감사 리포트형 레이아웃으로 강화
- 기록 무결성 정상과 계약 내용 위험 탐지를 명확히 분리
- 기술 검증 정보는 기본 접힘으로 이동
- QR 패널을 우측 검증 카드 영역으로 고정
- 결과 화면 CTA 위계 재보강

## UX 원칙

- 현장 입력은 모바일 웹
- 결과 검토는 반응형 리포트
- 사후 검증은 Verify Workspace
- 심사위원 검증은 Trust Audit Dashboard

## 데모 라우트

- `/` 사용자 모바일 현장 플로우
- `/report/CM-20260601-001` AI 불일치 리포트
- `/verify/CM-20260601-001` 계약 설명 검증 카드
- `/judge` 심사위원 Trust Audit Dashboard
