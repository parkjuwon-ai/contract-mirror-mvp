# Contract Mirror v32 Flow Lock

이 문서는 해커톤 전 코드 안정화를 위해 현재 사용자 플로우와 화면 전환 기준을 고정한 문서입니다. v32 이후에는 새 화면을 추가하기보다 `goTo()` 이동 원칙과 `BASE_STATE` 상태 기준이 깨지지 않는지 먼저 확인합니다.

## 1. 고정된 핵심 플로우

```text
홈
→ 계약서 파일 등록
→ 등록된 계약서 확인
→ 설명자 초대
→ 양측 준비 상태 확인
→ 설명 녹취
→ AI 분석
→ 상세 검증 리포트
→ 사후 확인 문서 선택
→ 최종 확인 카드
→ 리포트로 돌아가기 또는 새 계약 검증
```

## 2. 화면 상태 목록

`app/static/js/app.js`의 `SCREEN_STEPS`와 같은 목록을 기준으로 합니다.

| step | 역할 |
|---|---|
| `start` | 첫 화면 |
| `create` | 세션 생성 안내 |
| `upload` | 계약서 파일 등록 |
| `lock` | 등록된 계약서 확인 |
| `invite` | 설명자 초대 코드 |
| `waiting` | 양측 준비 상태 확인 |
| `identity` | 참여자 본인확인 |
| `consent` | 녹취·AI 분석 동의 |
| `recording` | 설명 녹취 |
| `processing` | AI 분석 진행 |
| `report` | 상세 검증 리포트 |
| `addendum` | 사후 확인 문서 선택 |
| `verify` | 최종 확인 카드 |
| `failure` | 동의 거부/진행 불가 |
| `invite-code` | 초대 코드 입력 |
| `participant-consent` | 초대 참여자 동의 |
| `participant-ready` | 초대 참여자 준비 완료 |
| `participant-recording` | 초대 참여자 녹취 참여 |
| `participant-done` | 초대 참여자 참여 완료 |

## 3. 주요 버튼 이동 기준

| 버튼/액션 | 기대 이동 |
|---|---|
| `계약 설명 검증 시작하기` | `upload` |
| `계약서 파일 불러오기` | `lock` |
| `다음: 참여자 초대하기` | `invite` |
| `양측 준비 상태 확인하기` | `waiting` |
| `설명 녹취 시작하기` | `recording` |
| `녹취 종료 후 AI 분석 시작하기` | `processing` |
| `모바일에서 리포트 보기` | `report` |
| `이 리포트로 확인 카드 만들기` | `verify` |
| `추가확인문서 첨부하기` | `addendum` |
| `최종 확인 카드 만들기` | `verify` |
| `리포트로 돌아가기` | `report` |
| `새 계약 검증하기` | `start` 새 세션 |

## 4. v32 이후 수정 원칙

1. 화면 이동은 `goTo(step)`을 통해서만 처리합니다.
2. 버튼 핸들러에서 직접 `state.step`을 바꾸지 않습니다.
3. 화면 전환 시 스크롤 초기화, 처리 타이머 정리, 렌더링은 `goTo()`가 담당합니다.
4. 같은 화면 내부 업데이트는 `render({ forceScrollToTop: false })`를 우선 사용합니다.
5. 버튼명과 실제 이동 결과가 다르면 버튼명을 먼저 고칩니다.
6. `legacy-ui.css`는 수정하지 않습니다.
7. `style.css`에서는 기존 컴포넌트 규칙을 재사용하고, 새 클래스를 만들 때는 의미가 분명해야 합니다.
8. 리포트·최종 확인 카드의 핵심 메시지는 유지합니다.
   - 리포트: 설명-계약서 충돌 → AI 판단 → 확인 질문
   - 최종 카드: 검증 기록 ID → 대표 확인 지점 → QR/링크 검증


## 5. 화면 이동 책임

`app/static/js/app.js`의 화면 이동은 아래 구조를 기준으로 합니다.

```text
handleAction()
→ route[action]()
→ goTo(NAVIGATION_TARGETS.XXX)
→ render()
```

`goTo()`가 담당하는 일은 다음과 같습니다.

```text
- 존재하는 화면 상태인지 확인
- 진행 중인 AI 분석 타이머 정리
- state.step 변경
- processing 화면 진입 시 분석 타이머 시작
- 화면 전환 시에만 스크롤 초기화
```

`setStep()`은 과거 코드 호환용 별칭으로만 남겨두며, 새 수정에서는 사용하지 않습니다. 상태 초기화와 저장/복원 기준은 `docs/STATE_LOCK.md`를 따릅니다.

## 6. 제출 전 체크

```bash
bash tools/health_check.sh
```

이 스크립트가 통과해야 제출용 ZIP으로 묶습니다.


## v33 Flow Bugfix
- UI step is now treated as route/tab-local state to prevent participant tabs from resetting the host flow.
- `go-mobile-report` and `go-report` now mark AI processing complete before navigating to the report.
- Storage sync updates shared consent/report data without forcing the current tab to another screen.


## v34 Route Render Bugfix Lock

- `/report/{session_id}` must boot directly into the report screen.
- `/verify/{report_id}` must boot directly into the verify card screen.
- `/addendum/{session_id}` must boot directly into the addendum screen.
- `go-mobile-report`, `go-report`, `go-verify`, and `go-addendum` must not depend on stale localStorage step state.
- `confirmationQuestions` is a required frontend symbol because report, verify, and copy actions depend on it.
