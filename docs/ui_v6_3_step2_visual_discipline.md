# Contract Mirror UI v6.3 Step 2 — Visual Discipline & Waiting Control Tower

## 목적
v6.3 Step 2는 v6 Responsive MVP의 두 번째 단계로, 사용자 모바일 현장 플로우의 시각적 완성도와 대기 화면의 신뢰감을 강화한다.

## 반영 내용

1. **Device Mockup 강화**
   - PC 데모에서 사용자 모바일 플로우가 스마트폰 미러링 화면처럼 보이도록 다크 그레이 테두리, 라운드, 그림자를 적용했다.
   - 실제 모바일 접속에서는 외부 목업 테두리를 제거하고 네이티브 모바일 웹처럼 보이게 했다.

2. **Color Desaturation**
   - 배경을 쿨그레이 계열로 조정했다.
   - 위험/성공/대기 색상을 버건디, 틸, 번트 오렌지 계열로 낮춰 B2B·감사 리포트 톤에 맞췄다.

3. **Whitespace & Typography 개선**
   - 카드와 박스 내부 padding을 확대해 정보 간 충돌을 줄였다.
   - 제목은 굵게, 본문은 정갈하게 읽히도록 위계를 정리했다.

4. **대기 화면 구조조정**
   - 세로형 대기 리스트를 제거하고, 계약자/설명자 두 개의 큼직한 상태 카드로 재구성했다.
   - 설명자 대기 상태에는 스피너 애니메이션을 적용해 시스템이 정상적으로 기다리고 있음을 보여준다.

5. **모바일 화면 항상 상단 정렬**
   - 단계 전환 후 `.phone-screen`의 scrollTop을 0으로 되돌리도록 처리했다.
   - 사용자 모드에서는 페이지 자체도 상단으로 정렬된다.

## 적용 파일
- `app/templates/index.html`
- `app/static/css/style.css`
- `app/static/css/styles.css`
- `app/static/js/app.js`
