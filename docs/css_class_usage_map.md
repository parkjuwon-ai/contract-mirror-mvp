# CSS class 사용 현황 맵

## 목적

이 문서는 Contract Mirror MVP에서 CSS class가 어디에서 생성되고 사용되는지 기록하기 위한 문서다.

현재 MVP는 HTML 템플릿뿐 아니라 JavaScript 화면 렌더링 코드 안에서도 많은 class를 직접 생성한다.  
따라서 CSS 정리 과정에서 class 이름을 함부로 변경하거나 삭제하면 특정 화면이 깨질 수 있다.

## 현재 확인 결과

다음 명령으로 class 사용 위치를 확인했다.

    grep -R "class=" -n app/templates app/static/js > /tmp/contract_mirror_class_usage.txt
    wc -l /tmp/contract_mirror_class_usage.txt
    head -120 /tmp/contract_mirror_class_usage.txt

확인된 class 사용 라인 수:

    452

## 주요 class 사용 위치

### 템플릿

- `app/templates/index.html`

`index.html`은 전체 앱 shell, topbar, phone frame, trust panel, control panel 등의 기본 레이아웃 class를 포함한다.

주요 예시:

    app-shell
    topbar
    brand
    phase-pill
    ghost-link
    workspace
    main-stage
    phone-frame
    phone-screen
    trust-panel
    control-panel

### JavaScript 렌더링 화면

다음 경로의 JavaScript 파일들은 HTML 문자열을 생성하면서 CSS class를 함께 사용한다.

- `app/static/js/app.js`
- `app/static/js/bootstrap.js`
- `app/static/js/actions.js`
- `app/static/js/screens/`

특히 아래 파일들은 화면별 class 의존도가 높다.

- `app/static/js/screens/supportScreens.js`
- `app/static/js/screens/judgeScreens.js`
- `app/static/js/screens/resultScreens.js`
- `app/static/js/screens/contractFlowScreens.js`
- `app/static/js/screens/recordingScreens.js`
- `app/static/js/screens/analysisScreens.js`

## 고위험 class 유형

아래 유형의 class는 CSS 정리 시 특히 주의해야 한다.

### 1. JavaScript 문자열 안에서 생성되는 class

JS 코드 안에서 문자열 형태로 렌더링되는 class는 정적 HTML만 보고는 사용 여부를 판단하기 어렵다.

예시 유형:

    class="..."
    class='...'
    element.className = "..."

### 2. 버전 번호가 붙은 class

이전 MVP 화면 개선 과정에서 만들어진 버전형 class가 남아 있다.

예시 유형:

    *-v12
    *-v13
    *-v15
    *-v612

이런 class는 이름만 보면 오래되어 보이지만, 현재 화면에서 여전히 사용 중일 수 있다.

### 3. 결과 리포트 / 검증 카드 / 심사위원 화면 관련 class

아래 화면들은 대회 시연에서 중요하므로 CSS 삭제 전 반드시 화면 확인이 필요하다.

- 결과 리포트 화면
- QR / 검증 카드 화면
- 심사위원용 화면
- 녹취 처리 화면
- 계약서 분석 화면
- 사후 확인 문서 화면

## 정리 원칙

- CSS class 이름은 먼저 검색한 뒤 변경한다.
- JavaScript에서 렌더링하는 class는 삭제하지 않는다.
- 버전형 class는 오래되어 보여도 즉시 삭제하지 않는다.
- 화면 단위 회귀 확인 전에는 `legacy-ui.css`의 class를 대량 삭제하지 않는다.
- 이번 MVP 안정화 단계에서는 삭제보다 구조 파악과 안전한 override 정리를 우선한다.

## 현재 판단

현재 CSS 정리는 class rename이나 대량 삭제 단계가 아니다.  
먼저 실제 사용 위치를 확인하고, 위험도가 높은 class를 문서화한 뒤, 화면 단위로 점진 정리해야 한다.
