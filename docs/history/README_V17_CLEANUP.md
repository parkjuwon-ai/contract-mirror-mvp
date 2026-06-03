# Contract Mirror v17 Cleanup

목표는 새 기능 추가가 아니라 제출 전 안정화입니다.

## 정리 기준

- 실제 실행에 필요한 앱 파일은 보존합니다.
- 과거 버전 문서는 `docs/history/`로 이동합니다.
- `app/static/css/style.css`는 최종 진입점으로 유지합니다.
- 누적된 과거 CSS는 `app/static/css/legacy-ui.css`로 분리합니다.
- 급한 UI 수정은 `style.css` 하단의 v17 Cleanup Layer에서만 합니다.
- `app/static/css/styles.css`, `__pycache__`, `*.pyc`는 제거 대상입니다.

## 로컬 적용 후 권장 명령

```bash
bash tools/apply_v17_cleanup_local.sh
git status
uvicorn app.main:app --reload
```
