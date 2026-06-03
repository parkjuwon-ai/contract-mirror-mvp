# Project Structure

```text
contract-mirror-mvp/
├── app/
│   ├── main.py
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/
│       │   ├── legacy-ui.css
│       │   └── style.css
│       └── js/
│           └── app.js
├── data/
│   └── sample_case.md
├── docs/
│   ├── DEVELOPMENT_RULES.md
│   ├── PROJECT_STRUCTURE.md
│   └── history/
├── tools/
│   ├── apply_v18_cleanup_local.sh
│   └── health_check.sh
├── README.md
├── requirements.txt
└── roadmap.md
```

## 역할 분리

### `app/main.py`

FastAPI 라우트만 담당합니다. 각 URL은 같은 `index.html`을 렌더링하되, `initial_device`, `initial_step`, `initial_mode`를 다르게 넘깁니다.

### `app/templates/index.html`

화면의 고정 뼈대입니다. 실제 화면 내용은 대부분 JS가 `#screen` 안에 렌더링합니다.

### `app/static/js/app.js`

현재 MVP의 핵심 데모 로직입니다. 실제 DB 대신 `state` 객체와 `localStorage`를 사용합니다.

### `app/static/css/legacy-ui.css`

과거 UI 패치가 누적된 기반 스타일입니다. 지금 당장 지우면 화면이 깨질 수 있으므로 보존합니다.

### `app/static/css/style.css`

현재 최종 보정 레이어입니다. 목업 크기 통일, 실제 모바일 전환 같은 발표 직전 수정은 여기에서 처리합니다.
