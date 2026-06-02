# Contract Mirror UI v5.2 Hybrid Evidence Workspace

## 목적

v5.2는 v5.1의 증거 리포트 요소를 유지하면서, PC 웹 화면에서 “모바일 앱을 띄운 것”처럼 보이던 약점을 줄이기 위한 하이브리드 레이아웃입니다.

핵심 원칙은 다음과 같습니다.

- 계약 현장 플로우: 모바일형 유지
- 결과 리포트: PC에서는 넓은 증거 리포트로 확장
- QR 검증 카드: 완료 화면이 아니라 세션 검증 결과처럼 표시
- 심사위원 모드: Raw Log보다 Trust Summary를 먼저 표시

## 주요 변경

1. 사용자 첫 화면을 웹 랜딩형 구조로 변경
2. AI 결과 화면을 데스크톱 증거 리포트 레이아웃으로 확장
3. 녹취 발언과 계약서 조항의 좌우 비교 구조 강화
4. 검증 카드를 “계약 설명 세션 검증 결과”로 강화
5. `/judge`에서 Trust Summary를 Raw Trust Log 위에 배치
6. Raw Log 완료 항목에 시각적 하이라이트 추가
7. 모바일에서는 단계형 현장 도구 UX를 유지

## 확인 URL

- `/` 사용자 첫 화면
- `/judge` 심사위원 기술 검증 모드
- `/participant/contractor` 계약자 참여 화면
- `/participant/explainer` 설명자 참여 화면

## 커밋 추천 메시지

```bash
git commit -m "feat: add hybrid evidence workspace UI"
```
