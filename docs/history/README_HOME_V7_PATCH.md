# Contract Mirror Home V7 Flow Polish

반영 내용:

- 첫 화면 브랜드 중복 제거: 내부 `계약미러` 텍스트 삭제, 기능 칩만 유지
- 첫 화면 진행 흐름 추가: `계약서 등록 → 설명 녹취 → AI 분석 → 질문 리포트`
- 비교 카드 재디자인: `수익 안정` / `책임 없음`, 차분한 균열선, 충돌 배지 하단 분리
- 예시 질문 카드 강조: `AI가 바꾼 질문` 라벨과 밝은 질문 카드
- 하단 sticky CTA 유지: `계약 설명 검증 시작하기` / `초대 코드`
- 계약서 등록/확인 화면 Step 1/4 표시
- 큰 하단 이전 버튼 제거, 상단 작은 뒤로가기 버튼으로 이동
- 파일 확인 카드에 X 버튼 추가
- 다음 버튼을 `다음: 참여자 초대하기` 등 행동형 문구로 변경

실행:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

홈 상태가 저장되어 있으면 브라우저 콘솔에서:

```js
localStorage.removeItem("contractMirrorV6_12SimplifiedCoreFlowState");
location.reload();
```
