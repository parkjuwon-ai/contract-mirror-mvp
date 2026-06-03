# Contract Mirror UI v6.0 Step 1 - Responsive Foundation

## 목표
- 현장 기록은 모바일 웹, 사후 검증은 웹 리포트, 심사위원 검증은 Trust Audit Dashboard로 역할을 분리한다.
- 사용자 화면은 PC에서 스마트폰 미러링 데모처럼 보이게 하고, 모바일에서는 실제 모바일 화면처럼 보이게 한다.
- 결과 화면에는 다음 행동 버튼을 추가한다.
- 사용자 화면에서 mock/sample/demo 표현 노출을 최소화한다.
- 모바일 프레임 내부 스크롤바를 숨긴다.

## 반영 내용
1. 사용자 `/` 화면에 모바일 현장 플로우 라벨 추가
2. 데스크톱에서 phone-frame을 스마트폰 목업처럼 정리
3. 모바일에서는 outer phone-frame을 제거해 실제 모바일 웹처럼 표시
4. `/report`, `/verify` 성격의 evidence screen은 PC/태블릿에서 넓은 리포트형으로 확장
5. 결과 화면에 `검증 카드 생성하기`, `검증 리포트 저장하기`, `재설명 요청하기` 버튼 추가
6. 사용자 화면에서 기술/PoC 표현은 숨기고, 심사위원 화면에서만 정직하게 표시
7. phone-screen scrollbar 숨김 처리
