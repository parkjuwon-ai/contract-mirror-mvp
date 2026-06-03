# Contract Mirror Home V6 Patch

이번 정리본은 첫 화면 코드 꼬임을 정리하고, 홈 화면을 다음 기준으로 재구성했습니다.

- 본문 중복 CTA 제거
- 하단 고정 CTA 항상 표시
- 메인 CTA: `내 계약 설명 확인하기`
- 보조 CTA: `초대 코드`
- 비교 카드 문구를 `수익 안정` / `책임 없음`으로 압축
- 조잡한 번개형 SVG를 얇은 균열선으로 교체
- `충돌 가능성 감지` 배지를 카드 사이가 아니라 비교 카드 아래로 분리
- 이전 패치 백업 파일과 accidental demo artifact 제거

실행:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

홈 화면 확인:

```text
http://127.0.0.1:8000
```
