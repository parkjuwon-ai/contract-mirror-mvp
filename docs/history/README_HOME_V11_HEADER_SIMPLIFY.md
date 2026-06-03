# Contract Mirror Home V11 Header Simplification

반영 내용:

1. 진행 화면의 네이비 상단바 흰 글씨 제거
   - 본문 Step 라인과 중복되는 `계약 확인 기록 / 초대 / 녹취 중`류 텍스트를 숨김
   - 네이비 영역은 기기 프레임 역할만 수행

2. Step + 제목 색상 통일
   - `Step 2 / 4 · 참여자 초대 및 동의`가 하나의 진행 타이틀처럼 보이도록 제목 색상을 민트/청록 계열로 통일

3. 상단 여백 보정
   - 상단바 텍스트 제거 후 본문이 과하게 내려오지 않도록 진행 화면의 상단 padding 축소

검사:

```bash
node --check app/static/js/app.js
python3 -m py_compile app/main.py
```
