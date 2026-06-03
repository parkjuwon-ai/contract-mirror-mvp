# Contract Mirror Home V10 Final Flow Polish

이번 패치는 UI/UX 흐름 이해도와 데스크톱 전환 맥락을 정리합니다.

## 반영 내용

- 모바일 Step 라벨과 화면 제목을 한 줄로 정리
- 사용자 화면의 기술명 노출 완화: `원본 해시` → `기록 확인/계약서 기준 기록`
- 분석 완료 브릿지에서 `모바일 현장 확인 → PC 상세 검토` 흐름 강조
- 검증 카드/리포트 화면 전환 시 스크롤이 상단으로 초기화되도록 보정
- PC 리포트 상단 여백 축소
- 검증 카드 화면 좌측 여백 보정

## 실행

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```
