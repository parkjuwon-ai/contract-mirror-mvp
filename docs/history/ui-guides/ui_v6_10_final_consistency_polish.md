# Contract Mirror UI v6.10 — Final Consistency & Mobile Header Polish

## 현재 단계
- v6.9까지 사용자 보호 흐름, 결과 질문, 추가 문서, 검증 카드, judge 대시보드 구조를 구축했습니다.
- v6.10은 다음 단계인 **6단계: 최종 일관성 / Judge·모바일 마감 안정화**의 첫 hotfix입니다.

## 반영 내용
1. 모바일 목업 상단바 색상 통일
   - 폰 외곽, 노치, 상단바가 따로 노는 문제를 제거했습니다.
   - `계약 확인 기록`, `본인확인`, `계약 내용을 설명하는 사람` 주변 회청색 띠를 진한 네이비 계열로 통일했습니다.

2. 첫 화면 CTA 원칙 유지
   - 첫 화면에서는 상단 보조 상태를 숨기고 하단 Primary CTA 하나만 남기는 원칙을 유지합니다.

3. report / verify / judge 침범 방지
   - 모바일 기기 헤더 polish가 `/report`, `/verify`, `/judge` 대시보드 레이아웃에 영향을 주지 않도록 방어 CSS를 추가했습니다.

## 확인 기준
- `/`, `/participant/contractor`, `/participant/explainer`에서 폰 상단바가 회청색으로 튀지 않아야 합니다.
- `/report`, `/verify`, `/judge`는 기존 반응형 리포트/대시보드 구조를 유지해야 합니다.
