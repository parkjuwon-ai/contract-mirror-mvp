# CSS 현황 점검 문서

## 현재 CSS 진입점

`app/templates/index.html`에서 아래 CSS 파일을 불러온다.

    <link rel="stylesheet" href="/static/css/style.css?v={{ app_version }}" />

## CSS 의존 구조

`app/static/css/style.css`는 내부에서 아래 파일을 다시 불러온다.

    @import url("/static/css/legacy-ui.css?v=v24-recording-processing-polish");

즉 현재 구조는 다음과 같다.

    index.html
      └── style.css
            └── legacy-ui.css

## CSS 파일 현황

| 파일 | 줄 수 | 역할 |
|---|---:|---|
| `app/static/css/legacy-ui.css` | 7,820 | 기존 UI 스타일이 누적된 레거시 기준 파일 |
| `app/static/css/style.css` | 980 | 현재 MVP 화면을 위한 최신 덮어쓰기 파일 |

## 정리 원칙

- 템플릿에서 직접 불러오는 CSS는 `style.css` 하나로 유지한다.
- `legacy-ui.css`는 당분간 삭제하지 않고 기준 파일로 고정한다.
- 전체 화면 회귀 테스트 전에는 `legacy-ui.css`를 제거하지 않는다.
- JavaScript에서 렌더링하는 class 이름은 함부로 바꾸지 않는다.
- 대회 전에는 과감한 삭제보다 안전한 범위의 덮어쓰기와 구조 정리를 우선한다.

## 현재 판단

현재 CSS는 파일 수는 적지만, `legacy-ui.css`에 과거 스타일이 많이 누적되어 있다.  
`style.css`는 그 위에 최신 MVP 스타일을 덮어쓰는 역할을 한다.

따라서 이번 CSS 정리의 목표는 `legacy-ui.css`를 바로 삭제하는 것이 아니라,  
현재 구조를 명확히 문서화하고 이후 정리 기준을 세우는 것이다.
