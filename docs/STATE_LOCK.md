# Contract Mirror v32 State Lock

이 문서는 해커톤 전 프론트엔드 상태 관리 기준을 고정하기 위한 문서입니다. v32 이후에는 화면을 더 예쁘게 만드는 수정보다, 상태값이 저장·복원·초기화될 때 화면 흐름이 꼬이지 않는지를 먼저 확인합니다.

## 1. 상태 관리 목표

```text
기본 상태는 한 곳에서 만든다.
저장 가능한 상태와 임시 UI 상태를 분리한다.
저장된 상태를 복원할 때 유효하지 않은 화면/기기/모드는 기본값으로 되돌린다.
새 계약 검증이나 동의 초기화는 정해진 함수만 사용한다.
```

## 2. 기준 함수

| 함수/상수 | 역할 |
|---|---|
| `BASE_STATE` | 데모의 기본 데이터와 초기 상태 기준 |
| `createDefaultState()` | 라우트 부트 정보가 반영된 기본 상태 생성 |
| `normalizeSavedState(savedState)` | localStorage에서 복원한 상태를 안전한 형태로 정규화 |
| `PERSISTED_STATE_KEYS` | localStorage에 저장해도 되는 상태 목록 |
| `createPersistedSnapshot()` | 저장 가능한 상태만 추출 |
| `replaceState(nextState)` | 현재 state를 정규화된 상태로 교체 |
| `resetDemoState(targetStep)` | 새 계약 검증/전체 초기화 기준 함수 |
| `resetConsentState()` | 양측 동의 상태만 초기화하는 기준 함수 |

## 3. 저장하지 않는 임시 상태

아래 값은 화면을 일시적으로 보여주기 위한 값이므로 localStorage에 저장하지 않습니다.

```text
processingTimer
toastText
vaultSheet
trustOpen
mismatches 원본 변경값
```

## 4. 저장하는 상태

`PERSISTED_STATE_KEYS`에 포함된 값만 저장합니다. 새 상태를 추가할 때는 아래 질문을 먼저 확인합니다.

```text
브라우저를 새로고침해도 유지되어야 하는가?
다른 화면으로 이동해도 유지되어야 하는가?
토스트/모달/타이머 같은 임시 UI 상태는 아닌가?
```

위 질문에 모두 맞을 때만 `PERSISTED_STATE_KEYS`에 추가합니다.

## 5. 수정 원칙

1. `state`에 새 값을 추가할 때는 `BASE_STATE`에도 같은 기본값을 추가합니다.
2. 새 값이 저장되어야 하면 `PERSISTED_STATE_KEYS`에 추가합니다.
3. 저장된 값이 잘못될 가능성이 있으면 `normalizeSavedState()`에서 검증합니다.
4. 새 계약 검증은 `resetDemoState()`를 통해 처리합니다.
5. 양측 동의 초기화는 `resetConsentState()`를 통해 처리합니다.
6. 화면 이동은 계속 `goTo()`를 사용합니다.


## v33 Flow Bugfix
- UI step is now treated as route/tab-local state to prevent participant tabs from resetting the host flow.
- `go-mobile-report` and `go-report` now mark AI processing complete before navigating to the report.
- Storage sync updates shared consent/report data without forcing the current tab to another screen.
