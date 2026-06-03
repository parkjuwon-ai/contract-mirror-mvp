# V16 Phone Frame Consistency + Responsive Patch

수정 범위는 두 가지입니다.

1. `/`, 리포트 이전 계약자 플로우, 설명자 플로우의 데스크톱 핸드폰 목업 크기를 첫 화면 기준으로 통일했습니다.
2. 실제 모바일 폭(`max-width: 767px`)에서는 핸드폰 목업 테두리, 노치, 상태바, 데모 안내 라벨, 상단바를 제거하고 화면 전체를 쓰는 웹앱 형태로 전환되도록 정리했습니다.

주요 변경 파일:

- `app/static/css/style.css`
- `app/templates/index.html`
