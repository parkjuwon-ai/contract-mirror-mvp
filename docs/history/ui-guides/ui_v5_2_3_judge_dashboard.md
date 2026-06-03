# Contract Mirror UI v5.2.3 Judge Dashboard Hard Split

## 목표

- 사용자 `/` 화면은 모바일 현장 플로우로 유지
- 심사위원 `/judge` 화면은 독립 PC 검증 대시보드로 분리
- 기존 사용자용 stepper/phone frame/CTA가 심사위원 화면의 중심이 되지 않도록 조정

## 변경 사항

- `/judge`에서 기존 floating Trust Panel 비활성화
- Trust Summary와 Raw Trust Log를 대시보드 오른쪽 고정 컬럼으로 내장
- 중앙 영역을 AI 불일치 리포트 중심으로 재배치
- 왼쪽 영역을 사용자 단계가 아닌 검증 이벤트 타임라인으로 재구성
- 사용자 모바일 플로우는 `/` 및 `/participant/*`에서 유지
